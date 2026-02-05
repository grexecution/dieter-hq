#!/bin/bash
# Fast local transcription using whisper.cpp
# Usage: transcribe-local.sh <audio-file> [language]

INPUT="$1"
LANG="${2:-de}"
MODEL="$HOME/.local/share/whisper-models/ggml-small.bin"
TMP_WAV="/tmp/whisper-input-$$.wav"

# Convert to WAV (16kHz mono) and transcribe in one pipeline
ffmpeg -i "$INPUT" -ar 16000 -ac 1 "$TMP_WAV" -y 2>/dev/null && \
whisper-cli -m "$MODEL" -l "$LANG" --no-timestamps "$TMP_WAV" 2>/dev/null | \
grep -v "^whisper\|^ggml\|^system_info\|^main:\|^$"

# Cleanup
rm -f "$TMP_WAV"
