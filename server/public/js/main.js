//Wait for page to load
$(document).ready(() => {
  var socket = new WebSocket('ws://localhost:9000/stream');
  socket.binaryType = 'arraybuffer';

  //Create player
  var p = new Player({
    useWorker: true,
    workerFile: '/js/decoder.js',
    size: {
      width: 1280,
      height: 720
    }
  });

  //Insert canvas
  document.getElementById('drone-stream').appendChild(p.canvas);

  //Render video
  socket.onmessage = event => {
    console.log(event.data);
    p.decode(event.data);
  };
});
