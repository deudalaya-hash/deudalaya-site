import os, sys, json, hashlib, subprocess, time, math, re
from pathlib import Path

ROOT = Path(r"C:\deudalaya")
OUT = ROOT / "video-library" / "optimized-2mb"
RUN = ROOT / "video-library" / "benchmarks" / "optimization-2mb-20261115T200947"
REPORT = RUN / "optimization-report.json"
PROGRESS = RUN / "progress.json"
MAX_BYTES = 2_000_000
START_CRF = 18
MAX_CRF = 27
MIN_VMAF = 80.0
MAXRATE = "1200k"
BUFSIZE = "2400k"

OUT.mkdir(parents=True, exist_ok=True)
(RUN / "candidates").mkdir(parents=True, exist_ok=True)
previous_report = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() else {}
resume_by_out = {x.get("output"):x for x in previous_report.get("outputs", [])
                 if x.get("status")=="optimized" and x.get("output_sha256")}

def cmd(args, timeout=3600):
    return subprocess.run([str(x) for x in args], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)

def probe(path):
    r = cmd(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,avg_frame_rate,bit_rate,channels,sample_rate,duration,start_time","-of","json","--",path])
    if r.returncode:
        raise RuntimeError("ffprobe failed: " + (r.stderr[-1000:] or "unknown error"))
    j=json.loads(r.stdout); streams=j.get("streams",[])
    v=next((s for s in streams if s.get("codec_type")=="video"),None)
    a=next((s for s in streams if s.get("codec_type")=="audio"),None)
    if not v: raise RuntimeError("no video stream")
    return {"duration":float(j["format"]["duration"]),"bytes":int(j["format"].get("size",Path(path).stat().st_size)),
            "video":v,"audio":a}

def sha(path):
    h=hashlib.sha256()
    with open(path,"rb") as f:
        for b in iter(lambda:f.read(1024*1024),b""): h.update(b)
    return h.hexdigest()

def write_json(path,obj):
    tmp=Path(str(path)+".tmp")
    tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2),encoding="utf-8")
    os.replace(tmp,path)

def ffmpeg_error(args, timeout=3600):
    r=cmd(args, timeout=timeout)
    if r.returncode: raise RuntimeError((r.stderr or r.stdout)[-2000:] or f"ffmpeg exit {r.returncode}")
    return r

def get_dims(w,h):
    boxw,boxh=(854,480) if w>=h else (480,854)
    scale=min(boxw/w,boxh/h,1.0)
    ow=max(2,int(round(w*scale/2))*2)
    oh=max(2,int(round(h*scale/2))*2)
    return min(ow,boxw),min(oh,boxh)

def metric_vmaf(src,start,duration,out,w,h):
    if duration < 1.0: return None
    graph=(f"[0:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,fps=24,"
           f"scale={w}:{h}:flags=lanczos,settb=1/24[ref];"
           f"[1:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,settb=1/24[dist];"
           "[ref][dist]libvmaf")
    r=cmd(["ffmpeg","-hide_banner","-loglevel","info","-ss",f"{start:.6f}","-i",src,"-i",out,
           "-filter_complex",graph,"-an","-t",f"{duration:.6f}","-f","null","NUL"],timeout=600)
    text=r.stderr+r.stdout
    m=re.search(r"VMAF score:\s*([0-9.]+)",text)
    if r.returncode or not m:
        raise RuntimeError("VMAF validation failed: "+text[-1200:])
    return float(m.group(1))

def black_seconds(path,start,duration,source=False):
    args=["ffmpeg","-hide_banner","-loglevel","info"]
    if source: args += ["-ss",f"{start:.6f}","-i",path]
    else: args += ["-i",path]
    args += ["-t",f"{duration:.6f}","-vf","blackdetect=d=0.1:pix_th=0.10:pic_th=0.95","-an","-f","null","NUL"]
    r=cmd(args,timeout=600)
    if r.returncode: raise RuntimeError("black-frame scan failed: "+(r.stderr or r.stdout)[-800:])
    return sum(float(x) for x in re.findall(r"black_duration:([0-9.]+)",r.stderr+r.stdout))

