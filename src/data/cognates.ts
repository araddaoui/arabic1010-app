export type Cognate = {
  id: string;
  ar: string;
  en: string;
  translit: string;
  category: string;
  trail: string[];
  note: string;
  emoji: string;
};

export const CATEGORIES = [
  "Food",
  "Animal",
  "Math",
  "Material",
  "Object",
  "Culture",
  "Nature",
  "Music",
  "Title",
  "Trade",
  "Travel",
  "Game",
  "Science",
  "History",
] as const;

export const COGNATES: Cognate[] = [
  { id: "sugar", ar: "سُكَّر", en: "sugar", translit: "sukkar", category: "Food", trail: ["سُكَّر sukkar", "Spanish azúcar", "sugar"], note: "Arabic traders carried both the crop and the word across the Mediterranean.", emoji: "🍬" },
  { id: "giraffe", ar: "زَرَافَة", en: "giraffe", translit: "zarāfa", category: "Animal", trail: ["زَرَافَة zarāfa", "Italian giraffa", "giraffe"], note: "Named from the Arabic term used by North African traders.", emoji: "🦒" },
  { id: "cipher", ar: "صِفْر", en: "cipher / zero", translit: "ṣifr", category: "Math", trail: ["صِفْر ṣifr (empty)", "Latin cifra", "zero / cipher"], note: "The concept of zero reached Europe through Arabic mathematics.", emoji: "0️⃣" },
  { id: "lemon", ar: "لَيْمُون", en: "lemon", translit: "laymūn", category: "Food", trail: ["لَيْمُون laymūn", "Spanish limón", "lemon"], note: "Citrus spread west along Arab agricultural routes.", emoji: "🍋" },
  { id: "admiral", ar: "أَمِير البَحْر", en: "admiral", translit: "amīr al-baḥr", category: "Title", trail: ["أَمِير البَحْر amīr al-baḥr (sea commander)", "Old French amiral", "admiral"], note: "Literally 'commander of the sea'.", emoji: "⚓" },
  { id: "cotton", ar: "قُطْن", en: "cotton", translit: "quṭn", category: "Material", trail: ["قُطْن quṭn", "Italian cotone", "cotton"], note: "One of the oldest Arabic loanwords in European textiles.", emoji: "🧵" },
  { id: "sofa", ar: "صُوفَة", en: "sofa", translit: "ṣuffa", category: "Object", trail: ["صُفَّة ṣuffa (stone bench)", "Turkish sofa", "sofa"], note: "A raised bench covered with cushions.", emoji: "🛋️" },
  { id: "monsoon", ar: "مَوْسِم", en: "monsoon", translit: "mawsim", category: "Nature", trail: ["مَوْسِم mawsim (season)", "Portuguese monção", "monsoon"], note: "Sailors used the word for the seasonal sailing winds.", emoji: "🌧️" },
  { id: "coffee", ar: "قَهْوَة", en: "coffee", translit: "qahwa", category: "Food", trail: ["قَهْوَة qahwa", "Turkish kahve", "coffee"], note: "From Yemen's highlands to Ottoman cafés to the world.", emoji: "☕" },
  { id: "algebra", ar: "جَبْر", en: "algebra", translit: "jabr", category: "Math", trail: ["الجَبْر al-jabr (restoring)", "Latin algebra", "algebra"], note: "From Al-Khwārizmī's 9th-century treatise.", emoji: "➗" },
  { id: "ghoul", ar: "غُول", en: "ghoul", translit: "ghūl", category: "Culture", trail: ["غُول ghūl (desert spirit)", "1001 Nights translations", "ghoul"], note: "Entered English through translations of Arabic folklore.", emoji: "👻" },
  { id: "lute", ar: "العُود", en: "lute", translit: "al-ʿūd", category: "Music", trail: ["العُود al-ʿūd (the wood)", "Spanish laúd", "lute"], note: "The Arabic definite article al- fused into the word.", emoji: "🪕" },
  { id: "apricot", ar: "بِرْقُوق", en: "apricot", translit: "barqūq", category: "Food", trail: ["البَرْقُوق al-barqūq", "Spanish albaricoque", "apricot"], note: "Another word that kept its Arabic article.", emoji: "🍑" },
  { id: "gazelle", ar: "غَزَال", en: "gazelle", translit: "ghazāl", category: "Animal", trail: ["غَزَال ghazāl", "Old French gazelle", "gazelle"], note: "Also the root of ghazal, the love poem.", emoji: "🦌" },
  { id: "amber", ar: "عَنْبَر", en: "amber", translit: "ʿanbar", category: "Material", trail: ["عَنْبَر ʿanbar (ambergris)", "Latin ambar", "amber"], note: "Originally the perfume substance, later the resin.", emoji: "🟠" },
  { id: "tariff", ar: "تَعْرِفَة", en: "tariff", translit: "taʿrifa", category: "Trade", trail: ["تَعْرِفَة taʿrifa (notification)", "Italian tariffa", "tariff"], note: "A posted notice of customs rates.", emoji: "🧾" },
  { id: "jar", ar: "جَرَّة", en: "jar", translit: "jarra", category: "Object", trail: ["جَرَّة jarra (earthen vessel)", "Spanish jarra", "jar"], note: "A clay vessel for water or oil.", emoji: "🏺" },
  { id: "carafe", ar: "غَرْفَة", en: "carafe", translit: "gharfa", category: "Object", trail: ["غَرَفَ gharafa (to scoop)", "Italian caraffa", "carafe"], note: "From the verb meaning 'to scoop water'.", emoji: "🫗" },
  { id: "henna", ar: "حَنَّة", en: "henna", translit: "ḥinnāʾ", category: "Culture", trail: ["حِنَّاء ḥinnāʾ", "(unchanged)", "henna"], note: "Borrowed with almost no change in sound.", emoji: "🌿" },
  { id: "syrup", ar: "شَراب", en: "syrup", translit: "sharāb", category: "Food", trail: ["شَراب sharāb (drink)", "Latin sirupus", "syrup"], note: "Also gives us sherbet and sorbet.", emoji: "🍯" },
  { id: "safari", ar: "سَفَر", en: "safari", translit: "safar", category: "Travel", trail: ["سَفَر safar (journey)", "Swahili safari", "safari"], note: "Travelled to English via the Swahili coast.", emoji: "🧭" },
  { id: "checkmate", ar: "شاه مات", en: "checkmate", translit: "shāh māt", category: "Game", trail: ["شاه مات shāh māt (the king is helpless)", "Old French eschec mat", "checkmate"], note: "A Persian-Arabic phrase carried by the game of chess.", emoji: "♟️" },
  { id: "tuna", ar: "تون", en: "tuna", translit: "tūn", category: "Food", trail: ["تُون tūn", "Spanish atún", "tuna"], note: "Mediterranean fishing vocabulary.", emoji: "🐟" },
  { id: "loofah", ar: "لوفة", en: "loofah", translit: "līfa", category: "Nature", trail: ["لِيفَة līfa (plant fibres)", "Latin luffa", "loofah"], note: "The dried gourd used as a sponge.", emoji: "🧽" },
  { id: "elixir", ar: "الإكسير", en: "elixir", translit: "al-iksīr", category: "Science", trail: ["الإكسير al-iksīr (philosopher's stone)", "Medieval Latin elixir", "elixir"], note: "A core term of medieval alchemy.", emoji: "⚗️" },
  { id: "alcohol", ar: "الكُحول", en: "alcohol", translit: "al-kuḥūl", category: "Science", trail: ["الكُحْل al-kuḥl (fine powder)", "Latin alcohol", "alcohol"], note: "Originally the kohl eye powder, then any distilled essence.", emoji: "🧪" },
  { id: "magazine", ar: "مَخزَن", en: "magazine", translit: "makhzan", category: "Object", trail: ["مَخزَن makhzan (storehouse)", "Italian magazzino", "magazine"], note: "A storehouse of goods → a storehouse of articles.", emoji: "📰" },
  { id: "jasmine", ar: "يَاسَمِين", en: "jasmine", translit: "yāsamīn", category: "Nature", trail: ["يَاسَمِين yāsamīn", "French jasmin", "jasmine"], note: "Persian in origin, spread by Arabic gardens.", emoji: "🌼" },
  { id: "assassin", ar: "حَشَّاشِين", en: "assassin", translit: "ḥashshāshīn", category: "History", trail: ["حَشَّاشِين ḥashshāshīn (a medieval sect)", "Italian assassino", "assassin"], note: "One of the most storied etymologies in English.", emoji: "🗡️" },
  { id: "mattress", ar: "مَطرَح", en: "mattress", translit: "maṭraḥ", category: "Object", trail: ["مَطرَح maṭraḥ (place to lay down)", "Italian materasso", "mattress"], note: "Crusaders brought the habit of sleeping on cushions home.", emoji: "🛏️" },
];

/** Free tier: 8 words — one per major category. */
export const FREE_COGNATES = ["sugar", "giraffe", "cipher", "cotton", "sofa", "ghoul", "monsoon", "algebra"];
