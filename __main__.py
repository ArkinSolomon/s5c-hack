import socket
import codecs
import threading
import time
import asyncio

HOST = '172.17.10.1'
TCP_PORT = 8888
UDP_PORT = 9125

tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.connect((HOST, TCP_PORT))

packets = [
    '49546400000052000000bbb2993925b2a4c3dc01d8b1b5115b9892db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccca7967a1bb6dc2da95ed3faefba06f003a50b3260d3c0f800dbd5b77b51de8913',
    '49546400000052000000f9231618e2daf8ef24b98cf55e7a10f092db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccca7967a1bb6dc2da95ed3faefba06f003a50b3260d3c0f800dbd5b77b51de8913',
    '4954640000005200000005a54f1856b34db5a441b68ab79ceda092db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccca7967a1bb6dc2da95ed3faefba06f003a50b3260d3c0f800dbd5b77b51de8913',
    '49546400000056000000fdc1c96b0d382310d8dec4b8bc41deb392db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144cccf021e8c16cbea0baccf51500f0f6037f3bf52412101c5026b023487e6f808e24',
    '49547400000066000000a006285e6567863b79bb534a0c04024792db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccca6d7f518e61c1478edea3c23a2941dd5f384d65615a44394f1f10a583e249ce0a50b3260d3c0f800dbd5b77b51de8913',
    '4954640000005a0000009c0555c4dcda4b8bf43e037a8b5049bc92db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144cccf1a14e872edb8fec7fa3ab290d38744095a339fe1a00554971e46b1593537d47',
    '4954640000005d000000c2e2c6d1cb7992b3385faf6c6e4b49b992db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccc251875e0131b1ba99e4086148dc8ad5fab066088e679a477fe12d7029db68183',
    '49546400000054000000a483512855cb3c2b1ac9068f107d041692db3e6afc10502d79800ca1a5e5bad4aa2d951581b4ab822f3fdbd00738a62f8a3144a7322c11dc245de017f9144ccc2700d69f52b63cb3fa430f8ec4a770200f11e142207501637bbe2a72017a0032',
]

# Connct to drone
for packet in packets:
    tcp_socket.send(codecs.decode(packet, 'hex'))
print('Completed handshake');

# Start recieving video
BUFFER_SIZE = 1460
f = open('drone_stream.h264', 'wb')
def start_writing_vid():
    print('Writing to video file')
    while 1:
        try:
            data = tcp_socket.recv(BUFFER_SIZE)
            f.write(data)
        except KeyboardInterrupt:
            tcp_socket.close()
            f.close()
    tcp_socket.close()
    f.close()
threading.Thread(target=start_writing_vid).start()

command = '6680808080000099'
idle_command = command

# Connect to UDP
udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
udp_socket.connect((HOST, UDP_PORT))

print('Completed udp connection')

# Continuously send command
def command_sender():
    global command
    while 1:
        print(command)
        udp_socket.send(codecs.decode(command, 'hex'))
        time.sleep(.05)
threading.Thread(target=command_sender).start()
time.sleep(3)
command = '6680808080010199'
time.sleep(3)
command = '668080508000d099'
time.sleep(.1)
command = '668080288000a899'
time.sleep(3)
command = idle_command
