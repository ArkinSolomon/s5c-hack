#!/bin/bash

# Script to convert drone_stream.h264 to output.mp4
uuid=$(uuidgen)
ffmpeg -framerate 24 -i drone_stream.h264 -c copy $uuid.mp4
rm drone_stream.h264
