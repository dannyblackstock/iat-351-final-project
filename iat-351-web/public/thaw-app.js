var socket = io();
var pixels = [];
var selectedTool = 0;
var lastTime = 0;
var radioButtonArray = ["penRadio", "eraserRadio", "sizeRadio"];

var canvas = document.getElementById('gradient-map');
var context = canvas.getContext('2d');

var pCanvas = document.getElementById('paint-canvas');
var pContext = pCanvas.getContext('2d');

// Stream display back to android
var streamCanvas = document.createElement('canvas');
var streamContext = streamCanvas.getContext('2d');

var stroke = pContext.strokeStyle;
var img = new Image();

var position;
var lastPosition = {
  x: 0,
  y: 0
};
var currentNumFingers;
var toolSize;
var radius = 100;

// Prepare canvas
$(document).ready(function() {
  // canvas.width = $(window).width();//600;
  // canvas.height = $(window).height();//600;
  canvas.width = 1000; //600;
  canvas.height = 800; //600;
  console.log(canvas.width);

  // pCanvas.width = $(window).width();
  // pCanvas.height = $(window).height();
  pCanvas.width = 1000;
  pCanvas.height = 1000;

  streamCanvas.width = 1000;
  streamCanvas.height = 1000;

  setStrokeColor("#00aa00");
  setStrokeSize(5);

  img.src = "red-blue.png";
});

// Draw full image for reading in pixel data
img.onload = function() {
  context.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
  // context.drawImage(img, 0, 0);
  var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
  // console.log(imgData);
  var j = 0; // pixel iterator
  var xi = 0; // x iterator
  var yi = 0; // y iterator
  for (var i = 3; i < imgData.data.length + 4; i += 4) {
    // get every pixel's rgba value [0]=R [1]=G [2]=B [3]=A
    // and set its position
    pixels[j] = {};
    pixels[j].r = imgData.data[i - 3];
    pixels[j].g = imgData.data[i - 2];
    pixels[j].b = imgData.data[i - 1];
    pixels[j].a = imgData.data[i];
    pixels[j].x = xi;
    pixels[j].y = yi;

    xi++; // go to next pixel
    if (xi > canvas.width) {
      yi++; // go to next line
      xi = 0; // reset to first pixel of line
    }

    j++;
  }

  updateMask(50, 50);


  // canvas touch/mouse event activating
  $("#paint-canvas").drawMouse();
};


// Show X,Y position of mobile device
socket.on('rgbMsg', function(msg) {
  var incomingColor = parseRGB(msg);

  position = RGBtoXY(incomingColor);

  $('#rgbMsg').text("x: " + position.x + ", y: " + position.y);

  // attempt to relocate position of phone by growing the mask size
  if (incomingColor.r <= 10 && incomingColor.g <= 10 && incomingColor.b <= 10) {
    radius += 250;
    updateMask(lastPosition.x, lastPosition.y, radius);
  } else {
    radius = 250;
    updateMask(position.x, position.y, radius);
    // $('body').css('background', 'rgb(' + parseRGB(msg).r + ',' + parseRGB(msg).g + ',' + parseRGB(msg).b + ')');

    if (currentNumFingers == 1 && position.x < canvas.width - 1 && position.y < canvas.height-1 && Math.abs(lastPosition.x - position.x) < 100 && Math.abs(lastPosition.y - position.y) < 100) {
      // console.log("x distance: " + Math.abs(lastPosition.x - position.x));
      // $( "#paint-canvas").trigger( "mousedown");
      $("#paint-canvas").trigger("touchmove");
      // console.log("FIRST FINGER PRESSED NOW");
    }
    lastPosition = position;
  }
  streamImage(0,0);//position.x, position.y);

});

// Detect finger-counts and switch/use the tools
socket.on('fingerMsg', function(msg) {
  currentNumFingers = msg;

  // painting event emitters
  if (currentNumFingers == 1) {
    $("#paint-canvas").trigger("touchdown");
    // pContext.strokeStyle = "#AA0000";
  }
  else if (currentNumFingers == 5) {
    // clear the canvas
    pContext.clearRect(0, 0, canvas.width, canvas.height);
  }
  else {
    $("#paint-canvas").trigger("touchup");
    // console.log("NOT FIRST FINGER");
  }


  // console.log(currentNumFingers);
  $('#finger-msg').text(currentNumFingers);

  $('#fingers-detected').addClass("show");
  setTimeout(function() {
    $('#fingers-detected').removeClass("show");
  }, 2000);

  if (currentNumFingers == 3 || currentNumFingers == 4){
    if (currentNumFingers > selectedTool) {
      // set the time a finger change was last detected, and the selected tool
      lastTime = new Date().getTime();
      selectedTool = currentNumFingers;
    } else if (currentNumFingers < selectedTool) {
      var currentTime = new Date().getTime();
      var difference = (currentTime - lastTime);

      // console.log("time to release: " + difference + "ms");

      // if the user has held the button for more than the 200ms threshold when they release,
      // use that as the threshold
      if (difference > 200) {
        selectedTool = currentNumFingers;

        // if the user has held down for more than 750ms, then they were probably holding down, so use that.
        // then use that as the tool
        // if (difference > 600) {
          // selectedTool++;
        // }

        lastTime = new Date().getTime();
      }
    }
  }

  // else {
  //   selectedTool = currentNumFingers;
  // }

  // $('#finger-msg').text(selectedTool);
  // console.log(selectedTool);

  // select the right one
  if (selectedTool == 3) {
    document.getElementById("penRadio").checked = true;
    setStrokeColor("#00cc00");
  }
  else {
    document.getElementById("eraserRadio").checked = true;
    setStrokeColor("#000000");
  }
});

