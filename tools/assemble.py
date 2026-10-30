"""Join the chapter renders into one film. Usage: assemble.py review|4k
review: c?/renders/review_c?.mp4 -> full/inside_the_iphone_duo_review.mp4 (1080p30)
4k:     chapters_4k/c?.mp4      -> full/inside_the_iphone_duo_4k60.mp4
Also writes full/youtube_chapters.txt from the chapter lengths."""
import os, subprocess, sys

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
os.chdir(root)
mode = sys.argv[1] if len(sys.argv) > 1 else 'review'
names = ['The fold', 'The hinge', 'The screen', 'Two batteries', 'The brains', 'Cameras', 'Sound and touch', 'Outro']
files = [f'c{i}/renders/review_c{i}.mp4' if mode == 'review' else f'chapters_4k/c{i}.mp4' for i in range(1, 9)]
files = [f for f in files if os.path.exists(f)]
os.makedirs('full', exist_ok=True)
with open('full/list.txt', 'w') as f:
    for x in files:
        f.write(f"file '{os.path.abspath(x)}'\n")
out = 'full/inside_the_iphone_duo_review.mp4' if mode == 'review' else 'full/inside_the_iphone_duo_4k60.mp4'
rate = '30' if mode == 'review' else '60'
# loudness: measure the joined programme, then level it to YouTube's -14 LUFS with a soft limiter
probe = subprocess.run(['ffmpeg', '-f', 'concat', '-safe', '0', '-i', 'full/list.txt', '-vn', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float([l for l in probe.splitlines() if l.strip().startswith('I:')][-1].split()[1])
gain = round(-14 - I, 2)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'full/list.txt', '-c:v', 'libx264', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
                '-crf', '18' if mode == 'review' else '16', '-preset', 'medium', '-r', rate,
                '-af', f'volume={gain}dB,alimiter=limit=0.89:level=false', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', out], check=True)
print('loudness', I, 'LUFS -> gain', gain, 'dB')
t, lines = 0.0, []
for i, x in enumerate(files):
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', x], capture_output=True, text=True).stdout)
    lines.append(f'{int(t // 60)}:{int(t % 60):02d} {names[i]}')
    t += d
open('full/youtube_chapters.txt', 'w').write('\n'.join(lines) + '\n')
print(out, round(t, 1), 's')
print('\n'.join(lines))
