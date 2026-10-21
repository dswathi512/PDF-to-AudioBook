
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
let statusTimer = null;
let stopping = false;

pdfInput.addEventListener("change", () => {
    const file = pdfInput.files[0];
    fileName.textContent = file ? file.name : "No file selected";
});

function stopStatusTimer() {
    if (statusTimer) {
        clearInterval(statusTimer);
        statusTimer = null;
    }
}

function setStoppedUI(text) {
    stopStatusTimer();

    statusDot.classList.remove("active");
    startBtn.disabled = !uploaded;
    stopBtn.disabled = true;
    message.textContent = text;
}

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
    stopBtn.disabled = true;
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
        bookTitle.textContent = file.name;
        progressText.textContent = "Ready to listen";
        pageCount.textContent = `${data.count} sentences`;
        progressBar.style.width = "0%";

        statusDot.classList.remove("active");
        startBtn.disabled = false;
        stopBtn.disabled = true;
        message.textContent = data.message;

    } catch (error) {
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
    stopBtn.disabled = true;
    message.textContent = "Starting audiobook...";

    try {
        const response = await fetch("/start", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not start playback.");
        }

        statusDot.classList.add("active");
        stopBtn.disabled = false;
        message.textContent = data.message;

        stopStatusTimer();
        statusTimer = setInterval(updateStatus, 700);
        updateStatus();

    } catch (error) {
        message.textContent = error.message;
        startBtn.disabled = false;
        stopBtn.disabled = true;
    }
});

stopBtn.addEventListener("click", async () => {
    if (stopping) return;

    stopping = true;
    stopBtn.disabled = true;
    startBtn.disabled = true;
    message.textContent = "Stopping audiobook...";

    try {
        const response = await fetch("/stop", {
            method: "POST"
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not stop playback.");
        }

        setStoppedUI(data.message);

    } catch (error) {
        message.textContent = error.message;
        startBtn.disabled = false;
        stopBtn.disabled = false;
    } finally {
        stopping = false;
    }
});

async function updateStatus() {
    try {
        const response = await fetch("/status");
        const data = await response.json();

        if (data.total > 0) {
            const percentage = Math.min(
                (data.current / data.total) * 100,
                100
            );

            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${percentage.toFixed(0)}% completed`;
            pageCount.textContent =
                `${data.current} / ${data.total} sentences`;
        }

        if (data.state === "finished") {
            progressBar.style.width = "100%";
            setStoppedUI("Audiobook finished!");
        } else if (data.state === "stopped") {
            setStoppedUI("Playback stopped.");
        } else if (data.state === "error") {
            setStoppedUI("A speech error occurred. Please try again.");
        }

    } catch (error) {
        console.error("Could not get playback status:", error);
    }
}
