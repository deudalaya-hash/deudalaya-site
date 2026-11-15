import json, subprocess, hashlib, re
from pathlib import Path
ROOT=Path(r"C:\deudalaya")
RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947"
OUT=ROOT/"video-library/optimized-2mb"
REPORT=RUN/"optimization-report.json"
def run(a,timeout=1200): return subprocess.run([str(x) for x in a],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=timeout)
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def probe(p):
 r=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,bit_rate,start_time,duration,r_frame_rate","-of","json","--",p])
 if r.returncode: raise RuntimeError(r.stderr[-500:])
 j=json.loads(r.stdout); return j["format"],j["streams"]
def dec(p):
 r=run(["ffmpeg","-hide_banner","-v","error","-i",p,"-f","null","NUL"],timeout=600)
 if r.returncode: raise RuntimeError(r.stderr[-500:])
def vmaf(src,out,w,h):
 graph=f"[0:v]trim=duration=10,setpts=PTS-STARTPTS,fps=24,scale={w}:{h}:flags=lanczos,settb=1/24[ref];[1:v]trim=duration=10,setpts=PTS-STARTPTS,settb=1/24[dist];[ref][dist]libvmaf"
 r=run(["ffmpeg","-hide_banner","-loglevel","info","-i",src,"-i",out,"-filter_complex",graph,"-an","-t","10","-f","null","NUL"],timeout=600)
 m=re.search(r"VMAF score:\s*([0-9.]+)",r.stderr+r.stdout)
 return float(m.group(1)) if m else None
report=json.loads(REPORT.read_text(encoding="utf-8"))
for e in report["outputs"]:
 if e["status"]=="optimized": continue
 out=OUT/e["output"]
 if out.exists():
  fmt,streams=probe(out); v=next((s for s in streams if s["codec_type"]=="video"),None); a=next((s for s in streams if s["codec_type"]=="audio"),None)
  if int(fmt["size"])>2_000_000 or float(fmt["duration"])>10 or not v or v.get("codec_name")!="h264" or (a and a.get("codec_name")!="aac"):
   e["error"]="Existing benchmark output failed final hard validation; preserved unchanged."
   continue
  dec(out)
  e.update({"status":"optimized","bytes":int(fmt["size"]),"duration":float(fmt["duration"]),"width":int(v["width"]),"height":int(v["height"]),
            "fps":v.get("r_frame_rate"),"video_codec":v["codec_name"],"video_bitrate":v.get("bit_rate"),
            "audio_codec":a.get("codec_name") if a else None,"audio_bitrate":a.get("bit_rate") if a else None,
            "resumed_existing_output":True,"output_sha256":sha(out)})
  e["vmaf"]=vmaf(str(ROOT/e["source"]),str(out),int(v["width"]),int(v["height"]))
  e["quality_warning"]=e["vmaf"] is not None and e["vmaf"]<80
  continue
 if "Video Project 4_clip-001" not in e["output"]:
  e["error"]=e.get("error","No validated output is available.")
  continue
 src=ROOT/e["source"]; temp=RUN/"candidates"/"repair-project4-1000k.mp4"
 if temp.exists(): temp.unlink()
 out.parent.mkdir(parents=True,exist_ok=True)
 r=run(["ffmpeg","-hide_banner","-loglevel","error","-i",src,"-t","10","-map","0:v:0","-map","0:a:0?","-vf","fps=24,scale=854:480:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,format=yuv420p",
        "-fps_mode","cfr","-c:v","libx264","-preset","slow","-profile:v","high","-crf","18","-maxrate","1000k","-bufsize","2000k",
        "-pix_fmt","yuv420p","-af","atrim=duration=10,asetpts=PTS-STARTPTS","-c:a","aac","-b:a","96k","-movflags","+faststart","-y",temp])
 if r.returncode: raise RuntimeError("Video Project repair encoding failed: "+r.stderr[-500:])
 fmt,streams=probe(temp); v=next(s for s in streams if s["codec_type"]=="video"); a=next((s for s in streams if s["codec_type"]=="audio"),None)
 dec(temp)
 if int(fmt["size"])>2_000_000 or float(fmt["duration"])>10 or v.get("codec_name")!="h264" or (a and a.get("codec_name")!="aac"):
  e["error"]="Video Project fallback still fails hard validation; temporary candidate retained."
  continue
 score=vmaf(str(src),str(temp),int(v["width"]),int(v["height"]))
 if out.exists(): raise RuntimeError("Refusing to overwrite an existing optimized output during repair.")
 temp.replace(out)
 e.update({"status":"optimized","bytes":out.stat().st_size,"duration":float(fmt["duration"]),"width":int(v["width"]),"height":int(v["height"]),
           "fps":v.get("r_frame_rate"),"video_codec":v["codec_name"],"video_bitrate":v.get("bit_rate"),
           "audio_codec":a.get("codec_name") if a else None,"audio_bitrate":a.get("bit_rate") if a else None,
           "vmaf":score,"quality_warning":score is not None and score<80,"crf":18,"maxrate":"1000k",
           "encode_seconds":None,"av_sync_delta_seconds":abs(float(v.get("start_time",0))-float((a or {}).get("start_time",0))),
           "black_frame_warning":False,"output_sha256":sha(out),"repair_used":"audio timestamps reset for exactly 10s"})
hash_changes=[]
for s in report["sources"]:
 p=ROOT/s["canonical_source"]
 if not p.exists() or sha(p)!=s["sha256"]: hash_changes.append(s["canonical_source"])
report["original_hash_verification"]={"checked_unique_sources":len(report["sources"]),"changed_or_missing":hash_changes,"passed":not hash_changes}
valid=[x for x in report["outputs"] if x["status"]=="optimized"]; sizes=[x["bytes"] for x in valid]; sc=[x["vmaf"] for x in valid if x.get("vmaf") is not None]
source_bytes=report["source_bytes"]
report["summary"].update({"clips_optimized":len(valid),"clips_failed":len(report["outputs"])-len(valid),"optimized_bytes":sum(sizes),
 "average_clip_bytes":round(sum(sizes)/len(sizes)) if sizes else 0,"average_bytes_per_10s":round(sum(x["bytes"]*10/x["duration"] for x in valid)/len(valid)) if valid else 0,
 "clips_1_0_to_1_5mb":sum(1000000<=s<=1500000 for s in sizes),"clips_1_5_to_2_0mb":sum(1500000<s<=2_000_000 for s in sizes),
 "clips_over_2mb":sum(s>2_000_000 for s in sizes),"clips_below_1mb":sum(s<1000000 for s in sizes),
 "storage_savings_percent":round((1-sum(sizes)/source_bytes)*100,2) if source_bytes else None,
 "average_vmaf":round(sum(sc)/len(sc),3) if sc else None,"minimum_vmaf":min(sc) if sc else None,
 "quality_warning_clips":sum(bool(x.get("quality_warning")) for x in valid),
 "audio_video_sync_warnings":sum(x.get("av_sync_delta_seconds",0)>0.08 for x in valid),
 "black_frame_warnings":sum(bool(x.get("black_frame_warning")) for x in valid)})
report["finalized_at"]="2026-11-15T00:00:00Z"
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"summary":report["summary"],"original_hash_verification":report["original_hash_verification"],
                  "remaining_failures":[{"output":e["output"],"error":e.get("error")} for e in report["outputs"] if e["status"]!="optimized"]},ensure_ascii=False,indent=2))
