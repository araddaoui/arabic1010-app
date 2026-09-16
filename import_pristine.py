
import os
import re
import shutil

desktop_pristine = r"C:\Users\hp\Desktop\pristine_audio"
dest = "public/audio/letters"
os.makedirs(dest, exist_ok=True)

with open("src/data/letters.ts", "r", encoding="utf-8") as f:
    content = f.read()

raw_ids = re.findall(r"id:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]", content)
letter_ids = [bytes(rid, "utf-8").decode("unicode_escape") if "\\u" in rid else rid for rid in raw_ids]

# Exact mapping from your unzipped Desktop folders to app vowel keys
vowel_mapping = {
    "fatha": "fatha_audio",
    "kasra": "kasra_audio_new",
    "dhamma": "damma_audio",
    "long_alif": "long_fatha_audio",
    "long_waw": "long_damma_audio",
    "long_ya": "long_kasra_audio"
}

print(f"Targeting {len(letter_ids)} letters from letters.ts...")

for vowel_key, folder_name in vowel_mapping.items():
    folder_path = os.path.join(desktop_pristine, folder_name)
    if not os.path.exists(folder_path):
        print(f"ERROR: Could not find folder: {folder_path}")
        exit(1)
        
    files = sorted([f for f in os.listdir(folder_path) if f.endswith(".mp3")])
    print(f"Importing {len(files)} files from {folder_name} for {vowel_key}")
    
    for i, lid in enumerate(letter_ids):
        if i < len(files):
            src = os.path.join(folder_path, files[i])
            dst = os.path.join(dest, f"{lid}_{vowel_key}.mp3")
            shutil.copy2(src, dst)

print("Pristine audio imported and mapped successfully!")

