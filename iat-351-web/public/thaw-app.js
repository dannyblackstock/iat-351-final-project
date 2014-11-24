var socket = io();
      var pixels = [];
      var selectedTool = 0;
      var lastTime = 0;
      var radioButtonArray = ["penRadio", "eraserRadio", "sizeRadio"];

      $('form').submit(function() {
        socket.emit('rgbMsg', $('#m').val());
        $('#m').val('');
        return false;
      });
      socket.on('rgbMsg', function(msg) {
        $('#rgbMsg').text(RGBtoXY(msg));
      });

      socket.on('fingerMsg', function(msg) {
        var currentNumFingers = msg;

        console.log(currentNumFingers);
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

          console.log("time to release: " + difference + "ms");

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
        console.log(selectedTool);

        // select the right one
        if ((selectedTool - 1) < 0) {
          document.getElementById("penRadio").checked = true;
        }
        else {
          document.getElementById(radioButtonArray[selectedTool - 1]).checked = true;
        }
      })

      $(document).ready(function() {
        var canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        var context = canvas.getContext('2d');
        var img = new Image();
        img.src = "gradient-map-danny.png";
        context.drawImage(img, 0, 0);
        imgData = context.getImageData(0, 0, img.width, img.height);
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
            xi = 0;   // reset to 0
          };
          
          j++;
        };
      });

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
        return "x: " + closestColorPixel.x + ", y: " + closestColorPixel.y;
      }

      // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
      function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : null;
      }