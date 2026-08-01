export type Line = {
  id: string;        // audio key: dialogue1A
  speaker: "A" | "B";
  name: string;
  ar: string;
  en: string;
  translit: string;
  note?: string;
};

export type Dialogue = {
  id: string;
  title: string;
  subtitle: string;
  cast: { A: string; B: string };
  lines: Line[];
};

export const DIALOGUES: Dialogue[] = [
  {
    id: "stage1",
    title: "Stage 1 — First Meeting",
    subtitle: "Hassanein meets Claudia at a university café",
    cast: { A: "Hassanein", B: "Claudia" },
    lines: [
      { id: "dialogue1A", speaker: "A", name: "Hassanein", ar: "السَّلَامُ عَلَيْكُم!", en: "Peace be upon you!", translit: "as-salāmu ʿalaykum", note: "The universal greeting across the Arab world." },
      { id: "dialogue1B", speaker: "B", name: "Claudia", ar: "وَعَلَيْكُمُ السَّلَام!", en: "And upon you peace!", translit: "wa ʿalaykumu s-salām" },
      { id: "dialogue2A", speaker: "A", name: "Hassanein", ar: "أَهْلاً وَسَهْلاً، أَنَا حَسَنَين.", en: "Welcome, I am Hassanein.", translit: "ahlan wa sahlan, anā Ḥasanayn" },
      { id: "dialogue2B", speaker: "B", name: "Claudia", ar: "تَشَرَّفْنَا، اِسْمِي كْلُودْيَا.", en: "Pleased to meet you, my name is Claudia.", translit: "tasharrafnā, ismī Klūdyā" },
      { id: "dialogue3A", speaker: "A", name: "Hassanein", ar: "شُو أَخْبَارِك؟", en: "How are things with you?", translit: "shū akhbārik", note: "شُو is a Levantine form of 'what' (MSA: ما / ماذا)." },
      { id: "dialogue3B", speaker: "B", name: "Claudia", ar: "بِخَيْر، الحَمْدُ لِله. وَأَنْتَ؟", en: "Fine, thank God. And you?", translit: "bi-khayr, al-ḥamdu lillāh. wa anta?" },
      { id: "dialogue4A", speaker: "A", name: "Hassanein", ar: "بِخَيْر أَيْضاً. مِنْ وَين إِنْتِ؟", en: "Fine too. Where are you from?", translit: "bi-khayr ayḍan. min wayn inti?", note: "وين is Levantine for 'where' (MSA: أين)." },
      { id: "dialogue4B", speaker: "B", name: "Claudia", ar: "أَنَا مِنْ أَمْرِيكَا، مِنْ شِيكَاغُو.", en: "I am from America, from Chicago.", translit: "anā min Amrīkā, min Shīkāghū" },
      { id: "dialogue5A", speaker: "A", name: "Hassanein", ar: "أَنَا مِنْ لُبْنَان، مِنْ بَيْرُوت.", en: "I am from Lebanon, from Beirut.", translit: "anā min Lubnān, min Bayrūt" },
      { id: "dialogue5B", speaker: "B", name: "Claudia", ar: "جَمِيل! كَمْ عُمْرُك؟", en: "Lovely! How old are you?", translit: "jamīl! kam ʿumruk?" },
      { id: "dialogue6A", speaker: "A", name: "Hassanein", ar: "عُمْرِي عِشْرُونَ سَنَة.", en: "I am twenty years old.", translit: "ʿumrī ʿishrūna sana" },
      { id: "dialogue6B", speaker: "B", name: "Claudia", ar: "وَأَنَا عُمْرِي تِسْعَةَ عَشَرَ سَنَة.", en: "And I am nineteen years old.", translit: "wa anā ʿumrī tisʿata ʿashara sana" },
      { id: "dialogue7A", speaker: "A", name: "Hassanein", ar: "تَشْرَبِينَ شَاي أَم قَهْوَة؟", en: "Would you like tea or coffee?", translit: "tashrabīna shāy am qahwa?" },
      { id: "dialogue7B", speaker: "B", name: "Claudia", ar: "قَهْوَة، مِنْ فَضْلِك. شُكْراً!", en: "Coffee, please. Thank you!", translit: "qahwa, min faḍlik. shukran!" },
    ],
  },
  {
    id: "stage2",
    title: "Stage 2 — In the Classroom",
    subtitle: "Yasser and Claudia before the Arabic lesson",
    cast: { A: "Yasser", B: "Claudia" },
    lines: [
      { id: "dialogue8A", speaker: "A", name: "Yasser", ar: "صَبَاحُ الخَيْر يَا كْلُودْيَا.", en: "Good morning, Claudia.", translit: "ṣabāḥu l-khayr yā Klūdyā" },
      { id: "dialogue8B", speaker: "B", name: "Claudia", ar: "صَبَاحُ النُّور يَا يَاسِر.", en: "Morning of light, Yasser.", translit: "ṣabāḥu n-nūr yā Yāsir", note: "The traditional reply — literally 'morning of light'." },
      { id: "dialogue9A", speaker: "A", name: "Yasser", ar: "هَل عِنْدَكِ كِتَاب وَقَلَم؟", en: "Do you have a book and a pen?", translit: "hal ʿindaki kitāb wa qalam?" },
      { id: "dialogue9B", speaker: "B", name: "Claudia", ar: "نَعَم، عِنْدِي كِتَاب وَدَفْتَر.", en: "Yes, I have a book and a notebook.", translit: "naʿam, ʿindī kitāb wa daftar" },
      { id: "dialogue10A", speaker: "A", name: "Yasser", ar: "الدَّرْسُ اليَوْمَ عَنِ الأَرْقَام.", en: "Today's lesson is about numbers.", translit: "ad-darsu l-yawma ʿani l-arqām" },
      { id: "dialogue10B", speaker: "B", name: "Claudia", ar: "أُحِبُّ الأَرْقَام! هِيَ سَهْلَة.", en: "I love numbers! They are easy.", translit: "uḥibbu l-arqām! hiya sahla" },
    ],
  },
];

export const EXPRESSIONS: { group: string; items: { ar: string; en: string }[] }[] = [
  { group: "Greetings", items: [{ ar: "السَّلَامُ عَلَيْكُم", en: "Peace be upon you" }, { ar: "أَهْلاً", en: "Welcome / hi" }, { ar: "تَشَرَّفْنَا", en: "Pleased to meet you" }] },
  { group: "Personal info", items: [{ ar: "اِسْمِي", en: "My name is" }, { ar: "مِنْ وَين", en: "Where from" }, { ar: "كَمْ عُمْرُك", en: "How old are you" }] },
  { group: "Countries", items: [{ ar: "لُبْنَان", en: "Lebanon" }, { ar: "مِصْر", en: "Egypt" }, { ar: "سُورِيَا", en: "Syria" }, { ar: "أَمْرِيكَا", en: "America" }] },
  { group: "Beverages", items: [{ ar: "شَاي", en: "tea" }, { ar: "قَهْوَة", en: "coffee" }] },
  { group: "Farewells", items: [{ ar: "مَعَ السَّلَامَة", en: "Goodbye" }, { ar: "إِلَى اللِّقَاء", en: "Until we meet" }] },
];

export const FREE_LINES = 4;
