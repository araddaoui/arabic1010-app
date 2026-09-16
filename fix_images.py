
import os
import re

letters_ts_path = "src/data/letters.ts"
public_dir = "public"

if not os.path.exists(letters_ts_path):
    print(f"ERROR: Could not find {letters_ts_path}")
    exit(1)

with open(letters_ts_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find all image references in letters.ts
# Matches properties like image: "...", icon: "...", or similar path strings
image_matches = re.findall(r"(?:image|icon|photo):\s*[\x27\x22]([^\x27\x22]+)[\x27\x22]", content)
print(f"Found {len(image_matches)} image references in letters.ts.")

missing_count = 0
for img_path in set(image_matches):
    # Clean leading slash for local disk check
    clean_path = img_path.lstrip("/")
    full_disk_path = os.path.join(public_dir, clean_path)
    
    if os.path.exists(full_disk_path):
        print(f"[OK] Found: {img_path}")
    else:
        print(f"[MISSING] File not found on disk: {full_disk_path}")
        missing_count += 1

print(f"\nAudit complete. {missing_count} missing image assets detected.")

