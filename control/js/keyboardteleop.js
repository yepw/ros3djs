/**
 * @author Russell Toris - rctoris@wpi.edu
 * Edited by Yeping Wang 
 */

var KEYBOARDTELEOP = KEYBOARDTELEOP || {
  REVISION : '0.4.0-SNAPSHOT'
};

/**
 * Manages connection to the server and all interactions with ROS.
 *
 * Emits the following events:
 *   * 'change' - emitted with a change in speed occurs
 *
 * @constructor
 * @param options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * topic (optional) - the Twist topic to publish to, like '/cmd_vel'
 *   * throttle (optional) - a constant throttle for the speed
 */
KEYBOARDTELEOP.Teleop = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var topic = options.topic || '/cmd_vel';
  // permanent throttle
  var throttle = options.throttle || 0.05;
  let canvasid = options.canvasid || undefined;
  // used to externally throttle the speed (e.g., from a slider)
  this.scale = 0.3;

  // linear x and y movement and angular z movement
  var x = 0;
  var y = 0;
  var z = 0;
  var cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'geometry_msgs/Twist'
  });

  function drawArrowButton(context, backColor){
    let buttonSize = 50;
    context.fillStyle = backColor;
    context.fillRect(0, 0, buttonSize, buttonSize);
    context.beginPath();
    context.moveTo(buttonSize/2, buttonSize/5*2);
    context.lineTo(buttonSize/5*2, buttonSize/5*3);
    context.lineTo(buttonSize/5*3, buttonSize/5*3);

    context.fillStyle = "Black";
    context.fill();
  }

  /**
   * 
   * @param {String} buttonName 
   * @param {String} canvasid
   */
  function drawButton(canvasid=undefined, buttonName=undefined, keyDown=false) {
      /** @type {HTMLCanvasElement} */
    if (!canvasid) return;
    let canvas = document.getElementById(canvasid);
    let context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.clear
    context.save();
      context.translate(70, 0);
      if (buttonName == "ArrowUp" && keyDown) drawArrowButton(context, "#DDDDDD");
      else drawArrowButton(context, "#777777");
    context.restore();
    context.save();
      context.translate(10, 110);
      context.rotate( -Math.PI / 2);
      if (buttonName == "ArrowLeft" && keyDown) drawArrowButton(context, "#DDDDDD");
      else drawArrowButton(context, "#777777");
    context.restore();
    context.save();
      context.translate(180, 60);
      context.rotate( Math.PI / 2);
      if (buttonName == "ArrowRight" && keyDown) drawArrowButton(context, "#DDDDDD");
      else drawArrowButton(context, "#777777");
    context.restore();
    context.save();
      context.translate(120, 110);
      context.rotate( Math.PI );
      if (buttonName == "ArrowDown" && keyDown) drawArrowButton(context, "#DDDDDD");
      else drawArrowButton(context, "#777777");
    context.restore();
  }

  drawButton(canvasid);  

  // sets up a key listener on the page used for keyboard teleoperation
  var handleKey = function(keyCode, keyDown) {
    // used to check for changes in speed
    var oldX = x;
    var oldY = y;
    var oldZ = z;
    
    var pub = true;

    var speed = 0;
    // throttle the speed by the slider and throttle constant
    if (keyDown === true) {
      speed = throttle * that.scale;
    } 
    // check which key was pressed
    switch (keyCode) {
      case "ArrowLeft":
        // turn left
        y = 0.5 * speed;
        drawButton(canvasid, "ArrowLeft", keyDown);
        break;
      case "ArrowUp":
        // up
        x = 0.5 * speed;
        drawButton(canvasid, "ArrowUp", keyDown);
        break;
      case "ArrowRight":
        // turn right
        y = -0.5 * speed;
        drawButton(canvasid, "ArrowRight", keyDown);
        break;
      case "ArrowDown":
        // down
        x = -0.5 * speed;
        drawButton(canvasid, "ArrowDown", keyDown);
        break;
      default:
        pub = false;
    }

    // publish the command
    if (pub === true) {
      var twist = new ROSLIB.Message({
        angular : {
          x : 0,
          y : 0,
          z : 0
        },
        linear : {
          x : x,
          y : y,
          z : 0
        }
      });
      cmdVel.publish(twist);

      // check for changes
      if (oldX !== x || oldY !== y || oldZ !== z) {
        that.emit('change', twist);
      }
    }
  };

  // handle the key
  var body = document.getElementsByTagName('body')[0];
  body.addEventListener('keydown', function(e) {
    handleKey(e.key, true);
  }, false);
  body.addEventListener('keyup', function(e) {
    handleKey(e.key, false);
  }, false);
};
KEYBOARDTELEOP.Teleop.prototype.__proto__ = EventEmitter2.prototype;