def priority(rel):
    if rel.startswith("video-library\\originals\\"): return 0
    if rel.startswith("demo\\input\\") or rel.startswith("demo\\video-project-4-input\\"): return 1
    if rel.startswith("assets\\"): return 2
    if rel.startswith("video-library\\processed\\"): return 3
    return 4

def list_sources():
    found=[]
    skip={".git","node_modules","optimized-2mb","benchmarks"}
    for base,dirs,files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in skip and not d.startswith(".venv")]
        for fn in files:
            if fn.lower().endswith(".mp4"):
                p=Path(base)/fn
                if OUT in p.parents or RUN in p.parents: continue
                found.append(p)
    return sorted(set(found),key=lambda p:str(p).lower())

sources=[]
errors=[]
for p in list_sources():
    rel=str(p.relative_to(ROOT))
    try:
        md=probe(p)
        h=sha(p)
        sources.append({"path":str(p),"relative":rel,"sha256":h,"bytes":md["bytes"],"duration":md["duration"],"media":md})
    except Exception as e:
        errors.append({"path":rel,"error":str(e)})
groups={}
for s in sources: groups.setdefault(s["sha256"],[]).append(s)
canonical=[]
for h,rows in groups.items():
    rows.sort(key=lambda s:(priority(s["relative"]),s["relative"].lower()))
    canonical.append((rows[0],rows))
canonical.sort(key=lambda pair:pair[0]["relative"].lower())

def clip_count(d):
    n=max(1,int(math.ceil(d/10.0-1e-6)))
    if n>1 and d-(n-1)*10 < (1/24): n-=1
    return n

work=[]
for source,aliases in canonical:
    d=source["duration"]
    n=clip_count(d)
    for ix in range(n):
        start=ix*10.0
        length=min(10.0,d-start)
        if length < 1/24: continue
        src=Path(source["path"])
        rel=Path(source["relative"])
        if n==1: outrel=rel
        else: outrel=rel.with_name(f"{rel.stem}_clip-{ix+1:03d}{rel.suffix}")
        out=OUT/outrel
        work.append({"source":source,"aliases":[a["relative"] for a in aliases],"start":start,"duration":length,
                     "clip_index":ix+1,"clip_count":n,"out":str(out),"outrel":str(outrel)})

source_total=sum(s["bytes"] for s in sources)
base_report={"started_at":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"source_count":len(sources),
             "unique_source_hashes":len(groups),"duplicate_source_entries":len(sources)-len(groups),
             "source_bytes":source_total,"source_errors":errors,"output_directory":str(OUT),
             "settings":{"target_bytes_per_10s":1500000,"max_bytes":MAX_BYTES,"resolution":"fit within 854x480 landscape or 480x854 portrait; no upscale/crop",
                         "fps":24,"video":"H.264 libx264 preset slow CRF starting at 18; maxrate 1200k; increase CRF only when required by 2MB limit",
                         "audio":"AAC 96 kbps stereo, 64 kbps mono","quality_floor_vmaf":MIN_VMAF},
             "planned_clips":len(work),"outputs":[],"sources":[],"errors":[]}

