#!/bin/bash
mkdir -p src/assets/cards/rws

# Base URL
BASE="https://www.sacred-texts.com/tarot/pkt/img"

# Download Majors (ar00 - ar21)
echo "Downloading Major Arcana..."
for i in {0..21}; do
  if [ $i -lt 10 ]; then N="0$i"; else N="$i"; fi
  curl -s -o "src/assets/cards/rws/ar${N}.jpg" "${BASE}/ar${N}.jpg"
done

# Function to download suit
download_suit() {
  SUIT_PREFIX=$1
  SUIT_NAME=$2
  
  echo "Downloading $SUIT_NAME..."
  for i in {1..14}; do
    # Map logic ID (1-14) to Remote Filename (ac, 02..10, pa, kn, qu, ki)
    if [ $i -eq 1 ]; then REMOTE="ac"; fi
    if [ $i -ge 2 ] && [ $i -le 9 ]; then REMOTE="0$i"; fi
    if [ $i -eq 10 ]; then REMOTE="10"; fi
    if [ $i -eq 11 ]; then REMOTE="pa"; fi
    if [ $i -eq 12 ]; then REMOTE="kn"; fi
    if [ $i -eq 13 ]; then REMOTE="qu"; fi
    if [ $i -eq 14 ]; then REMOTE="ki"; fi
    
    # Local Filename: always 2 digits (01..14)
    if [ $i -lt 10 ]; then LOCAL="0$i"; else LOCAL="$i"; fi
    
    curl -s -o "src/assets/cards/rws/${SUIT_PREFIX}${LOCAL}.jpg" "${BASE}/${SUIT_PREFIX}${REMOTE}.jpg"
  done
}

download_suit "wa" "Wands"
download_suit "cu" "Cups"
download_suit "sw" "Swords"
download_suit "pe" "Pentacles"

echo "Download complete."
