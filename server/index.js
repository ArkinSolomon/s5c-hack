//Import modules
const Express = require('express');
// const { Converter } = require('ffmpeg-stream');
const path = require('path');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
// const Stream = require('stream');
const net = require('net');
const { Server } = require("socket.io");
const http = require('http');


//Server ports
const HTTP_PORT = 9000;
const STREAM_IN_PORT = 9001;

//Socket.io and express setup
const app = Express();
app.use(Express.static(path.join(__dirname, 'public')));

//Set up websocket streams
expressWebSocket(app, null, {
  perMessageDeflate: false,
});

const server = http.createServer(app);
const io = new Server(server);

//Connect from drone
var droneStream;
var droneServer = net.createServer(socket => {
  droneStream = socket;
  droneStream.setEncoding('hex');
  droneStream.on('data', chunk => {
    io.emit('video', chunk);
  });
  console.log(`Listening for drone stream on port ${STREAM_IN_PORT}`);
});


droneServer.listen(STREAM_IN_PORT, '127.0.0.1');

//Get video stream
app.ws('/stream', (ws, req) => {
  const stream = websocketStream(ws, {
    binary: true,
  });

  droneStream.pipe(stream);
});

//Listen for trafic
server.listen(HTTP_PORT, () => {
  console.log(`Server listening for HTTP requests on port ${HTTP_PORT}`);
});
