//#region JSDoc Type Declarations
/**
 * The response object from Dynamo.
 * @typedef {Object} DoodleItem
 * @property {string} createddate
 * @property {string} yy-mm-dd
 * @property {string} drawing
 */
//#endregion

//#region Global variables
const drawingModalId = 'drawingModal';
const drawingCanvasId = 'drawingCanvas';

const baseUrl =
  'https://758js4xuaf.execute-api.us-east-2.amazonaws.com/doodles';
const canvEdgeLen = 320;
const doodleEdge = 32;
const pxSize = ~~(canvEdgeLen / doodleEdge);

/** @type {DoodleItem[]} */
let posts = [];
let eraseMode = false;
//#endregion

//#region Event Handlers

function handleCreateButton() {
  showDrawingModal();
}

function handleCancelButton() {
  hideDrawingModal();
}

function handleDrawingModalBackdropClick() {
  hideDrawingModal();
}

function handleResetButton() {
  drawToDrawingCanvas(generateEmtpyDrawingBinary());
}

/**@param {Event} event */
function handleEraseCheckBox(event) {
  eraseMode = event.target.checked;
}

async function handlePostButton() {
  const drawing = compressToString(drawingCanvas.dataset.drawing);
  const responseObj = await postDrawingAPI(drawing);
  if (responseObj !== null) {
    posts.push(responseObj);
    renderPosts();
    handleResetButton();
    hideDrawingModal();
  }
}

/** @param {Event} event */
async function handleDeleteButton(event) {
  const doodle = getDoodleItemFromDeleteButton(event.target);
  if (doodle === null) return;

  const deleted = await deleteDrawingAPI(doodle);

  if (deleted) {
    const indexOfDeleted = posts.findIndex(
      (x) =>
        x['yy-mm-dd'] === doodle['yy-mm-dd'] &&
        x.createddate === doodle.createddate
    );
    if (indexOfDeleted === -1) {
      console.error('Posts array deleted drawing could not be found');
    } else {
      posts.splice(indexOfDeleted, 1);
      renderPosts();
    }
  }
}

/** @param {MouseEvent} evt */
function handleCanvasMouseUp(evt) {
  const leftMousePressed = evt.button === 0;
  const color = leftMousePressed && !eraseMode ? 1 : 0;
  const pixels = getCanvasPixels(evt.clientX, evt.clientY);
  evt.target.setAttribute(
    'data-drawing',
    drawPixelAt(pixels.x, pixels.y, color, evt.target.dataset.drawing)
  );
}

/** @param {MouseEvent} evt */
function handleCanvasMouseMove(evt) {
  const noButtonPresed = evt.buttons === 0;
  const leftMousePressed = evt.buttons === 1;

  if (noButtonPresed) return;
  const pixels = getCanvasPixels(evt.clientX, evt.clientY);
  const color = leftMousePressed && !eraseMode ? 1 : 0;
  const newDrawing = drawPixelAt(
    pixels.x,
    pixels.y,
    color,
    evt.target.dataset.drawing
  );
  evt.target.setAttribute('data-drawing', newDrawing);
}

/** @param {TouchEvent} evt */
function handleCanvasTouchMove(evt) {
  evt.preventDefault(); // prevent scroll

  const pixels = getCanvasPixels(
    evt.touches[0].clientX,
    evt.touches[0].clientY
  );
  const color = eraseMode ? 0 : 1;
  const newDrawing = drawPixelAt(
    pixels.x,
    pixels.y,
    color,
    evt.target.dataset.drawing
  );
  evt.target.setAttribute('data-drawing', newDrawing);
}

//#endregion

//#region API Functions

/**
 * Returns all posts from today (UTC). Returns empty array if non success.
 * @returns {Promise<DoodleItem[]>}
 * */
async function getPostsAPI() {
  const yyMmDd = new Date().toISOString().slice(2, 10); // "23-02-22"
  const reqUrl = baseUrl + '/' + yyMmDd;
  const response = await fetch(reqUrl).catch((err) => {
    console.error("Couldn't fetch records or parse body", err);
  });

  const responseBody = await response.json();
  if (response.ok) {
    return responseBody;
  } else {
    console.error(responseBody);
  }
  return [];
}

/**
 * Posts the given drawing and returns the response from API or null on non-success.
 * @param drawing {string} Compressed drawing string
 * @returns {Promise<DoodleItem | null>}
 * */
