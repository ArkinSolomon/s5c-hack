//Import modules
const Express = require('express');
const {Converter} = require('ffmpeg-stream');
const path = require('path');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const Stream = require('stream');
const net = require('net');

//Server ports
const HTTP_PORT = 9000;
const STREAM_IN_PORT = 9001;

//Connect from drone
var droneStream;
var droneServer = net.createServer(socket => {
	droneStream = socket;
  droneStream.on('data', chunk => {
    console.log(chunk);
    console.log(chunk.toString());
  });
  console.log(`Listening for drone stream on port ${STREAM_IN_PORT}`);
});

droneServer.listen(STREAM_IN_PORT, '127.0.0.1');

//Set up HTTP server
const app = Express();
app.use(Express.static(path.join(__dirname, 'public')));

//Set up websocket streams
expressWebSocket(app, null, {
    perMessageDeflate: false,
});

//Get video stream
app.ws('/stream', (ws, req) => {
  const stream = websocketStream(ws, {
    binary: true,
  });

  droneStream.pipe(stream);
});

//Listen for trafic
app.listen(HTTP_PORT, () => {
  console.log(`Server listening for HTTP requests on port ${HTTP_PORT}`);
});
