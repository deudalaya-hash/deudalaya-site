import json, subprocess, hashlib, re
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(r"C:\deudalaya")
RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947"
OUT=ROOT/"video-library/optimized-2mb"
REPORT=RUN/"optimization-report.json"
report=json.loads(REPORT.read_text(encoding="utf-8"))
def run(args,timeout=900): return subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=timeout)
def sha(p):
 h=hashlib.sha256()
 with open(p,"rb") as f:
  for b in iter(lambda:f.read(1048576),b""): h.update(b)
 return h.hexdigest()
def probe(p):
 r=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,bit_rate,channels,start_time,duration","-of","json","--",p])
 if r.returncode: raise RuntimeError(r.stderr[-600:])
 j=json.loads(r.stdout); return j["format"],j["streams"]
def quality_metric(src,start,duration,out,w,h):
 graph=(f"[0:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,fps=24,scale={w}:{h}:flags=lanczos,settb=1/24[ref];"
        f"[1:v]trim=duration={duration:.6f},setpts=PTS-STARTPTS,settb=1/24[dist];[ref][dist]libvmaf")
 r=run(["ffmpeg","-hide_banner","-loglevel","info","-ss",f"{start:.6f}","-i",src,"-i",out,
        "-filter_complex",graph,"-an","-t",f"{duration:.6f}","-f","null","NUL"])
 m=re.search(r"VMAF score:\s*([0-9.]+)",r.stderr+r.stdout)
 return float(m.group(1)) if m else None
issues=[]
for i,e in enumerate(report["outputs"],1):
 out=OUT/e["output"]
 try:
  if not out.exists(): raise RuntimeError("missing output")
  actual_hash=sha(out)
  if actual_hash!=e.get("output_sha256"): raise RuntimeError("SHA-256 mismatch")
  fmt,streams=probe(out)
  v=next((s for s in streams if s["codec_type"]=="video"),None)
  a=next((s for s in streams if s["codec_type"]=="audio"),None)
  dur=float(fmt["duration"]); size=int(fmt["size"])
  if size>2_000_000: raise RuntimeError(f"size exceeds maximum: {size}")
  if dur>10: raise RuntimeError(f"duration exceeds 10 seconds: {dur}")
  if not v or v.get("codec_name")!="h264": raise RuntimeError("video is not H.264")
  if not a or a.get("codec_name")!="aac": raise RuntimeError("audio is not AAC")
  if v.get("r_frame_rate")!="24/1": raise RuntimeError(f"frame rate is {v.get('r_frame_rate')}")
  decoded=run(["ffmpeg","-hide_banner","-v","error","-i",out,"-f","null","NUL"])
  if decoded.returncode: raise RuntimeError("full decode failed: "+decoded.stderr[-500:])
  vd=float(v.get("duration",dur)); ad=float(a.get("duration",dur))
  sync=max(abs(float(v.get("start_time",0))-float(a.get("start_time",0))),abs(vd-ad))
  e.update({"final_validation":{"sha256":True,"bytes":True,"duration":True,"h264":True,"aac":True,"fps24":True,"full_decode":True},
            "bytes":size,"duration":dur,"width":int(v["width"]),"height":int(v["height"]),
            "fps":v["r_frame_rate"],"video_bitrate":v.get("bit_rate"),"audio_bitrate":a.get("bit_rate"),
            "av_sync_delta_seconds":sync})
  if e.get("resumed_existing_output"):
   e["vmaf"]=quality_metric(str(ROOT/e["source"]),float(e["start_seconds"]),float(e["source_segment_duration"]),str(out),int(v["width"]),int(v["height"]))
  e["quality_warning"]=e.get("vmaf") is not None and e["vmaf"]<80
  if sync>0.12: raise RuntimeError(f"A/V stream timing exceeds 0.12s: {sync:.6f}")
 except Exception as ex:
  e["status"]="failed"
  e["final_validation_error"]=str(ex)
  issues.append({"output":e["output"],"error":str(ex)})
 if i%50==0 or i==len(report["outputs"]):
  print(f"AUDIT {i}/{len(report['outputs'])} issues={len(issues)}",flush=True)
hash_changes=[]
for s in report["sources"]:
 p=ROOT/s["canonical_source"]
 if not p.exists() or sha(p)!=s["sha256"]: hash_changes.append(s["canonical_source"])
valid=[e for e in report["outputs"] if e["status"]=="optimized"]
sizes=[e["bytes"] for e in valid]; scores=[e["vmaf"] for e in valid if e.get("vmaf") is not None]
syncwarn=sum(e.get("av_sync_delta_seconds",0)>0.08 for e in valid)
report["original_hash_verification"]={"checked_unique_sources":len(report["sources"]),"changed_or_missing":hash_changes,"passed":not hash_changes}
report["summary"].update({"clips_optimized":len(valid),"clips_failed":len(report["outputs"])-len(valid),"optimized_bytes":sum(sizes),
 "average_clip_bytes":round(sum(sizes)/len(sizes)) if sizes else 0,"average_bytes_per_10s":round(sum(e["bytes"]*10/e["duration"] for e in valid)/len(valid)) if valid else 0,
 "clips_1_0_to_1_5mb":sum(1000000<=s<=1500000 for s in sizes),"clips_1_5_to_2_0mb":sum(1500000<s<=2_000_000 for s in sizes),
 "clips_over_2mb":sum(s>2_000_000 for s in sizes),"clips_below_1mb":sum(s<1000000 for s in sizes),
 "storage_savings_percent":round((1-sum(sizes)/report["source_bytes"])*100,2) if report["source_bytes"] else None,
 "average_vmaf":round(sum(scores)/len(scores),3) if scores else None,"minimum_vmaf":min(scores) if scores else None,
 "quality_warning_clips":sum(bool(e.get("quality_warning")) for e in valid),
 "audio_video_sync_warnings":syncwarn,"black_frame_warnings":sum(bool(e.get("black_frame_warning")) for e in valid)})
report["final_verification"]={"all_outputs_reprobed_and_fully_decoded":not issues,"issues":issues,
 "before_contact_sheets":len(list(RUN.glob("before-contact-*.jpg"))),"after_contact_sheets":len(list(RUN.glob("after-contact-*.jpg"))),
 "contact_sheet_frames_per_side":min(len(list((RUN/"contact-frames"/"before").glob("*.jpg"))),len(list((RUN/"contact-frames"/"after").glob("*.jpg"))))}
report["completed_at_utc"]=datetime.now(timezone.utc).isoformat()
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps({"summary":report["summary"],"original_hash_verification":report["original_hash_verification"],
                  "final_verification":report["final_verification"]},ensure_ascii=False,indent=2))
if issues or hash_changes: raise SystemExit(1)