async function postDrawingAPI(drawing) {
  const response = await fetch(baseUrl, {
    method: 'PUT',
    body: JSON.stringify({ drawing: drawing }),
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch((err) => {
    console.error(err);
  });

  /** @type {DoodleItem | string} */
  const responseBody = await response.json();
  if (!response.ok) {
    console.error(responseBody);
    return null;
  }
  return responseBody;
}

/**
 * Attempt to delete the given DoodleItem. Returns success.
 * @param {DoodleItem} doodleItem DoodleItem to delete
 * @returns {Promise<Boolean>}
 */
async function deleteDrawingAPI(doodleItem) {
  const url = [baseUrl, doodleItem['yy-mm-dd'], doodleItem.createddate].join(
    '/'
  );
  const response = await fetch(url, { method: 'DELETE' }).catch((err) => {
    console.error(err);
  });
  const responseBody = await response.json();
  const success = !!response.ok;
  if (!success) console.error(responseBody);
  return success;
}

//#endregion

//#region Utility functions

/** @returns {string} */
function generateEmtpyDrawingBinary() {
  let drawing = '';
  for (let i = 0; i < doodleEdge * doodleEdge; i++) {
    drawing += '0';
  }
  return drawing;
}

/** @returns {string} */
function generateRandomDrawingBinary() {
  let drawing = '';
  for (let i = 0; i < doodleEdge * doodleEdge; i++) {
    drawing += Math.random() > 0.5 ? '1' : '0';
  }
  return drawing;
}

/**
 * @param {string} binaryStr
 * @returns {string}
 */
function compressToString(binaryStr) {
  return binaryStr
    .split(/([01]{16})/) // Split binary string every 2 bytes / 16 bits
    .filter((x) => x !== '') // Remove empty strings between each byte
    .map((x) => String.fromCharCode(Number('0b' + x)))
    .join('');
}

/**
 * @param {string} compressStr
 * @returns {string}
 */
function decompressToBinary(compressStr) {
  return compressStr
    .split('')
    .map((x) => x.charCodeAt(0).toString(2).padStart(16, '0'))
    .join('');
}

/** Sanity checks */
function testFunctions() {
  const testBinary = generateRandomDrawingBinary();

  if (testBinary.length !== doodleEdge * doodleEdge) {
    throw new Error(
      `Generated drawings must be ${doodleEdge} x ${doodleEdge} long`
    );
  }
  if (compressToString(testBinary).length !== (doodleEdge * doodleEdge) / 16) {
    throw new Error(
      'Each character in compressed string must be two bytes long'
    );
  }
  if (testBinary !== decompressToBinary(compressToString(testBinary))) {
    throw new Error('Compress-decompress tests do not pass');
  }
}

/**
 * @param {Number} x Must be smaller than doodleEdge value
 * @param {Number} y Must be smaller than doodleEdge value
 * @param {Number} color Must be `0` or `1`
 * @param {string} drawing
 */
function drawPixelAt(x, y, color, drawing) {
  // No checking done for performance
  const index = y * doodleEdge + x;
  return drawing.substring(0, index) + color + drawing.substring(index + 1);
}

function animationFunction() {
  drawToDrawingCanvas();
  window.requestAnimationFrame(animationFunction);
}

/**
 * @param {number} mouseX
 * @param {number} mouseY
 */
function getCanvasPixels(mouseX, mouseY) {
  const canvas = document.getElementById(drawingCanvasId);
  const boundingRect = canvas.getBoundingClientRect();
  const canvasX = clamp(mouseX - boundingRect.left, 0, canvEdgeLen - 1);
  const canvasY = clamp(mouseY - boundingRect.top, 0, canvEdgeLen - 1);
  return {
    x: ~~((canvasX / canvEdgeLen) * doodleEdge),
    y: ~~((canvasY / canvEdgeLen) * doodleEdge),
  };
}

/**
 * @param {number} val
 * @param {number} min
 * @param {number} max
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} drawing
 */
function drawToContext(ctx, drawing) {
  // TODO: Implement buffer code to avoid redraws
  // const bufferCanvas = document.createElement("canvas");
  // bufferCanvas.width = doodleEdge;
  // bufferCanvas.height = doodleEdge;
  // const bufferCtx = bufferCanvas.getContext("2d");
  // const bufferCnvImgData = bufferCtx.createImageData(doodleEdge, doodleEdge);
  // const bufferCnvBuffer = new Uint32Array(bufferCnvImgData.data.buffer);

  // Disable anti-aliasing in canvas
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvEdgeLen, canvEdgeLen);
  ctx.fillStyle = '#000';

  // Old 16x16 mode
  if (drawing.length === 16 * 16) {
    for (const [i, letter] of drawing.split('').entries()) {
      const col = ~~(i % 16);
      const row = ~~(i / 16);

      if (letter === '1') {
        ctx.fillRect(
          col * pxSize * 2,
          row * pxSize * 2,
          pxSize * 2,
          pxSize * 2
        );
      }
    }
  } else {
    for (const [i, letter] of drawing.split('').entries()) {
      const col = ~~(i % doodleEdge);
      const row = ~~(i / doodleEdge);

      if (letter === '1') {
        ctx.fillRect(col * pxSize, row * pxSize, pxSize, pxSize);
      }
    }
  }
}

/**
 * Reads data attributes from a delete button and returns a DoodleItem object containing sort and partition keys.
 * @param {HTMLButtonElement} deleteButton
 * @returns {DoodleItem | null}
 */
function getDoodleItemFromDeleteButton(deleteButton) {
  const partition = deleteButton.dataset.partition;
  const sort = deleteButton.dataset.sort;

  if (!partition || !sort) {
    console.error('Delete button data elements not set correctly');
    return null;
  }

  return (itemToDelete = { 'yy-mm-dd': partition, createddate: sort });
}

//#endregion

//#region UI Functions

function initializeDrawingCanvas() {
  testFunctions();

  const initialDrawing = generateEmtpyDrawingBinary();
  drawToDrawingCanvas(initialDrawing);
  addDrawingCanvasListeners();

  const eraseCheckBox = document.getElementById('eraseChk');
  eraseCheckBox.addEventListener('change', handleEraseCheckBox);

  const postButton = document.getElementById('postButton');
  postButton.addEventListener('click', handlePostButton);

  const cancelButton = document.getElementById('cancelDrawButton');
  cancelButton.addEventListener('click', handleCancelButton);

  const drawingModalBackdrop = document.getElementById('drawingModalBackdrop');
  drawingModalBackdrop.addEventListener(
    'click',
    handleDrawingModalBackdropClick
  );

  const createButton = document.getElementById('createButton');
  createButton.addEventListener('click', handleCreateButton);

  const resetButton = document.getElementById('resetDrawButton');
  resetButton.addEventListener('click', handleResetButton);
}

function showDrawingModal() {
  document.getElementById('drawingModalBackdrop').hidden = false;
  document.getElementById(drawingModalId).hidden = false;
}

function hideDrawingModal() {
  document.getElementById('drawingModalBackdrop').hidden = true;
  document.getElementById(drawingModalId).hidden = true;
}

/**
 * If no value is passed in, draw to the drawingCanvas with current data-drawing value.
 * @param {string | undefined} drawing
 */
function drawToDrawingCanvas(drawing) {
  const drawingCanvas = document.getElementById(drawingCanvasId);

  if (drawing) {
    drawingCanvas.setAttribute('data-drawing', drawing);
  } else {
    drawing = drawingCanvas.dataset.drawing;
  }
  drawToContext(drawingCanvas.getContext('2d'), drawing);
}

function renderPosts() {
  const containerElement = document.getElementById('contents');
  if (!containerElement) throw new Error('content div not found');
  if (!posts?.length) {
    contents.innerText = 'No content yet :(';
    return;
  }

  // TODO: Make the posts show up without removing all elements
  containerElement.innerHTML = '';

  // Show posts in reverse order
  for (let i = posts.length - 1; i >= 0; i--) {
    const post = posts[i];
    const postContainer = document.createElement('div');
    postContainer.classList.add('postContainer', 'row');
    postContainer.style.textAlign = 'center';

    const caption = document.createElement('div');
    caption.classList.add('postCaption');
    caption.innerText = post['yy-mm-dd'] + '/' + post.createddate;

    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete';
    deleteButton.setAttribute('data-partition', post['yy-mm-dd']);
    deleteButton.setAttribute('data-sort', post.createddate);
    deleteButton.addEventListener('click', handleDeleteButton);

    const canvas = document.createElement('canvas');
    canvas.width = canvEdgeLen;
    canvas.height = canvEdgeLen;
    const ctx = canvas.getContext('2d');

    drawToContext(ctx, decompressToBinary(post.drawing));
    postContainer.appendChild(canvas);
    postContainer.appendChild(caption);
    postContainer.appendChild(deleteButton);
    containerElement.appendChild(postContainer);
  }
}

function addDrawingCanvasListeners() {
  const cnvElt = document.getElementById('drawingCanvas');
  cnvElt.addEventListener('mouseup', handleCanvasMouseUp);
  cnvElt.addEventListener('mousemove', handleCanvasMouseMove);
  cnvElt.addEventListener('touchmove', handleCanvasTouchMove);
  // Disable right-click context menu
  cnvElt.addEventListener('contextmenu', (e) => e.preventDefault());
}

//#endregion

window.addEventListener('load', async (_) => {
  initializeDrawingCanvas();
  posts = await getPostsAPI();
  renderPosts();
  window.requestAnimationFrame(animationFunction);
});
