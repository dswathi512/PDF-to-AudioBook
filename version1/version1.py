import pyttsx3
import PyPDF2
from tkinter.filedialog import *

# Open the file picker
book = askopenfilename()
pdfreader = PyPDF2.PdfReader(book)

# 1. FIX: Get the total number of pages using len()
pages = len(pdfreader.pages)

# Initialize the text-to-speech player once outside the loop (much faster!)
player = pyttsx3.init()

for num in range(0, pages):
    # 2. FIX: Get the specific page object for the current iteration
    page = pdfreader.pages[num]
    
    # 3. FIX: Use the newer extract_text() method
    text = page.extract_text()
    
    # Speak the text
    player.say(text)
    player.runAndWait()
