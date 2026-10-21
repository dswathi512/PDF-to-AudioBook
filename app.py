
from flask import Flask, render_template, request, jsonify
import PyPDF2
import pyttsx3
import threading
import re

app = Flask(__name__)

sentences = []
current = 0
state = "idle"

stopped = threading.Event()
lock = threading.Lock()


def read_pdf():
    global current, state

    player = pyttsx3.init()

    try:
        while current < len(sentences):
            if stopped.is_set():
                break

            with lock:
                sentence = sentences[current]
                state = "playing"

            player.say(sentence)
            player.runAndWait()

            if stopped.is_set():
                break

            with lock:
                current += 1

        with lock:
            state = "stopped" if stopped.is_set() else "finished"

    except Exception as e:
        print("Speech error:", e)
        with lock:
            state = "error"

    finally:
        player.stop()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    global sentences, current, state

    file = request.files.get("pdf")

    if not file or not file.filename:
        return jsonify(error="Please select a PDF file."), 400

    if not file.filename.lower().endswith(".pdf"):
        return jsonify(error="Please upload a PDF file."), 400

    try:
        reader = PyPDF2.PdfReader(file)

        if reader.is_encrypted:
            return jsonify(error="This PDF is password-protected."), 400

        text = " ".join(
            page.extract_text() or "" for page in reader.pages
        )

        if not text.strip():
            return jsonify(
                error="No readable text found. This may be a scanned PDF."
            ), 400

        new_sentences = [
            s.strip()
            for s in re.findall(r"[^.!?]+[.!?]*", text)
            if s.strip()
        ]

        if not new_sentences:
            return jsonify(error="No readable sentences found."), 400

        with lock:
            sentences = new_sentences
            current = 0
            state = "ready"

        return jsonify(
            message="PDF uploaded successfully!",
            count=len(sentences)
        )

    except Exception as e:
        return jsonify(error=f"Could not read PDF: {e}"), 400


@app.route("/start", methods=["POST"])
def start():
    global current, state

    with lock:
        if not sentences:
            return jsonify(error="Please upload a PDF first."), 400

        if state == "playing":
            return jsonify(message="Audiobook is already playing.")

        current = 0
        stopped.clear()
        state = "playing"

    threading.Thread(target=read_pdf, daemon=True).start()

    return jsonify(message="Audiobook started!")


@app.route("/stop", methods=["POST"])
def stop():
    global state

    stopped.set()

    with lock:
        state = "stopped"

    return jsonify(message="Playback stopped.")


@app.route("/status")
def status():
    with lock:
        return jsonify(
            state=state,
            current=min(current + 1, len(sentences)),
            total=len(sentences)
        )


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
