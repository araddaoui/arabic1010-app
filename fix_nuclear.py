
import os
import re

dest = "public/audio/letters"
with open("src/data/letters.ts", "r", encoding="utf-8") as f:
    content = f.read()

raw_ids = re.findall(r"id:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]", content)
letter_ids = [bytes(rid, "utf-8").decode("unicode_escape") if "\\u" in rid else rid for rid in raw_ids]

print(f"Processing {len(letter_ids)} letters with nuclear byte-swap...")

for lid in letter_ids:
    f_path = os.path.join(dest, f"{lid}_fatha.mp3")
    k_path = os.path.join(dest, f"{lid}_kasra.mp3")
    d_path = os.path.join(dest, f"{lid}_dhamma.mp3")
    
    if os.path.exists(f_path) and os.path.exists(k_path) and os.path.exists(d_path):
        with open(f_path, "rb") as f: f_bytes = f.read()
        with open(k_path, "rb") as f: k_bytes = f.read()
        with open(d_path, "rb") as f: d_bytes = f.read()
        
        # Write correct mapping
        with open(f_path, "wb") as f: f.write(d_bytes)
        with open(k_path, "wb") as f: f.write(f_bytes)
        with open(d_path, "wb") as f: f.write(k_bytes)

print("Nuclear audio re-mapping completed successfully!")

