# S5C Hack

This project's goal is to create a drone controller for the Snaptain Era S5C drone in Python, as well as be able to control it from an web client. This project is under the MIT license.

Some of the code also comes from [Amine Lemaizi's blog](https://lemaizi.com/blog/hacking-a-toy-drone-to-put-artificial-intelligence-on-it-part-i-the-hack/).

### Personal use

If you wish to use the code for yourself, you will need to capture "link codes" which is the data transmitted back and forth between the drone and the phone before the phone starts receiving video. [Amine Lemaizi's blog](https://lemaizi.com/blog/hacking-a-toy-drone-to-put-artificial-intelligence-on-it-part-i-the-hack/) demonstrates how to do this on Android devices. Apple devices, [use this](https://developer.apple.com/documentation/network/recording_a_packet_trace) (You can listen to this interface, `rvi0`, through Wireshark as well). You are looking for sent TCP packets before the initial video stream packet (starting with `00 00 01 A1`). Replace `link_codes` in `__main__.py` with the data in the packets. Other than the initial handshake and linking, the code should be the same.

To view the captured video in the `.h264` file, it needs to be put into a video container (such as mp4), which is what `h264tomp4.sh` does. By default it takes the file in the root directory with the name `drone_stream.h264` and puts it in `output/SOME-UUID.mp4`. However it can be provided with an initial file name and an output file: `./h264tomp4.sh [file_path] [output_file_path]`.
