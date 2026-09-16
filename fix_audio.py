
import os
import re
import glob

dest = "public/audio/letters"
with open("src/data/letters.ts", "r", encoding="utf-8") as f:
    content = f.read()

raw_ids = re.findall(r"id:\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]", content)
letter_ids = [bytes(rid, "utf-8").decode("unicode_escape") if "\\u" in rid else rid for rid in raw_ids]

# Correct alphabetical mapping order matching disk sorting
vowel_map = ["dhamma", "fatha", "kasra", "long_alif", "long_waw", "long_ya"]

files = sorted(glob.glob(os.path.join(dest, "*.mp3")))
print(f"Found {len(files)} audio files and {len(letter_ids)} letters.")

temp_files = []
for i, filepath in enumerate(files):
    temp_name = os.path.join(dest, f"temp_{i}.mp3")
    os.rename(filepath, temp_name)
    temp_files.append(temp_name)

index = 0
for lid in letter_ids:
    for v in vowel_map:
        if index < len(temp_files):
            new_name = os.path.join(dest, f"{lid}_{v}.mp3")
            os.rename(temp_files[index], new_name)
            index += 1

print("Vowel mapping corrected successfully!")

