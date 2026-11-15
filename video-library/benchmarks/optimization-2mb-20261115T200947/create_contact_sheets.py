import json, subprocess, sys
from pathlib import Path
ROOT=Path(r"C:\deudalaya")
RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947"
OUT=ROOT/"video-library/optimized-2mb"
REPORT=RUN/"optimization-report.json"
FRAMES=RUN/"contact-frames"
BEFORE=FRAMES/"before"; AFTER=FRAMES/"after"
BEFORE.mkdir(parents=True,exist_ok=True); AFTER.mkdir(parents=True,exist_ok=True)
rpt=json.loads(REPORT.read_text(encoding="utf-8"))
ok=[x for x in rpt["outputs"] if x["status"]=="optimized"]
def call(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode: raise RuntimeError((p.stderr or p.stdout)[-700:])
for i,e in enumerate(ok,1):
 src=ROOT/e["source"]; out=OUT/e["output"]
 b=BEFORE/f"{i:04d}.jpg"; a=AFTER/f"{i:04d}.jpg"
 t=min(float(e["source_segment_duration"])/2,5)
 call(["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{float(e['start_seconds'])+t:.6f}","-i",src,"-frames:v","1","-vf","scale=220:124:force_original_aspect_ratio=decrease,pad=220:124:(ow-iw)/2:(oh-ih)/2:black","-q:v","3","-y",b])
 call(["ffmpeg","-hide_banner","-loglevel","error","-ss",f"{float(e['duration'])/2:.6f}","-i",out,"-frames:v","1","-vf","scale=220:124:force_original_aspect_ratio=decrease,pad=220:124:(ow-iw)/2:(oh-ih)/2:black","-q:v","3","-y",a])
 if i%50==0 or i==len(ok): print(f"FRAMES {i}/{len(ok)}",flush=True)
for label,d in [("before",BEFORE),("after",AFTER)]:
 outpat=RUN/f"{label}-contact-%02d.jpg"
 call(["ffmpeg","-hide_banner","-loglevel","error","-framerate","1","-start_number","1","-i",d/"%04d.jpg",
       "-vf","tile=6x5:nb_frames=30:padding=8:margin=8:color=white","-fps_mode","passthrough","-q:v","2","-y",outpat])
print(json.dumps({"frames_per_side":len(ok),"before_sheets":len(list(RUN.glob("before-contact-*.jpg"))),
                  "after_sheets":len(list(RUN.glob("after-contact-*.jpg")))},ensure_ascii=False))
