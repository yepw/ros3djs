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
  this.scale = 0.3;

  let pub = true;
  let speed = 0.004;

  let cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'relaxed_ik_ros1/EEPoseGoals'
  });

  let RADIUS = 20;
  let dotColor = "#ff0000"

  function degToRad(degrees) {
    var result = Math.PI / 180 * degrees;
    return result;
  }

  // setup of the canvas

  let canvas = document.getElementById('mouse_canvas');
  let context = canvas.getContext('2d');
  
  // linear x and y movement and angular z movement
  let x =  canvas.width / 2;
  let y =  canvas.height / 2;
  let z = 0;

  function canvasDraw() {
    context.fillStyle = "#272727";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.beginPath();
    context.moveTo( 0, canvas.height/2);
    context.lineTo(canvas.width, canvas.height/2);
    for (let i=1; i<=9; i++) {
      context.moveTo(canvas.width/10*i, canvas.height/2);
      context.lineTo(canvas.width/10*i, canvas.height/2+10);
    }
    context.moveTo( canvas.width/2 , 0);
    context.lineTo(canvas.width/2, canvas.height);
    for (let i=1; i<=9; i++) {
      context.moveTo(canvas.width/2-10, canvas.height/10*i);
      context.lineTo(canvas.width/2, canvas.height/10*i);
    }
    context.strokeStyle = "#D1E8E2";
    context.stroke();

    context.fillStyle = dotColor;
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

  document.addEventListener('pointerlockchange', lockChangeAlert, false);
  document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
  
  function lockChangeAlert() {
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas) {
      console.log('The pointer is now LOCKED in Mouse Position control panel');
      dotColor = "#00ff00"
      document.addEventListener("mousemove", updatePosition, false);
    } else {
      console.log('The pointer is now UNLOCKED in Mouse Position control panel'); 
      dotColor = "#ff0000" 
      canvasDraw();
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
            x : -(y - canvas.height/2)*speed * that.scale,
            y : -(x - canvas.width/2)*speed * that.scale,
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
