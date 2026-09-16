
import os
import re

dest = "public/audio/letters"
with open("src/data/letters.ts", "r", encoding="utf-8") as f:
    content = f.read()

raw_ids = re.findall(r"id:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]", content)
letter_ids = [bytes(rid, "utf-8").decode("unicode_escape") if "\\u" in rid else rid for rid in raw_ids]

for lid in letter_ids:
    fatha_file = os.path.join(dest, f"{lid}_fatha.mp3")
    kasra_file = os.path.join(dest, f"{lid}_kasra.mp3")
    dhamma_file = os.path.join(dest, f"{lid}_dhamma.mp3")
    
    if os.path.exists(fatha_file) and os.path.exists(kasra_file) and os.path.exists(dhamma_file):
        temp_f = os.path.join(dest, f"{lid}_temp_f.mp3")
        temp_k = os.path.join(dest, f"{lid}_temp_k.mp3")
        temp_d = os.path.join(dest, f"{lid}_temp_d.mp3")
        
        os.rename(fatha_file, temp_f)
        os.rename(kasra_file, temp_k)
        os.rename(dhamma_file, temp_d)
        
        # Map current holders to their correct target vowels based on your diagram
        os.rename(temp_k, fatha_file)  # Fatha gets Fatha sound
        os.rename(temp_d, kasra_file)  # Kasra gets Kasra sound
        os.rename(temp_f, dhamma_file) # Dhamma gets Dhamma sound

print("Exact vowel rotation applied successfully!")

