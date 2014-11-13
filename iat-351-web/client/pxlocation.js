window.addEventListener("load", function(event) {
    // retrieve rgb value from android
    var r = 0;
    var g = 0;
    var b = 0;

    var x = 0;
    var y = 0;

    setInterval(function(event) {
        RGBtoXY(messageText);
        console.log(r + " " + g + " " + b);
        console.log("X: " + x);
        console.log("Y: " + y);
    }, 500);

    function RGBtoXY (input) {
        var value = messageText.split(","); //.textContent.split(",");
        r = value[0];
        g = value[1];
        b = value[2];

        
    }
});