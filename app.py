
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
engine_lock = threading.Lock()

player = None
playback_thread = None


def stop_speech():
    """Signal the worker and stop the active speech engine."""
    stopped.set()

    with engine_lock:
        engine = player

    if engine is not None:
        try:
            engine.stop()
        except Exception as e:
            print("Could not stop speech engine:", e)


def read_pdf():
    global current, state, player

    engine = None

    try:
        engine = pyttsx3.init()

        with engine_lock:
            player = engine

        while not stopped.is_set():
            with lock:
                if current >= len(sentences):
                    break

                sentence = sentences[current]
                state = "playing"

            # Check again immediately before speaking.
            if stopped.is_set():
                break

            engine.say(sentence)
            engine.runAndWait()

            if stopped.is_set():
                break

            with lock:
                current += 1

        with lock:
            state = "stopped" if stopped.is_set() else "finished"

    except Exception as e:
        print("Speech error:", e)

        with lock:
            state = "stopped" if stopped.is_set() else "error"

    finally:
        if engine is not None:
            try:
                engine.stop()
            except Exception:
                pass

        with engine_lock:
            if player is engine:
                player = None


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

    with lock:
        if playback_thread is not None and playback_thread.is_alive():
            return jsonify(
                error="Stop the current audiobook and wait for playback to stop before uploading another PDF."
            ), 409

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
            count=len(new_sentences)
        )

    except Exception as e:
        return jsonify(error=f"Could not read PDF: {e}"), 400


@app.route("/start", methods=["POST"])
def start():
    global current, state, playback_thread

    with lock:
        if not sentences:
            return jsonify(error="Please upload a PDF first."), 400

        if playback_thread is not None and playback_thread.is_alive():
            if state == "playing":
                return jsonify(
                    message="Audiobook is already playing."
                )

            return jsonify(
                error="Playback is still stopping. Please try again shortly."
            ), 409

        stopped.clear()
        current = 0
        state = "playing"

        playback_thread = threading.Thread(
            target=read_pdf,
            daemon=True
        )
        playback_thread.start()

    return jsonify(message="Audiobook started!")


@app.route("/stop", methods=["POST"])
def stop():
    global state

    stop_speech()

    with lock:
        if state not in ("finished", "error"):
            state = "stopped"

    return jsonify(message="Playback stopped.")


@app.route("/status")
def status():
    with lock:
        return jsonify(
            state=state,
            current=min(current + 1, len(sentences)) if sentences else 0,
            total=len(sentences)
        )


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
