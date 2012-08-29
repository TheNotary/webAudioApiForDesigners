// We need to check if this system has the webAudioContext defined.  
// As of right now chrome will, but firefox won't because they just started implimenting
if (typeof(webkitAudioContext) == "undefined" && typeof(mozAudioContext) == "undefined") {
  window.webkitAudioContext = function(){throw "Web Audio API not supported in this browser";};
}

function initializeNewWebAudioContext() {
  var context; // this is our web audio context, our way of
               // controlling and keeping track all of our sounds.  
  try {
    if (typeof(mozAudioContext) != "undefined") {
      context = new mozAudioContext();
    }
    else{
      context = new webkitAudioContext();
    }
  }
  catch(e) {
    // alert('Web Audio API is not supported in this browser.  HTML 5 Audio Elements will be used instead.');
    context = new fallbackAudioContext();
  }
  return context;
}

// this is a very strange function which asks that you name
// the buffer that you plan to store the sound data in...  
// It's almost meta, but still javascript
webkitAudioContext.prototype.loadSound = function (url, strNameOfSoundBufferVariable) {
  var context = this;
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      context.buffers[strNameOfSoundBufferVariable] = buffer; // when finished, put the PCM audio data in the buffer we named
    }, onError);
  }
  request.send();
}

function onError() {
  alert('something suboptimal happened while attempting to decode some audioData.');
}

webkitAudioContext.prototype.playSound = function(strBuffer) {
  var context = this;
  buffer = this.buffers[strBuffer];  // get the audio buffer by it's name
  
  var source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // Give the Source some PCM data to be played
  source.connect(context.destination);       // connect the audio source the speakers
  source.noteOn(0);                          // play the audio source zero seconds from now
}

// We need a place to store our audio buffers.  
// May as well pin them here, directly to the context
webkitAudioContext.prototype.buffers = {};

// The fallback context is used on browsers that don't use webkitAudioContext.
// In the case of a fallback, html5 audio will be used instead
function fallbackAudioContext() {
  this.buffers = {};
  //this.buffersIndecies = {};
}

function fallbackAudioEntity(url) {
  this.audioElement = new Audio(url);  // Place the audio element here
  this.tracks = {};  // .play() multiple audio elements simultaniously in this tracks collection.  It's gc friendly
  this.audioBufferIndex = 0;  // these help us keep track of the new Audio() elements we create so
  this.maxSoundsAtOnce = 32;  // they garbage collect a tiny bit easier
}

fallbackAudioEntity.prototype.playNew = function() {
  var i = this.audioBufferIndex;
  
  if (typeof(this.tracks[i]) != 'undefined')
    this.tracks[i].src = '';  // minimize memory usage... and smoothness too???
  this.tracks[i] = this.audioElement.cloneNode(true);
  this.tracks[i].play();
  
  // this stuff is done to prevent "memory leaking" in browsers, which causes a 
  // stall when it does it's garbage collection after spawning off too many Audio objects
  this.audioBufferIndex++;
  if (this.audioBufferIndex >= this.maxSoundsAtOnce)
    this.audioBufferIndex = 0;
}

fallbackAudioContext.prototype.loadSound = function(url, strNameOfSoundBufferVariable) {
  this.buffers[strNameOfSoundBufferVariable] = new fallbackAudioEntity(url);
}

fallbackAudioContext.prototype.playSound = function(strBufferName){
  this.buffers[strBufferName].playNew();
}



