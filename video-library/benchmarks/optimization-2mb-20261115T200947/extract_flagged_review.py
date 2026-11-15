import json,csv,subprocess,re
from pathlib import Path
ROOT=Path(r"C:\deudalaya")
RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947"
REVIEW=RUN/"flagged-review"
REPORT=RUN/"optimization-report.json"
OUT=ROOT/"video-library/optimized-2mb"
FRAMES=REVIEW/"frames"; FRAMES.mkdir(parents=True,exist_ok=True)
r=json.loads(REPORT.read_text(encoding="utf-8"))
flagged=[x for x in r["outputs"] if x.get("quality_warning") is True]
def call(args,timeout=600):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=timeout)
 if p.returncode: raise RuntimeError((p.stderr or p.stdout)[-700:])
 return p
rows=[]
for n,e in enumerate(flagged,1):
 clip=OUT/e["output"]
 fmt=json.loads(call(["ffprobe","-v","error","-show_entries","format=duration","-of","json","--",clip]).stdout)
 duration=float(fmt["format"]["duration"])
 times=[max(0.0,min(duration-0.04,duration*f)) for f in (0.05,0.35,0.65,0.95)]
 frames=[]
 for k,t in enumerate(times,1):
  idx=(n-1)*4+k
  dst=FRAMES/f"{idx:04d}.jpg"
  call(["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{t:.6f}","-i",clip,"-frames:v","1",
        "-vf","scale=240:136:force_original_aspect_ratio=decrease:force_divisible_by=2,pad=240:136:(ow-iw)/2:(oh-ih)/2:black",
        "-q:v","3","-update","1","-y",dst])
  frames.append(str(dst.relative_to(REVIEW)))
 rows.append({"review_index":n,"output":e["output"],"source":e["source"],"source_sha256":e["source_sha256"],
              "source_start_seconds":e["start_seconds"],"duration":duration,"bytes":e["bytes"],"vmaf":e["vmaf"],
              "audio_codec":e.get("audio_codec"),"audio_bitrate":e.get("audio_bitrate"),
              "av_sync_delta_seconds":e.get("av_sync_delta_seconds"),"frames":frames})
 if n%25==0 or n==len(flagged): print(f"FRAMES {n}/{len(flagged)}",flush=True)
(REVIEW/"review-index.json").write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding="utf-8")
with (REVIEW/"review-index.csv").open("w",encoding="utf-8-sig",newline="") as f:
 w=csv.DictWriter(f,fieldnames=["review_index","output","source","source_sha256","source_start_seconds","duration","bytes","vmaf","audio_codec","audio_bitrate","av_sync_delta_seconds"])
 w.writeheader()
 for x in rows: w.writerow({k:x.get(k) for k in w.fieldnames})
for p in range(0,len(flagged),10):
 start=p*4+1
 out=REVIEW/f"motion-review-{p//10+1:02d}.jpg"
 call(["ffmpeg","-hide_banner","-loglevel","error","-framerate","1","-start_number",str(start),
       "-i",FRAMES/"%04d.jpg","-frames:v",str(min(10,len(flagged)-p)),
       "-vf","tile=4x10:nb_frames=40:padding=8:margin=8:color=white","-fps_mode","passthrough","-q:v","2","-y",out])
print(json.dumps({"flagged":len(flagged),"frame_count":len(list(FRAMES.glob("*.jpg"))),
                  "sheets":len(list(REVIEW.glob("motion-review-*.jpg")))},ensure_ascii=False))
