const toUint8Array = function(parStr){
  var raw = window.atob(parStr);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  var i;
  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;    
};

//Wait for page to load
$(document).ready(() => {
  const socket = io();
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
  socket.on('video', data => {
    var bin = toUint8Array(data);
    p.decode(bin);
  });
});
