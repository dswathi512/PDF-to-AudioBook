
const pdfInput = document.getElementById("pdfInput");
const uploadBtn = document.getElementById("uploadBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const message = document.getElementById("message");
const fileName = document.getElementById("fileName");
const bookTitle = document.getElementById("bookTitle");
const progressText = document.getElementById("progressText");
const pageCount = document.getElementById("pageCount");
const progressBar = document.getElementById("progressBar");
const statusDot = document.getElementById("statusDot");

let uploaded = false;
let isPlaying = false;
let statusTimer = null;

pdfInput.addEventListener("change", () => {
    const file = pdfInput.files[0];

    fileName.textContent = file ? file.name : "No file selected";
});

uploadBtn.addEventListener("click", async () => {
    const file = pdfInput.files[0];

    if (!file) {
        message.textContent = "Please select a PDF file first.";
        return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
        message.textContent = "Please select a PDF file.";
        return;
    }

    uploadBtn.disabled = true;
    startBtn.disabled = true;
    message.textContent = "Uploading and reading your PDF...";

    try {
        const formData = new FormData();
        formData.append("pdf", file);

        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
        }

        uploaded = true;
        isPlaying = false;

        bookTitle.textContent = file.name;
        progressText.textContent = "Ready to listen";
        pageCount.textContent = `${data.count} sentences`;
        progressBar.style.width = "0%";

        startBtn.disabled = false;
        stopBtn.disabled = true;

        message.textContent = data.message;

    } catch (error) {
        uploaded = false;
        message.textContent = error.message;
    } finally {
        uploadBtn.disabled = false;
    }
});

startBtn.addEventListener("click", async () => {
    if (!uploaded) {
        message.textContent = "Please upload a PDF first.";
        return;
    }

    startBtn.disabled = true;
    message.textContent = "Starting audiobook...";

    try {
        const response = await fetch("/start", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not start playback.");
        }

        isPlaying = true;
        stopBtn.disabled = false;
        statusDot.classList.add("active");
        message.textContent = data.message;

        if (statusTimer) clearInterval(statusTimer);
        statusTimer = setInterval(updateStatus, 1000);

    } catch (error) {
        message.textContent = error.message;
        startBtn.disabled = false;
    }
});

stopBtn.addEventListener("click", async () => {
    stopBtn.disabled = true;
    message.textContent = "Stopping audiobook...";

    try {
        const response = await fetch("/stop", {
            method: "POST"
        });

        const data = await response.json();

        isPlaying = false;
        statusDot.classList.remove("active");
        message.textContent = data.message;

        if (statusTimer) {
            clearInterval(statusTimer);
            statusTimer = null;
        }

        startBtn.disabled = false;
    } catch (error) {
        message.textContent = "Could not stop playback.";
    }
});

async function updateStatus() {
    try {
        const response = await fetch("/status");
        const data = await response.json();

        const total = data.total;
        const current = data.current;

        if (total > 0) {
            const percentage = Math.min((current / total) * 100, 100);
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${percentage.toFixed(0)}% completed`;
            pageCount.textContent = `${current} / ${total} sentences`;
        }

        if (data.state === "finished") {
            isPlaying = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusDot.classList.remove("active");
            message.textContent = "Audiobook finished!";

            clearInterval(statusTimer);
            statusTimer = null;
        }

        if (data.state === "stopped" || data.state === "error") {
            isPlaying = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusDot.classList.remove("active");

            if (data.state === "error") {
                message.textContent = "A speech error occurred. Please try again.";
            }

            clearInterval(statusTimer);
            statusTimer = null;
        }
    } catch (error) {
        console.error("Could not get playback status:", error);
    }
}
