import JSZip from "jszip";

import * as pdfjsLib from "https://esm.sh/pdfjs-dist@3.10.111/legacy/build/pdf.js";

async function extractTextFromPDF(file) {
    const arrayBuf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) })
        .promise;
    let fullText = "";
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n\n";
    }
    return fullText.trim();
}

async function extractTextFromPPTX(file) {
    const zip = await JSZip.loadAsync(file);
    let slideTexts = [];

    const slideFiles = Object.keys(zip.files).filter((k) =>
        /^ppt\/slides\/slide\d+.xml$/.test(k)
    );

    for (const path of slideFiles) {
        const xml = await zip.files[path].async("string");
        // crude regex – good enough for plain text; use DOMParser for more rigor
        const matches = [...xml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)];
        slideTexts.push(matches.map((m) => m[1]).join(" "));
    }
    return slideTexts.join("\n\n").trim();
}

let workerPromise = null;

async function extractTextFromImage(file) {
    if (!workerPromise) {
        workerPromise = Tesseract.createWorker({
            langPath: "https://tessdata.projectnaptha.com/4.0.0", // traineddata source
            corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@2.1.0/tesseract-core.wasm.js", // WASM loader
            workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@2.1.5/dist/worker.min.js" // Web Worker
        });
        await workerPromise.load();
        await workerPromise.loadLanguage("eng");
        await workerPromise.initialize("eng");
    }

    const worker = await workerPromise;
    const { data: { text } } = await worker.recognize(file);
    return text.trim();
}
// Optional: call this when the user leaves the page or after large batches
async function stopOcrWorker() {
    if (workerPromise) {
        const worker = await workerPromise;
        await worker.terminate();
        workerPromise = null;
    }
}

export async function extractText(file) {
    if (!file || !file.name) {
        throw new Error("No file provided for extraction.");
    }

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "pdf") return extractTextFromPDF(file);
    if (ext === "ppt" || ext === "pptx") return extractTextFromPPTX(file);
    if (["png", "jpg", "jpeg"].includes(ext)) return extractTextFromImage(file);
    throw new Error("Unsupported file type");
}