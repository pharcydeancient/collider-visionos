#!/usr/bin/env bash
set -euo pipefail
IN="${1:?input file}"
STEM="${2:?category/name}"
OUT="export/${STEM}"
mkdir -p "$OUT"
common=(-an -pix_fmt yuv420p -r 24 -movflags +faststart -vsync cfr)
ffmpeg -y -i "$IN" "${common[@]}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -preset slow -crf 23 "$OUT/1080.mp4"
ffmpeg -y -i "$IN" "${common[@]}" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" -c:v libx264 -preset slow -crf 24 "$OUT/720.mp4"
ffmpeg -y -i "$OUT/1080.mp4" -ss 00:00:05 -frames:v 1 -q:v 3 "$OUT/poster.jpg"
ffmpeg -y -i "$OUT/poster.jpg" -c:v libwebp -quality 78 "$OUT/poster.webp"
