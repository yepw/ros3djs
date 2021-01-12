/**
 * @author Yeping Wang 
 */

var MOUSEMOVEMENTNOCLICK = MOUSEMOVEMENTNOCLICK || {
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
MOUSEMOVEMENTNOCLICK.Teleop = function(options) {
  let that = this;
  options = options || {};
  let ros = options.ros;
  let topic = options.topic || '/cmd_vel';
  // permanent throttle
  let throttle = options.throttle || 0.05;
  let canvasid = options.canvasid || undefined;
  // used to externally throttle the speed (e.g., from a slider)
  this.scale = 0.3;

  let pub = true;
  let speed = 0.0003;

  let cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'geometry_msgs/Twist'
  });

  let RADIUS = 20;
  let dotColor = "#ff0000"

  function degToRad(degrees) {
    var result = Math.PI / 180 * degrees;
    return result;
  }

  // setup of the canvas

  let canvas = document.getElementById('mouse_movement_no_click_canvas');
  let context = canvas.getContext('2d');
  
  // linear x and y movement and angular z movement
  let x =  canvas.width / 2;
  let y =  canvas.height / 2;
  let z = 0;

  let oldX = x;
  let oldY = y;
  let oldZ = z;

  let queueX = [];
  let queueY = [];
  let avgX;
  let avgY;

  function avgXY() {
    let totalX = 0;
    let totalY = 0;
    for(let i = 0; i < queueX.length; i++) {
        totalX += queueX[i];
        totalY += queueY[i];
    }
    avgX = totalX / queueX.length;
    avgY = totalY / queueY.length;
  }

  function canvasDraw() {
    context.save();
    context.fillStyle = "#272727";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, RADIUS*5, 0, degToRad(360), true);
    context.strokeStyle = "#D1E8E2";
    context.stroke();

    context.fillStyle = dotColor;
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, RADIUS, 0, degToRad(360), true);
    context.fill();
    
    queueX.push(x);
    queueY.push(y);

    avgXY();

    if (queueX.length > 5) {
      queueX.shift();
      queueY.shift();
    }

    let angle = Math.atan2(avgY - oldY, avgX - oldX);
    let length = Math.sqrt( Math.pow(avgY - oldY, 2) + 
                            Math.pow(avgX - oldX, 2));
    if (length > 10 && (oldX != x || oldY != y)) {
      context.translate(canvas.width / 2, 200);
      context.rotate(angle);
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(length, 0);
      context.lineTo(length - 10, 10);
      context.moveTo(length, 0);
      context.lineTo(length - 10, -10);
      context.lineWidth = 3;
      context.stroke();
    } else {
    }
    context.restore();
  }
  canvasDraw();

  // pointer lock object forking for cross browser

  canvas.requestPointerLock = canvas.requestPointerLock ||
  canvas.mozRequestPointerLock;

  document.exitPointerLock = document.exitPointerLock ||
  document.mozExitPointerLock;

  canvas.onclick = function() {
  canvas.requestPointerLock();
  };


  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  
  function lockChangeAlert() {
    console.log("lockChangeAlert");
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
        console.log('The pointer is now LOCKED in Mouse Movement control panel');
        dotColor = "#00ff00"
        document.addEventListener("mousemove", updatePosition, false);
    } else {
      console.log('The pointer is now UNLOCKED in Mouse Movement control panel'); 
      dotColor = "#ff0000" 
      canvasDraw();
      document.removeEventListener("mousemove", updatePosition, false);
    }
  }

  function updatePosition(e) {
    x += e.movementX;
    y += e.movementY;
    if (x > canvas.width - RADIUS) {
      x = canvas.width - RADIUS;
    }
    if (y > canvas.height - RADIUS) {
      y = canvas.height - RADIUS;
    }  
    if (x < RADIUS) {
      x = RADIUS;
    }
    if (y < RADIUS) {
      y = RADIUS;
    }
    // tracker.textContent = "X position: " + x + ", Y position: " + y;
     // publish the command
    
    canvasDraw();

    if (pub === true) {
      var twist = new ROSLIB.Message({
        angular : {
          x : 0,
          y : 0,
          z : 0
        },
        linear : {
          x : -(y - canvas.height/2)*speed * that.scale,
          y : -(x - canvas.width/2)*speed * that.scale,
          z : 0
        }
      });
      cmdVel.publish(twist);

    }
    x = oldX;
    y = oldY;
  
  }
};


MOUSETELEOP.Teleop.prototype.__proto__ = EventEmitter2.prototype;
