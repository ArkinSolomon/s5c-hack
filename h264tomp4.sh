#!/bin/bash

# Script to convert .h264 to .mp4 files
name="${2:-output/$(uuidgen).mp4}"
fname="${1:-drone_stream.h264}"
currpath=$(pwd)
mkdir -p output
ffmpeg -framerate 24 -i "$currpath/$fname" -c copy "$currpath/$name"
rm $fname
