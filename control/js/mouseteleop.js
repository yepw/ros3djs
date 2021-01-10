/**
 * @author Yeping Wang 
 */

var MOUSETELEOP = MOUSETELEOP || {
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
MOUSETELEOP.Teleop = function(options) {
  let that = this;
  options = options || {};
  let ros = options.ros;
  let topic = options.topic || '/relaxed_ik/ee_pose_goals';
  // permanent throttle
  let throttle = options.throttle || 0.05;
  let canvasid = options.canvasid || undefined;
  // used to externally throttle the speed (e.g., from a slider)
  this.scale = 1.0;

  // linear x and y movement and angular z movement
  let x = 0;
  let y = 0;
  let z = 0;
  let pub = true;
  let speed = 0.005;

  let cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'relaxed_ik_ros1/EEPoseGoals'
  });

  let RADIUS = 20;

  function degToRad(degrees) {
    var result = Math.PI / 180 * degrees;
    return result;
  }

  // setup of the canvas

  let canvas = document.getElementById('mouse_canvas');
  let context = canvas.getContext('2d');
  
  function canvasDraw() {
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f00";
    context.beginPath();
    context.arc(x, y, RADIUS, 0, degToRad(360), true);
    context.fill();
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

  console.log("before addEventListener");
  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  
  function lockChangeAlert() {
    console.log("lockChangeAlert");
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
      console.log('The pointer lock status is now locked');
      document.addEventListener("mousemove", updatePosition, false);
    } else {
      console.log('The pointer lock status is now unlocked');  
      document.removeEventListener("mousemove", updatePosition, false);
    }
  }

  let animation;
  function updatePosition(e) {
    let oldX = x;
    let oldY = y;
    let oldZ = z;

    x += e.movementX;
    y += e.movementY;
    if (x > canvas.width + RADIUS) {
      x = -RADIUS;
    }
    if (y > canvas.height + RADIUS) {
      y = -RADIUS;
    }  
    if (x < -RADIUS) {
      x = canvas.width + RADIUS;
    }
    if (y < -RADIUS) {
      y = canvas.height + RADIUS;
    }
    // tracker.textContent = "X position: " + x + ", Y position: " + y;
     // publish the command

     if (pub === true) {
      let twist = new ROSLIB.Message({
        header: {
          seq: 0
        },
        ee_poses: [     
          {
          orientation : {
            x : 0,
            y : 0,
            z : 0,
            w : 1
          },
          position : {
            x : -(x - canvas.width/2)*speed + 0.208,
            y : (y - canvas.height/2)*speed ,
            z : 0
          }
        } ]
      });

starting_ee_trans = [0.615, -0.208, 0.349]
      cmdVel.publish(twist);

      // check for changes
      if (oldX !== x || oldY !== y || oldZ !== z) {
        that.emit('change', twist);
      }

      if (!animation) {
        animation = requestAnimationFrame(function() {
          animation = null;
          canvasDraw();
        });
      }
    }
  }
};


MOUSETELEOP.Teleop.prototype.__proto__ = EventEmitter2.prototype;
