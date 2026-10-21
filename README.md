# PDF Audiobook

PDF Audiobook is a Python-based web application that converts text from PDF documents into speech. Users can upload a PDF, start listening to its contents, and stop playback whenever needed.

The project uses Flask for the web interface and `pyttsx3` for text-to-speech conversion.

## Features

- **PDF Upload:** Upload PDF documents through a simple web interface.
- **Text Extraction:** Extract readable text from PDF files using PyPDF2.
- **Text-to-Speech:** Convert extracted text into spoken audio using `pyttsx3`.
- **Playback Controls:** Start and stop audiobook playback.
- **Progress Tracking:** Display the current playback status.
- **Web Interface:** Access the application through a browser.

## Technologies Used

- **Python** — Core application logic
- **Flask** — Web framework
- **PyPDF2** — PDF text extraction
- **pyttsx3** — Text-to-speech conversion
- **HTML** — Web page structure
- **CSS** — User interface styling
- **JavaScript** — Frontend interactions
- **Gunicorn** — WSGI server for deployment

## Project Structure

```text
PDF-Audiobook/
├── app.py
├── requirements.txt
├── Procfile
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd PDF-Audiobook
```

Replace `<your-repository-url>` with your GitHub repository URL.

### 2. Create a Virtual Environment

```bash
python -m venv venv
```

Activate the environment.

**Windows:**

```bash
venv\Scripts\activate
```

**macOS/Linux:**

```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the Application

```bash
python app.py
```

Open the local URL displayed in the terminal, usually:

```text
http://127.0.0.1:5000
```

## How to Use

1. Open the PDF Audiobook website.
2. Select a PDF document.
3. Upload the document.
4. Click **Start Listening** to begin text-to-speech playback.
5. Use the **Exit** control to stop playback.

## How It Works

1. The user uploads a PDF through the web interface.
2. Flask receives the uploaded document.
3. PyPDF2 extracts readable text from the PDF.
4. The extracted text is passed to `pyttsx3`.
5. The speech engine converts the text into spoken audio.
6. The application provides controls for managing playback.

## Limitations

- Scanned PDFs may not work because they require Optical Character Recognition (OCR).
- Text extraction quality depends on the PDF's structure and formatting.
- Speech quality and available voices depend on the installed speech engine and operating system.
- The original `pyttsx3` implementation relies on a compatible speech engine being available in the environment where it runs.


