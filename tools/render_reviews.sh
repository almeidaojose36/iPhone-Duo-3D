#!/bin/zsh
# 1080p30 review renders of every chapter that has no review yet, then the assembled review cut.
cd "${0:A:h}/.."
for c in c1 c2 c3 c4 c5 c6 c7 c8; do
  out=$c/renders/review_$c.mp4
  [ -f $out ] && { echo "$c already rendered"; continue; }
  s=$(date +%s)
  (cd $c && npx --yes hyperframes@0.8.193 render . -f 30 --quiet -o renders/review_$c.mp4 > renders/render.log 2>&1)
  echo "$c rc=$? $(( ($(date +%s)-s)/60 )) min free=$(df -h . | tail -1 | awk '{print $4}')"
done
python3 tools/assemble.py review
echo "REVIEWS DONE"
