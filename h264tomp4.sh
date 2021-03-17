#!/bin/bash

# Script to convert .h264 to .mp4 files
name="${2:-output/$(uuidgen)}"
fname="${1:-drone_stream.h264}"
mkdir -p output
ffmpeg -framerate 24 -i $file -c copy $name.mp4
rm $fname
