/**
 * The response object from Dynamo.
 * @typedef {Object} DoodleItem
 * @property {string} createddate
 * @property {string} yy-mm-dd
 * @property {string} drawing
 */

const baseUrl = "https://758js4xuaf.execute-api.us-east-2.amazonaws.com/doodles/";
const doodleEdge = 16;

window.addEventListener("load", async (_) => {
    const posts = await loadPosts();
    console.log(posts);
    const contents = document.getElementById("contents");
    if (!contents) throw new Error("content div not found");
    renderPosts(posts, contents);
});

/** @returns {DoodleItem[]} */
async function loadPosts() {
    const yyMmDd = new Date().toISOString().slice(2, 10); // "23-02-22"
    const reqUrl = baseUrl + yyMmDd;
    console.log(reqUrl)
    return await fetch(reqUrl)
        .then(res => res.json())
        .catch(err => {
            console.error("Couldn't fetch records or parse body");
        });
}

/**
 * @param {DoodleItem[]} posts
 * @param {HTMLElement} containerElement 
*/
function renderPosts(posts, containerElement) {
    const canvEdgeLen = 400;
    const pxSize = ~~(canvEdgeLen / doodleEdge);

    for (const post of posts) {
        const postContainer = document.createElement("div");
        postContainer.classList.add("postContainer", "row");
        postContainer.style.textAlign = "center";

        const caption = document.createElement("h5");
        caption.innerText = post["yy-mm-dd"] + "/" + post.createddate;

        const canvas = document.createElement("canvas");
        canvas.width = canvEdgeLen;
        canvas.height = canvEdgeLen;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvEdgeLen, canvEdgeLen);
        ctx.fillStyle = "#000";

        // const bufferCanvas = document.createElement("canvas");
        // bufferCanvas.width = doodleEdge;
        // bufferCanvas.height = doodleEdge;
        // const bufferCtx = bufferCanvas.getContext("2d");
        // const bufferCnvImgData = bufferCtx.createImageData(doodleEdge, doodleEdge);
        // const bufferCnvBuffer = new Uint32Array(bufferCnvImgData.data.buffer);

        for (const [i, letter] of post.drawing.split("").entries()) {
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
        postContainer.appendChild(canvas);
        postContainer.appendChild(caption);
        containerElement.appendChild(postContainer);
    }
}