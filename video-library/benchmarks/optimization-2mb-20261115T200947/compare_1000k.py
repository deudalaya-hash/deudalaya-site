import json, subprocess, re, math, hashlib
from pathlib import Path
ROOT=Path(r"C:\deudalaya")
RUN=ROOT/"video-library/benchmarks/optimization-2mb-20261115T200947/samples"
samples=[
("tila",(ROOT/"video-library/originals").glob("तिला*.mp4").__next__(),60),
("humla",(ROOT/"video-library/originals").glob("बिपना*.mp4").__next__(),120),
("shankar",(ROOT/"demo/input").glob("*.mp4").__next__(),600),
("shankar-fast-motion",(ROOT/"demo/input").glob("*.mp4").__next__(),890),
("night",ROOT/"assets/deudalaya-shahar-tu-cricket-ground-night.mp4",0),
("processed",ROOT/"video-library/processed/देउडा/humla-6b20306d4a-clip-002.mp4",0),
("project4",ROOT/"demo/video-project-4-input/Video Project 4.mp4",20)]
def run(args,timeout=600): return subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=timeout)
rows=[]
for name,path,start in samples:
    p=run(["ffprobe","-v","error","-show_entries","stream=width,height","-select_streams","v:0","-of","json","--",path])
    v=json.loads(p.stdout)["streams"][0]; sw,sh=int(v["width"]),int(v["height"])
    maxw,maxh=(854,480) if sw>=sh else (480,854)
    scale=min(1.0,maxw/sw,maxh/sh); w=max(2,int(round(sw*scale/2))*2); h=max(2,int(round(sh*scale/2))*2)
    out=RUN/f"{name}-1000k.mp4"
    r=run(["ffmpeg","-hide_banner","-loglevel","error","-ss",start,"-i",path,"-t",10,"-map","0:v:0","-map","0:a:0?","-vf",f"fps=24,scale={w}:{h}:flags=lanczos,format=yuv420p","-fps_mode","cfr","-c:v","libx264","-preset","slow","-profile:v","high","-crf",18,"-maxrate","1000k","-bufsize","2000k","-pix_fmt","yuv420p","-af","atrim=duration=10,asetpts=PTS-STARTPTS","-c:a","aac","-b:a","96k","-movflags","+faststart","-y",out])
    if r.returncode: rows.append({"sample":name,"error":r.stderr[-500:]}); continue
    pj=run(["ffprobe","-v","error","-show_entries","format=duration,size:stream=codec_type,codec_name,width,height,bit_rate,start_time,duration","-of","json","--",out])
    m=json.loads(pj.stdout); vs=next(x for x in m["streams"] if x["codec_type"]=="video")
    graph=f"[0:v]trim=duration=10,setpts=PTS-STARTPTS,fps=24,scale={w}:{h}:flags=lanczos,settb=1/24[ref];[1:v]trim=duration=10,setpts=PTS-STARTPTS,settb=1/24[dist];[ref][dist]libvmaf"
    vr=run(["ffmpeg","-hide_banner","-loglevel","info","-ss",start,"-i",path,"-i",out,"-filter_complex",graph,"-an","-t",10,"-f","null","NUL"])
    mat=re.search(r"VMAF score:\s*([0-9.]+)",vr.stderr+vr.stdout)
    dr=run(["ffmpeg","-hide_banner","-v","error","-i",out,"-f","null","NUL"])
    rows.append({"sample":name,"bytes":int(m["format"]["size"]),"duration":m["format"]["duration"],"width":vs["width"],"height":vs["height"],"video_bitrate":vs.get("bit_rate"),"vmaf":float(mat.group(1)) if mat else None,"decode_exit":dr.returncode})
print(json.dumps(rows,ensure_ascii=False,indent=2))

