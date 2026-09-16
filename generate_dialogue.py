import asyncio
import os
import edge_tts

VOICE_MALE = "ar-SA-HamedNeural"
VOICE_FEMALE = "ar-EG-SalmaNeural"

output_dir = os.path.join("public", "audio", "dialogue")
os.makedirs(output_dir, exist_ok=True)

dialogue_lines = [
    ("dialogue1A", VOICE_MALE, "السَّلاَمُ عَلَيْكُمْ!"),
    ("dialogue1B", VOICE_FEMALE, "وَعَلَيْكُمُ السَّلاَمُ!"),
    ("dialogue2A", VOICE_MALE, "أَهْلاً وَسَهْلاً، أَنَا حَسَنَيْن."),
    ("dialogue2B", VOICE_FEMALE, "تَشَرَّفْنَا، اسْمِي كْلاَوْدِيَا."),
    ("dialogue3A", VOICE_MALE, "شُو أَخْبَارِك؟"),
    ("dialogue3B", VOICE_FEMALE, "اسْمِي كْلاَوْدِيَا، وَأَنْتَ شُو اسْمَك؟"),
    ("dialogue4A", VOICE_MALE, "أَنَا مِنْ مِصْر."),
    ("dialogue4B", VOICE_FEMALE, "إِنْتِي مِنْ وَيْن يَا كْلاَوْدِيَا؟"),
    ("dialogue5A", VOICE_MALE, "وَيْن سَاكِنَة يَا كْلاَوْدِيَا؟"),
    ("dialogue5B", VOICE_FEMALE, "شُو بِتِشْرَبِي؟"),
    ("dialogue6A", VOICE_MALE, "تَفَضَّلِي."),
    ("dialogue6B", VOICE_FEMALE, "شُكْراً يَا حَسَنَيْن."),
    ("dialogue7A", VOICE_MALE, "تَشَرَّفْنَا حَسَنَيْن."),
    ("dialogue7B", VOICE_FEMALE, "إِلَى اللِّقَاء."),
]

async def generate():
    for file_id, voice, text in dialogue_lines:
        out_path = os.path.join(output_dir, f"{file_id}.mp3")
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(out_path)
        print(f"Generated: {out_path} [{voice}]")

if __name__ == "__main__":
    asyncio.run(generate())