done=0
for idx,item in enumerate(work,1):
    src=item["source"]; meta=src["media"]; v=meta["video"]; a=meta["audio"]
    sw,sh=int(v["width"]),int(v["height"]); w,h=get_dims(sw,sh)
    out=Path(item["out"]); out.parent.mkdir(parents=True,exist_ok=True)
    entry={"source":src["relative"],"source_sha256":src["sha256"],"aliases":item["aliases"],
           "start_seconds":item["start"],"source_segment_duration":item["duration"],"clip_index":item["clip_index"],
           "output":item["outrel"],"status":"failed","attempts":[]}
    try:
        prior=resume_by_out.get(item["outrel"])
        if prior:
            if not out.exists() or sha(out)!=prior["output_sha256"]:
                raise RuntimeError("Previously validated output is missing or changed; refusing to replace it.")
            m=probe(out); vst=m["video"]; ast=m["audio"]
            if m["bytes"]>MAX_BYTES or m["duration"]>10.0 or vst.get("codec_name")!="h264" or (ast and ast.get("codec_name")!="aac"):
                raise RuntimeError("Previously validated output no longer passes media limits.")
            ffmpeg_error(["ffmpeg","-hide_banner","-v","error","-i",str(out),"-f","null","NUL"],timeout=600)
            entry=dict(prior)
            entry["resumed_existing_output"]=True
            done+=1
            base_report["outputs"].append(entry)
            base_report["completed_clips"]=idx
            base_report["completed_successfully"]=done
            base_report["last_updated_at"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
            write_json(PROGRESS,{"completed":idx,"total":len(work),"successful":done,"failed":len(errors),"last_source":src["relative"],"last_output":item["outrel"]})
            if idx%10==0 or idx==len(work):
                write_json(REPORT,base_report)
                print(f"PROGRESS {idx}/{len(work)} success={done} failures={len(errors)} current={item['outrel']}",flush=True)
            continue
        if out.exists():
            raise RuntimeError("Unexpected pre-existing output; refusing to overwrite.")
        accepted=None
        for crf in range(START_CRF,MAX_CRF+1):
            tmp=RUN/"candidates"/f"{idx:05d}-crf{crf}.mp4"
            if tmp.exists(): tmp.unlink()
            audio_rate=96 if int(a.get("channels",2))>=2 else 64
            vf=f"fps=24,scale={w}:{h}:flags=lanczos,format=yuv420p"
            args=["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{item['start']:.6f}","-i",src["path"],
                  "-t",f"{item['duration']:.6f}","-map","0:v:0","-map","0:a:0?","-sn","-dn",
                  "-vf",vf,"-fps_mode","cfr","-c:v","libx264","-preset","slow","-profile:v","high",
                  "-crf",str(crf),"-maxrate",MAXRATE,"-bufsize",BUFSIZE,"-pix_fmt","yuv420p",
                  "-c:a","aac","-b:a",f"{audio_rate}k","-movflags","+faststart","-map_metadata","0",
                  "-metadata",f"title={Path(src['relative']).stem}","-y",str(tmp)]
            t0=time.perf_counter()
            r=cmd(args,timeout=1800)
            enc=time.perf_counter()-t0
            if r.returncode:
                raise RuntimeError("encode failed: "+(r.stderr or r.stdout)[-1500:])
            size=tmp.stat().st_size
            attempt={"crf":crf,"bytes":size,"encode_seconds":round(enc,3)}
            entry["attempts"].append(attempt)
            if size>MAX_BYTES:
                continue
            m=probe(tmp)
            if m["duration"]>10.0:
                continue
            if m["video"].get("codec_name")!="h264" or (m["audio"] and m["audio"].get("codec_name")!="aac"):
                continue
            score=metric_vmaf(src["path"],item["start"],item["duration"],str(tmp),w,h)
            attempt["vmaf"]=score
            accepted=(tmp,m,score,crf)
            break
        if not accepted:
            raise RuntimeError(f"No candidate passed <= {MAX_BYTES} bytes; candidates retained under benchmark/candidates.")
        tmp,m,score,crf=accepted
        ffmpeg_error(["ffmpeg","-hide_banner","-v","error","-i",str(tmp),"-f","null","NUL"],timeout=600)
        vst=m["video"]; ast=m["audio"]
        vd=float(vst.get("duration",m["duration"])); ad=float(ast.get("duration",m["duration"])) if ast else 0.0
        vstart=float(vst.get("start_time",0)); astart=float(ast.get("start_time",0)) if ast else 0.0
        sync=max(abs(vstart-astart),abs(vd-ad)) if ast else 0.0
        if sync>0.12: raise RuntimeError(f"Audio/video sync delta {sync:.3f}s exceeds 0.12s")
        source_black=black_seconds(src["path"],item["start"],item["duration"],True)
        output_black=black_seconds(str(tmp),0,m["duration"],False)
        black_warning=output_black>max(source_black+0.15,0.25)
        output_bytes=tmp.stat().st_size
        if output_bytes>MAX_BYTES or m["duration"]>10.0: raise RuntimeError("Post-move hard-limit validation failed")
        os.replace(tmp,out)
        output_bytes=out.stat().st_size
        entry.update({"status":"optimized","bytes":output_bytes,"duration":m["duration"],"width":vst["width"],"height":vst["height"],
                      "fps":vst.get("r_frame_rate"),"video_codec":vst.get("codec_name"),"video_bitrate":vst.get("bit_rate"),
                      "audio_codec":ast.get("codec_name") if ast else None,"audio_bitrate":ast.get("bit_rate") if ast else None,
                      "audio_channels":ast.get("channels") if ast else None,"vmaf":score,"crf":crf,
                      "encode_seconds":sum(x["encode_seconds"] for x in entry["attempts"]),"av_sync_delta_seconds":sync,
                      "source_black_duration_seconds":source_black,"output_black_duration_seconds":output_black,
                      "black_frame_warning":black_warning,"quality_warning":score is not None and score<MIN_VMAF,
                      "quality_review_note":"VMAF below 80 is reported for visual review and is not an automatic failure gate.",
                      "output_sha256":sha(out)})
        done+=1
    except Exception as e:
        entry["error"]=str(e)
        errors.append({"output":item["outrel"],"source":src["relative"],"error":str(e)})
    base_report["outputs"].append(entry)
    base_report["completed_clips"]=idx
    base_report["completed_successfully"]=done
    base_report["last_updated_at"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
    write_json(PROGRESS,{"completed":idx,"total":len(work),"successful":done,"failed":len(errors),"last_source":src["relative"],"last_output":item["outrel"]})
    if idx%10==0 or idx==len(work):
        write_json(REPORT,base_report)
        print(f"PROGRESS {idx}/{len(work)} success={done} failures={len(errors)} current={item['outrel']}",flush=True)

for source,aliases in canonical:
    outputs=[x["outrel"] for x in work if x["source"]["sha256"]==source["sha256"]]
    base_report["sources"].append({"canonical_source":source["relative"],"sha256":source["sha256"],"bytes":source["bytes"],
                                   "duration":source["duration"],"aliases":[x["relative"] for x in aliases],
                                   "optimized_outputs":outputs})
base_report["completed_at"]=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime())
valid=[x for x in base_report["outputs"] if x["status"]=="optimized"]
sizes=[x["bytes"] for x in valid]
sc=[x["vmaf"] for x in valid if x["vmaf"] is not None]
base_report["summary"]={"videos_discovered":len(sources),"unique_source_hashes":len(groups),
                        "duplicate_source_entries_skipped":len(sources)-len(groups),"clips_planned":len(work),
                        "clips_optimized":len(valid),"clips_failed":len(errors),"optimized_bytes":sum(sizes),
                        "average_clip_bytes":round(sum(sizes)/len(sizes)) if sizes else 0,
                        "average_bytes_per_10s":round(sum(x["bytes"]*10/x["duration"] for x in valid)/len(valid)) if valid else 0,
                        "clips_1_0_to_1_5mb":sum(1000000<=s<=1500000 for s in sizes),
                        "clips_1_5_to_2_0mb":sum(1500000<s<=MAX_BYTES for s in sizes),
                        "clips_over_2mb":sum(s>MAX_BYTES for s in sizes),
                        "clips_below_1mb":sum(s<1000000 for s in sizes),
                        "storage_savings_percent":round((1-sum(sizes)/source_total)*100,2) if source_total else None,
                        "average_vmaf":round(sum(sc)/len(sc),3) if sc else None,
                        "minimum_vmaf":min(sc) if sc else None,
                        "audio_video_sync_warnings":sum(x["av_sync_delta_seconds"]>0.08 for x in valid),
                        "black_frame_warnings":sum(x["black_frame_warning"] for x in valid)}
write_json(REPORT,base_report)
print("DONE "+json.dumps(base_report["summary"],ensure_ascii=False),flush=True)
if errors: sys.exit(1)

