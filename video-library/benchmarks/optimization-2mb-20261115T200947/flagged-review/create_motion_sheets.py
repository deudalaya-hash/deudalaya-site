import subprocess
from pathlib import Path
root=Path(r"C:\deudalaya\video-library\benchmarks\optimization-2mb-20261115T200947\flagged-review")
frames=root/"frames"
n=127
for page,start in enumerate(range(0,n,10),1):
 args=["ffmpeg","-hide_banner","-loglevel","error","-framerate","1","-start_number",str(start*4+1),"-i",frames/"%04d.jpg","-frames:v","1",
       "-vf","tile=4x10:nb_frames=40:padding=8:margin=8:color=white","-fps_mode","passthrough","-q:v","2","-update","1","-y",root/f"motion-review-{page:02d}.jpg"]
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding="utf-8",errors="replace")
 if p.returncode: raise SystemExit(p.stderr[-800:])
 print(f"SHEET {page}/13",flush=True)
