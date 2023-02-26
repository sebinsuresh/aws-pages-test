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
const baseUrl = "https://758js4xuaf.execute-api.us-east-2.amazonaws.com/doodles";
const canvEdgeLen = 320;
const doodleEdge = 16;
const pxSize = ~~(canvEdgeLen / doodleEdge);

/** @type {DoodleItem[]} */
let posts = [];
//#endregion

window.addEventListener("load", async (_) => {
    initializeDrawingCanvas();
    posts = await getPosts();
    renderPosts();
});

//#region Event Handlers

function handleCreateButton() {
    showDrawingModal();
}

function handleCancelButton() {
    hideDrawingModal();
}

function handleResetButton() {
    drawToDrawingCanvas(compressToString(generateRandomDrawingBinary()));
}

async function handlePostButton() {
    const drawing = compressToString(drawingCanvas.dataset.drawing);
    const response = await fetch(baseUrl, {
        method: "PUT",
        body: JSON.stringify({ drawing: drawing }),
        headers: {
            'Content-Type': 'application/json'
        },
    }).catch(err => {
        console.error(err);
    });

    /** @type {DoodleItem | string} */
    const responseBody = await response.json();
    if (response.ok) {
        posts.push(responseBody);
        renderPosts();
        handleResetButton();
        hideDrawingModal();
    } else {
        console.error(responseBody);
    }
}

/** @param {Event} event */
async function handleDeleteButton(event) {
    /** @type {HTMLButtonElement} */
    const button = event.target;
    const partition = button.dataset.partition;
    const sort = button.dataset.sort;

    if (!partition || !sort) {
        throw new Error("Delete button data elements not set correctly");
    }
    const url = [baseUrl, partition, sort].join("/");
    const response = await fetch(url, { method: "DELETE" }
    ).catch(err => {
        console.error(err);
    });

    const responseBody = await response.json();
    if (response.ok) {
        const indexOfDeleted = posts.findIndex(x =>
            x["yy-mm-dd"] === partition &&
            x.createddate === sort
        );
        if (indexOfDeleted === -1) {
            console.error("Posts array deleted drawing could not be found");
        } else {
            posts.splice(indexOfDeleted, 1);
            renderPosts();
        }
    } else {
        console.error(responseBody);
    }
}

//#endregion

//#region API Functions

/** 
 * Returns all posts from today (UTC). Returns empty array if non success.
 * @returns {Promise<DoodleItem[]>} 
 * */
async function getPosts() {
    const yyMmDd = new Date().toISOString().slice(2, 10); // "23-02-22"
    const reqUrl = baseUrl + "/" + yyMmDd;
    const response = await fetch(reqUrl)
        .catch(err => {
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

//#endregion

//#region Utility functions

/** @returns {string} */
function generateRandomDrawingBinary() {
    let drawing = "";
    for (let i = 0; i < doodleEdge * doodleEdge; i++) {
        // drawing += "0";
        drawing += Math.random() > 0.5 ? "1" : "0";
    }
    return drawing;
}

/**
 * @param {string} binaryStr
 * @returns {string}
 */
function compressToString(binaryStr) {
    return binaryStr
        .split(/([01]{16})/)    // Split binary string every 2 bytes / 16 bits
        .filter(x => x !== '')  // Remove empty strings between each byte
        .map(x => String.fromCharCode(Number(
            '0b' + x
        )))
        .join("");
}

/**
 * @param {string} compressStr
 * @returns {string}
 */
function decompressToBinary(compressStr) {
    return compressStr
        .split("")
        .map(x => x
            .charCodeAt(0)
            .toString(2)
            .padStart(doodleEdge, "0"))
        .join("");
}

/** Sanity checks */
function testFunctions() {
    const testBinary = generateRandomDrawingBinary();

    if (testBinary.length !== doodleEdge * doodleEdge) {
        throw new Error(`Generated drawings must be ${doodleEdge} x ${doodleEdge} long`);
    }
    if (compressToString(testBinary).length !== (doodleEdge * doodleEdge) / 16) {
        throw new Error("Each character in compressed string must be two bytes long");
    }
    if (testBinary !== decompressToBinary(compressToString(testBinary))) {
        throw new Error("Compress-decompress tests do not pass");
    }
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

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvEdgeLen, canvEdgeLen);
    ctx.fillStyle = "#000";
    const drawingBinary = decompressToBinary(drawing);
    for (const [i, letter] of drawingBinary.split("").entries()) {
        const col = ~~(i % doodleEdge);
        const row = ~~(i / doodleEdge);

        if (letter === '1') {
            ctx.fillRect(
                col * pxSize,
                row * pxSize,
                pxSize,
                pxSize
            );
        }
    }
}

//#endregion

//#region UI Functions
function initializeDrawingCanvas() {
    testFunctions();

    const initialDrawing = compressToString(generateRandomDrawingBinary());
    drawToDrawingCanvas(initialDrawing);

    const postButton = document.getElementById("postButton");
    postButton.addEventListener("click", handlePostButton);

    const cancelButton = document.getElementById("cancelDrawButton");
    cancelButton.addEventListener("click", handleCancelButton);

    const createButton = document.getElementById("createButton");
    createButton.addEventListener("click", handleCreateButton);

    const resetButton = document.getElementById("resetDrawButton");
    resetButton.addEventListener("click", handleResetButton);
}

function showDrawingModal() {
    document.getElementById("drawingModalBackdrop").hidden = false;
    document.getElementById("drawingModal").hidden = false;
}

function hideDrawingModal() {
    document.getElementById("drawingModalBackdrop").hidden = true;
    document.getElementById("drawingModal").hidden = true;
}

/**
 * @param {string} drawing
 */
function drawToDrawingCanvas(drawing) {
    const drawingCanvas = document.getElementById("drawingCanvas");

    // Access attribute value using `drawingCanvas.dataset.drawing`
    drawingCanvas.setAttribute("data-drawing", decompressToBinary(drawing));
    drawToContext(drawingCanvas.getContext("2d"), drawing);
}

function renderPosts() {
    const containerElement = document.getElementById("contents");
    if (!containerElement) throw new Error("content div not found");
    if (!posts?.length) {
        contents.innerText = "No content yet :(";
        return;
    }

    // TODO: Make the posts show up without removing all elements
    containerElement.innerHTML = '';

    // Show posts in reverse order
    for (let i = posts.length - 1; i >= 0; i--) {
        const post = posts[i];
        const postContainer = document.createElement("div");
        postContainer.classList.add("postContainer", "row");
        postContainer.style.textAlign = "center";

        const caption = document.createElement("div");
        caption.classList.add("postCaption");
        caption.innerText = post["yy-mm-dd"] + "/" + post.createddate;

        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete";
        deleteButton.setAttribute("data-partition", post["yy-mm-dd"]);
        deleteButton.setAttribute("data-sort", post.createddate);
        deleteButton.addEventListener("click", handleDeleteButton);

        const canvas = document.createElement("canvas");
        canvas.width = canvEdgeLen;
        canvas.height = canvEdgeLen;
        const ctx = canvas.getContext("2d");

        drawToContext(ctx, post.drawing);
        postContainer.appendChild(canvas);
        postContainer.appendChild(caption);
        postContainer.appendChild(deleteButton);
        containerElement.appendChild(postContainer);
    }
}

//#endregion
