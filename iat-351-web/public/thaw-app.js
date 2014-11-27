var socket = io();
var pixels = [];
var selectedTool = 0;
var lastTime = 0;
var radioButtonArray = ["penRadio", "eraserRadio", "sizeRadio"];

var canvas = document.getElementById('gradient-map');
var context = canvas.getContext('2d');
var img = new Image();

// Prepare canvas
$(document).ready(function() {
  canvas.width = 600;
  canvas.height = 600;
  img.src = "gradient-map-danny.png";
});

// Draw full image for reading in pixel data
img.onload = function() {
  context.drawImage(img, 0, 0);
  var imgData = context.getImageData(0, 0, img.width, img.height);
  // console.log(imgData);
  var j = 0;    // pixel iterator
  var xi = 0;   // x iterator
  var yi = 0;   // y iterator
  for (var i = 3; i < imgData.data.length + 4; i+=4) {
    // get every pixel's rgba value [0]=R [1]=G [2]=B [3]=A
    // and set its position
    pixels[j] = {};
    pixels[j].r = imgData.data[i-3];
    pixels[j].g = imgData.data[i-2];
    pixels[j].b = imgData.data[i-1];
    pixels[j].a = imgData.data[i];
    pixels[j].x = xi;
    pixels[j].y = yi;

    xi++;       // go to next pixel
    if (xi > img.width) {
      yi++;     // go to next line
      xi = 0;   // reset to first pixel of line
    }
    
    j++;
  }

  updateMask(50, 50);
};

// Show X,Y position of mobile device
socket.on('rgbMsg', function(msg) {
  var position = RGBtoXY(msg);
  $('#rgbMsg').text("x: " + position.x + ", y: " + position.y);
  updateMask(position.x, position.y);
});

// Detect finger-counts and switch/use the tools
socket.on('fingerMsg', function(msg) {
  var currentNumFingers = msg;

  // console.log(currentNumFingers);
  $('#finger-msg').text(currentNumFingers);

  $('#fingers-detected').addClass("show");
  setTimeout(function(){
    $('#fingers-detected').removeClass("show");
  }, 2000);

  if (currentNumFingers > selectedTool) {
    // set the time a finger change was last detected, and the selected tool
    lastTime = new Date().getTime();
    selectedTool = currentNumFingers;
  }

  else if (currentNumFingers < selectedTool) {
    var currentTime = new Date().getTime();
    var difference = (currentTime - lastTime);

    // console.log("time to release: " + difference + "ms");

    // if the user has held the button for more than the 200ms threshold when they release,
    // use that as the threshold
    if (difference > 200){
      selectedTool = currentNumFingers;

      // if the user has held down for more than 750ms, then they were probably holding down, so use that.
      // then use that as the tool
      if (difference > 600) {
        selectedTool++;
      }

      lastTime = new Date().getTime();
    }
  }

  // else {
  //   selectedTool = currentNumFingers;
  // }

  // $('#finger-msg').text(selectedTool);
  // console.log(selectedTool);

  // select the right one
  if ((selectedTool - 1) < 0) {
    document.getElementById("penRadio").checked = true;
  }
  else {
    document.getElementById(radioButtonArray[selectedTool - 1]).checked = true;
  }
});

// Move the mask around depending on android camera location
function updateMask (x, y) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.arc(x, y, 100, 0, 2*Math.PI, false);
  context.clip();
  context.drawImage(img, 0, 0);
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

// Translate RGB values to X,Y position
function RGBtoXY (msg) {
  msg = msg.substring(2);
  var color = hexToRgb(msg);
  // var color = msg.split(","); //.textContent.split(",");
  var x = -1;
  var y = -1;
  // console.log(color.r+" "+color.g+" "+color.b);

  // track closest
  var closestColorPixel;

  var smallestTotalDifference = 255*3;

  // map from rgb to x,y value
  // loop over every 10 pixels to make it faster
  for (var i = 0; i+10 < pixels.length; i+=10) {
    // see if the current pixel is further away than the closest so far
    if (Math.abs(pixels[i].r - color.r) + Math.abs(pixels[i].g - color.g) + Math.abs(pixels[i].b - color.b) < smallestTotalDifference) {

        smallestTotalDifference = Math.abs(pixels[i].r - color.r) + Math.abs(pixels[i].g - color.g) + Math.abs(pixels[i].b - color.b);
        // smallestGDifference = (Math.abs(pixels[i].g - color.g)
        // smallestBDifference = (Math.abs(pixels[i].b - color.b)

        closestColorPixel = pixels[i];
    }
    // if (pixels[i].r == color.r && pixels[i].g == color.g && pixels[i].b == color.b) {
    // };
  }

  return {
    x: closestColorPixel.x,
    y: closestColorPixel.y 
  }
  // return "x: " + closestColorPixel.x + ", y: " + closestColorPixel.y;
}

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