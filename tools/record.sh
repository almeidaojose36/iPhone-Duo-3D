#!/bin/zsh
# Record (or re-record) narration for a chapter: record.sh <chapter> [beat ids...]
# Kokoro am_michael at 1.03 -> normalize to -17 LUFS -> parakeet word timings.
cd "${0:A:h}/../$1" || exit 1
shift
PY=~/.venvs/kokoro-hf/bin/python
mkdir -p assets/vo/norm assets/vo/tr assets/js
$PY ../tools/vo.py assets/vo/beats.json assets/vo 1.03 $@ 2>&1 | grep -v -i warn
ids=($@)
[ ${#ids} -eq 0 ] && ids=($(python3 -c "import json;print(' '.join(b['id'] for b in json.load(open('assets/vo/beats.json'))))"))
for b in $ids; do
  w=assets/vo/$b.wav; n=assets/vo/norm/$b.wav
  I=$(ffmpeg -i $w -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}')
  g=$(python3 -c "print(round(-17-($I),2))")
  ffmpeg -v error -y -i $w -af "volume=${g}dB,alimiter=limit=0.84:level=false:attack=1:release=50" -ar 48000 -ac 1 -c:a pcm_s16le $n
done
~/.local/bin/parakeet-mlx $(for b in $ids; do echo assets/vo/norm/$b.wav; done) --output-dir assets/vo/tr --output-format json >/dev/null 2>&1
for b in $ids; do echo "  $b: $(python3 -c "import json;print(json.load(open('assets/vo/tr/$b.json'))['text'])")"; done