socket.on('scale', function(msg) {
  // console.log(msg);
  pContext.lineWidth = msg * 10;
  $("#tool-indicator").css("width", pContext.lineWidth);
  $("#tool-indicator").css("height", pContext.lineWidth);
  $("#size").text(pContext.lineWidth);
});

// Move the mask around depending on android camera location
function updateMask(x, y, radius) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.clip();
    context.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
    // context.drawImage(img, 0, 0);
    context.restore();


  }
  /* Dummy test code for moving mask
    var xpos = 10;
    $(document).on("mousemove", function() {
      updateMask(xpos, xpos);
      console.log(xpos);
      xpos += 10;
    });
  */

function streamImage (x, y) {
  streamContext.clearRect(0, 0, canvas.width, canvas.height);
  streamContext.save();
  streamContext.drawImage(pCanvas, x, y, streamCanvas.width, streamCanvas.height);
  streamContext.restore();

  var streamURL = streamCanvas.toDataURL();
  socket.connect('http://localhost:3000');
  socket.emit('sendImg', streamURL);
  console.log(streamURL);
  // document.getElementById('stream-url').value=streamURL;
  // document.getElementById('stream-image').submit();
}

// Translate RGB values to X,Y position
function RGBtoXY(color) {
  // msg = msg.substring(2);
  // var color = hexToRgb(msg);
  // var x = -1;
  // var y = -1;
  // console.log(color.r+" "+color.g+" "+color.b);

  // track closest
  // var closestColorPixel;

  // var smallestTotalDifference = 255*3;

  // map from rgb to x,y value
  // loop over every 10 pixels to make it faster
  // for (var i = 0; i+10 < pixels.length; i+=10) {
  // for (var i = 0; i+5 < pixels.length; i+=5) {
  // see if the current pixel is further away than the closest so far
  // if (Math.abs(pixels[i].r - color.r) + Math.abs(pixels[i].g - color.g) + Math.abs(pixels[i].b - color.b) < smallestTotalDifference) {

  // smallestTotalDifference = Math.abs(pixels[i].r - color.r) + Math.abs(pixels[i].g - color.g) + Math.abs(pixels[i].b - color.b);
  // smallestGDifference = (Math.abs(pixels[i].g - color.g)
  // smallestBDifference = (Math.abs(pixels[i].b - color.b)

  // closestColorPixel = pixels[i];
  // }
  // if (pixels[i].r == color.r && pixels[i].g == color.g && pixels[i].b == color.b) {
  // };
  // }
  // console.log("x:" + closestColorPixel.x);
  // console.log(closestColorPixel.y);
  return {
    // x: closestColorPixel.x,
    // y: closestColorPixel.y 
    // scale to the canvas size
    y: ((canvas.width / 255) * (255 - color.b)),
    x: ((canvas.height / 255) * (255 - color.r))
  }
  // return "x: " + closestColorPixel.x + ", y: " + closestColorPixel.y;
}

$.fn.drawMouse = function() {
  var clicked = 0;
  var start = function(e) {
    clicked = 1;
    pContext.beginPath();
    // x = e.pageX;
    // y = e.pageY-44;
    x = position.x;
    y = position.y;
    // console.log("START");
    pContext.moveTo(x, y);
  };
  var move = function(e) {
    if (clicked) {
      // x = e.pageX;
      // y = e.pageY-44;

      // if (position.x != 0 && position.y != 0){
      x = position.x;
      y = position.y;
      // } else {
      //   // console.log('BLACK');
      // }
      // console.log("moving finger");

      pContext.lineTo(x, y);
      // console.log("MOVE");
      pContext.stroke();
    }
  };
  var stop = function(e) {
    clicked = 0;
  };
  $(this).on("touchdown", start);
  $(this).on("touchmove", move);
  $(this).on("touchup", stop);
};

// Helper function Hexadecimal colours to R,G,B values
// http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Parses rrr,ggg,bbb string into object because.
function parseRGB(rgb) {
  var rgbSplit = rgb.split(",");
  // console.log(rgbSplit);
  return {
    r: rgbSplit[0],
    g: rgbSplit[1],
    b: rgbSplit[2]
  };
}

function setStrokeColor(color) {
  pContext.strokeStyle = color;
  $("#color").text(pContext.strokeStyle);
  $("#tool-indicator").css("background-color", pContext.strokeStyle);
}

function setStrokeSize(size) {
  pContext.lineWidth = size;
  $("#size").text(pContext.lineWidth);
  $("#tool-indicator").css("width", pContext.lineWidth);
  $("#tool-indicator").css("height", pContext.lineWidth);
}

// bind event handler to clear button
document.getElementById('clear').addEventListener('click', function() {
  pContext.clearRect(0, 0, canvas.width, canvas.height);
}, false);
