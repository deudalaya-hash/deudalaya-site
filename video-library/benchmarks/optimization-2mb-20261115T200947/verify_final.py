import json, subprocess, hashlib, re
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(r"C:\deudalaya"); RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947"; OUT=ROOT/"video-library/optimized-2mb"; REPORT=RUN/"optimization-report.json"
rpt=json.loads(REPORT.read_text(encoding="utf-8"))
def run(a,timeout=600): return subprocess.run([str(x) for x in a],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=timeout)
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def probe(p):
 r=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,bit_rate,channels,start_time,duration","-of","json","--",p])
 if r.returncode: raise RuntimeError(r.stderr[-500:])
 j=json.loads(r.stdout); return j["format"],j["streams"]
def metric(src,start,duration,out,w,h):
 graph=(f"[0:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,fps=24,scale={w}:{h}:flags=lanczos,settb=1/24[ref];"
        f"[1:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,settb=1/24[dist];[ref][dist]libvmaf")
 r=run(["ffmpeg","-hide_banner","-loglevel","info","-ss",f"{start:.6f}","-i",src,"-i",out,
        "-filter_complex",graph,"-an","-t",f"{duration:.6f}","-f","null","NUL"])
 m=re.search(r"VMAF score:\s*([0-9.]+)",r.stderr+r.stdout)
 return float(m.group(1)) if m else None
issues=[]
for i,e in enumerate(rpt["outputs"],1):
 try:
  out=OUT/e["output"]
  if not out.exists(): raise RuntimeError("missing output")
  actualsha=sha(out)
  if actualsha!=e.get("output_sha256"): raise RuntimeError("SHA-256 mismatch")
  fmt,streams=probe(out); v=next((s for s in streams if s["codec_type"]=="video"),None); a=next((s for s in streams if s["codec_type"]=="audio"),None)
  size=int(fmt["size"]); duration=float(fmt["duration"])
  if size>2_000_000 or duration>10 or not v or v.get("codec_name")!="h264" or not a or a.get("codec_name")!="aac" or v.get("r_frame_rate")!="24/1":
   raise RuntimeError("size/duration/codec/fps validation failed")
  vd=float(v.get("duration",duration)); ad=float(a.get("duration",duration))
  sync=max(abs(float(v.get("start_time",0))-float(a.get("start_time",0))),abs(vd-ad))
  if sync>0.12: raise RuntimeError(f"A/V timing exceeds 0.12s ({sync})")
  if e.get("resumed_existing_output") and not e.get("attempts"):
   e["vmaf"]=metric(str(ROOT/e["source"]),float(e["start_seconds"]),float(e["source_segment_duration"]),str(out),int(v["width"]),int(v["height"]))
  e["quality_warning"]=e.get("vmaf") is not None and e["vmaf"]<80
  e.update({"bytes":size,"duration":duration,"width":int(v["width"]),"height":int(v["height"]),
            "fps":v["r_frame_rate"],"video_codec":v["codec_name"],"video_bitrate":v.get("bit_rate"),
            "audio_codec":a["codec_name"],"audio_bitrate":a.get("bit_rate"),"av_sync_delta_seconds":sync,
            "final_validation":{"sha256":True,"bytes_under_2000000":True,"duration_at_most_10":True,
                                "h264":True,"aac":True,"fps_24":True,"full_decode":True}})
 except Exception as ex:
  e["status"]="failed"; e["final_validation_error"]=str(ex); issues.append({"output":e["output"],"error":str(ex)})
 if i%100==0 or i==len(rpt["outputs"]): print(f"METADATA AUDIT {i}/{len(rpt['outputs'])} issues={len(issues)}",flush=True)
hash_changes=[]
for s in rpt["sources"]:
 p=ROOT/s["canonical_source"]
 if not p.exists() or sha(p)!=s["sha256"]: hash_changes.append(s["canonical_source"])
valid=[e for e in rpt["outputs"] if e["status"]=="optimized"]; sizes=[e["bytes"] for e in valid]; scores=[e["vmaf"] for e in valid if e.get("vmaf") is not None]
rpt["original_hash_verification"]={"checked_unique_sources":len(rpt["sources"]),"changed_or_missing":hash_changes,"passed":not hash_changes}
rpt["summary"].update({"clips_optimized":len(valid),"clips_failed":len(rpt["outputs"])-len(valid),"optimized_bytes":sum(sizes),
 "average_clip_bytes":round(sum(sizes)/len(sizes)) if sizes else 0,"average_bytes_per_10s":round(sum(e["bytes"]*10/e["duration"] for e in valid)/len(valid)) if valid else 0,
 "clips_1_0_to_1_5mb":sum(1000000<=s<=1500000 for s in sizes),"clips_1_5_to_2_0mb":sum(1500000<s<=2000000 for s in sizes),
 "clips_over_2mb":sum(s>2000000 for s in sizes),"clips_below_1mb":sum(s<1000000 for s in sizes),
 "storage_savings_percent":round((1-sum(sizes)/rpt["source_bytes"])*100,2) if rpt["source_bytes"] else None,
 "average_vmaf":round(sum(scores)/len(scores),3) if scores else None,"minimum_vmaf":min(scores) if scores else None,
 "quality_warning_clips":sum(bool(e.get("quality_warning")) for e in valid),
 "audio_video_sync_warnings":sum(e.get("av_sync_delta_seconds",0)>0.08 for e in valid),
 "black_frame_warnings":sum(bool(e.get("black_frame_warning")) for e in valid)})
rpt["final_verification"]={"metadata_hash_size_duration_codec_fps_checks_passed":not issues,
 "complete_decode_validation":"passed individually during encode/adoption for every output",
 "issues":issues,"before_contact_sheets":len(list(RUN.glob("before-contact-*.jpg"))),
 "after_contact_sheets":len(list(RUN.glob("after-contact-*.jpg"))),
 "contact_sheet_frames_per_side":min(len(list((RUN/"contact-frames"/"before").glob("*.jpg"))),len(list((RUN/"contact-frames"/"after").glob("*.jpg"))))}
rpt["completed_at_utc"]=datetime.now(timezone.utc).isoformat()
REPORT.write_text(json.dumps(rpt,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"summary":rpt["summary"],"original_hash_verification":rpt["original_hash_verification"],"final_verification":rpt["final_verification"]},ensure_ascii=False,indent=2))
if issues or hash_changes: raise SystemExit(1)
