// @ts-check
/* jshint -W069, esversion:6 */


export function drawArrowButton(context){
  console.log(drawArrowButton);
  let buttonSize = 50;
  context.fillRect(0, 0, buttonSize/2, buttonSize/2);
  context.fillStyle = "gray";
  context.fill();
  // context.beginPath();
  // context.moveTo(-40, 0);
  // context.lineTo(0, -40);
  // context.lineTo(40, 0);
  // context.strokeStyle = "black";
  // context.stroke();
}

/**
 * 
 * @param {String} buttonName 
 */
export function drawButton(buttonName=undefined) {
  
    /** @type {HTMLCanvasElement} */
  let canvasKeyboard = /** @type {HTMLCanvasElement} */ (document.getElementById("keyboard_canvas"));
  let contextKeyboard = canvasKeyboard.getContext("2d");
  drawArrowButton(contextKeyboard);
}

drawButton();
  
  