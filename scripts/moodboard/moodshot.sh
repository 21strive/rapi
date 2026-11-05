#!/bin/bash
# Screenshot a slice of one moodboard chapter with headless Chrome, one run at a time, against the
# dev server (npm run dev, port 5180).
#   scripts/moodboard/moodshot.sh <job> [from=0] [to=100] [theme=light|dark] [width=1440] [height=2200]
# Prints the PNG path, then any console errors the page logged. Shots go to $MOODSHOT_DIR
# (default: a "moodshots" folder in the system temp dir). Set CHROME to use another browser binary.
# Headless Chrome will not lay out narrower than about 500 px: check phones with device emulation.
set -u
JOB=${1:?job id}; FROM=${2:-0}; TO=${3:-100}; THEME=${4:-light}; W=${5:-1440}; H=${6:-2200}
DIR="${MOODSHOT_DIR:-${TMPDIR:-/tmp}/moodshots}"
mkdir -p "$DIR"
OUT="$DIR/$JOB-$FROM-$TO-$THEME-$W.png"
LOCK="$DIR/.chrome.lock"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
# One Chrome at a time: the machine has 8 GB.
GOT=0
for i in $(seq 1 600); do mkdir "$LOCK" 2>/dev/null && GOT=1 && break; sleep 1; done
PROFILE=$(mktemp -d)
# Only the run that took the lock may remove it.
trap 'rm -rf "$PROFILE"; [ "$GOT" = 1 ] && rm -rf "$LOCK"' EXIT
[ "$GOT" = 1 ] || { echo "lock busy for 10 min; try again"; exit 1; }
SCHEME=1; [ "$THEME" = dark ] && SCHEME=0
URL="http://localhost:5180/#/moodboard?job=$JOB&all=1&bare=1&from=$FROM&to=$TO"
# A stalled Chrome is killed after 90 s so it can never hold the lock for long.
perl -e 'alarm shift; exec @ARGV' 90 "$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check \
  --disable-extensions --user-data-dir="$PROFILE" --force-device-scale-factor=1 \
  --blink-settings=preferredColorScheme=$SCHEME --window-size="$W,$H" --virtual-time-budget=9000 \
  --enable-logging=stderr --v=0 --screenshot="$OUT" "$URL" 2>"$PROFILE/log.txt" >/dev/null
echo "$OUT"
grep -E "CONSOLE|Uncaught|ERROR:CONSOLE" "$PROFILE/log.txt" | grep -v -i "devtools\|DevTools\|Download the Vue" | sed -E 's/^.*CONSOLE[^"]*"/console: "/' | head -20
