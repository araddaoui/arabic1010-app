import type { Country } from '@/types';

export const countries: Country[] = [
  { id: 'morocco',      nameEnglish: 'Morocco',       nameArabic: 'المَغْرِب',                          audioFile: 'morocco.mp3',    fact: 'Known for its Berber, Arab, and European influences spanning centuries.',                    region: 'North Africa',   flag: '🇲🇦', cx: 198,  cy: 290, r: 50 },
  { id: 'algeria',      nameEnglish: 'Algeria',       nameArabic: 'الجَزَائِر',                         audioFile: 'algeria.mp3',    fact: 'The largest country in Africa by area, with vast Sahara desert.',                            region: 'North Africa',   flag: '🇩🇿', cx: 420,  cy: 240, r: 60 },
  { id: 'tunisia',      nameEnglish: 'Tunisia',       nameArabic: 'تُونِس',                             audioFile: 'tunisia.mp3',    fact: 'Site of the ancient city of Carthage and the start of the Arab Spring.',                     region: 'North Africa',   flag: '🇹🇳', cx: 540,  cy: 200, r: 32 },
  { id: 'libya',        nameEnglish: 'Libya',         nameArabic: 'لِيبِيَا',                           audioFile: 'libya.mp3',      fact: 'Has the largest proven oil reserves in Africa and vast desert landscapes.',                   region: 'North Africa',   flag: '🇱🇾', cx: 700,  cy: 335, r: 60 },
  { id: 'egypt',        nameEnglish: 'Egypt',         nameArabic: 'مِصْر',                              audioFile: 'egypt.mp3',      fact: 'Home to the ancient pyramids, the Nile River, and a 7000-year civilization.',                 region: 'North Africa',   flag: '🇪🇬', cx: 860,  cy: 300, r: 50 },
  { id: 'sudan',        nameEnglish: 'Sudan',         nameArabic: 'السُّودَان',                         audioFile: 'sudan.mp3',      fact: 'Where the Blue Nile and White Nile converge at Khartoum.',                                    region: 'North Africa',   flag: '🇸🇩', cx: 880,  cy: 520, r: 55 },
  { id: 'mauritania',   nameEnglish: 'Mauritania',    nameArabic: 'مُورِيتَانِيَا',                     audioFile: 'mauritania.mp3', fact: 'One of the last countries to abolish slavery by law, in 1981; the Sahara covers most of its land.', region: 'North Africa', flag: '🇲🇷', cx: 160,  cy: 430, r: 45 },
  { id: 'syria',        nameEnglish: 'Syria',         nameArabic: 'سُورِيَا',                           audioFile: 'syria.mp3',      fact: 'Home to Damascus, one of the oldest continuously inhabited cities in the world.',             region: 'Levant',         flag: '🇸🇾', cx: 1000, cy: 145, r: 36 },
  { id: 'lebanon',      nameEnglish: 'Lebanon',       nameArabic: 'لُبْنَان',                           audioFile: 'lebanon.mp3',    fact: 'Known for its mountains, Mediterranean coast, and ancient Phoenician heritage.',              region: 'Levant',         flag: '🇱🇧', cx: 975, cy: 170, r: 22 },
  { id: 'palestine',    nameEnglish: 'Palestine',     nameArabic: 'فِلَسْطِين التَّارِيخِيَّة',        audioFile: 'palestine.mp3',  fact: 'A land of deep historical and religious significance to three faiths.',                       region: 'Levant',         flag: '🇵🇸', cx: 965, cy: 220, r: 20 },
  { id: 'jordan',       nameEnglish: 'Jordan',        nameArabic: 'الأُرْدُنّ',                         audioFile: 'jordan.mp3',     fact: 'Home to the ancient Nabatean city of Petra, a wonder of the world.',                          region: 'Levant',         flag: '🇯🇴', cx: 1000, cy: 275, r: 32 },
  { id: 'iraq',         nameEnglish: 'Iraq',          nameArabic: 'العِرَاق',                           audioFile: 'iraq.mp3',       fact: 'The land of ancient Mesopotamia — the cradle of civilization (Sumer, Babylon).',              region: 'Other',          flag: '🇮🇶', cx: 1135, cy: 185, r: 42 },
  { id: 'saudi_arabia', nameEnglish: 'Saudi Arabia',  nameArabic: 'المَمْلَكَة العَرَبِيَّة السُّعُودِيَّة', audioFile: 'saudi_arabia.mp3', fact: 'The birthplace of Islam and the largest country in the Arabian Peninsula.', region: 'Gulf', flag: '🇸🇦', cx: 1150, cy: 365, r: 70 },
  { id: 'yemen',        nameEnglish: 'Yemen',         nameArabic: 'اليَمَن',                            audioFile: 'yemen.mp3',      fact: 'Known for its unique architecture, ancient history, and distinctive cuisine.',                region: 'Other',          flag: '🇾🇪', cx: 1210, cy: 525, r: 45 },
  { id: 'oman',         nameEnglish: 'Oman',          nameArabic: 'عُمَان',                             audioFile: 'oman.mp3',       fact: 'Has a 1,700 km coastline on the Arabian Sea and a rich maritime history.',                     region: 'Gulf',           flag: '🇴🇲', cx: 1320, cy: 450, r: 42 },
  { id: 'uae',          nameEnglish: 'UAE',           nameArabic: 'الإِمَارَات العَرَبِيَّة المُتَّحِدَة', audioFile: 'uae.mp3',   fact: 'A federation of seven emirates on the Arabian Gulf, including Dubai and Abu Dhabi.',    region: 'Gulf',           flag: '🇦🇪', cx: 1280, cy: 425, r: 30 },
  { id: 'qatar',        nameEnglish: 'Qatar',         nameArabic: 'قَطَر',                              audioFile: 'qatar.mp3',      fact: "A small peninsula in the Persian Gulf with the world's highest GDP per capita.",             region: 'Gulf',           flag: '🇶🇦', cx: 1245, cy: 360, r: 22 },
  { id: 'bahrain',      nameEnglish: 'Bahrain',       nameArabic: 'البَحْرَيْن',                        audioFile: 'bahrain.mp3',    fact: 'An island nation in the Persian Gulf, connected to Saudi Arabia by a causeway.',               region: 'Gulf',           flag: '🇧🇭', cx: 1240, cy: 345, r: 16 },
  { id: 'kuwait',       nameEnglish: 'Kuwait',        nameArabic: 'الكُوَيْت',                          audioFile: 'kuwait.mp3',     fact: 'A small but wealthy Gulf oil state at the head of the Persian Gulf.',                          region: 'Gulf',           flag: '🇰🇼', cx: 1165, cy: 305, r: 20 },
  { id: 'djibouti',     nameEnglish: 'Djibouti',      nameArabic: 'جِيبُوتِي',                          audioFile: 'djibouti.mp3',   fact: 'Located at the strategic Bab el-Mandeb strait, a key global shipping route.',                  region: 'Horn of Africa', flag: '🇩🇯', cx: 1075, cy: 615, r: 18 },
  { id: 'somalia',      nameEnglish: 'Somalia',       nameArabic: 'الصُّومَال',                         audioFile: 'somalia.mp3',    fact: 'Has the longest coastline in mainland Africa, along the Indian Ocean.',                        region: 'Horn of Africa', flag: '🇸🇴', cx: 1210, cy: 660, r: 45 },
  { id: 'comoros',      nameEnglish: 'Comoros',       nameArabic: 'جُزُر القَمَر',                      audioFile: 'comoros.mp3',    fact: 'A volcanic island nation off east Africa, known as the "Perfume Islands" for its ylang-ylang.', region: 'Horn of Africa', flag: '🇰🇲', cx: 1380, cy: 690, r: 16 },
];

// Fix 3: saudi_arabia (underscore, matches store + audio convention)
export const freeCountryIds = ['egypt', 'morocco', 'lebanon', 'saudi_arabia', 'tunisia'];

export const regions = [
  { name: 'North Africa',   countries: ['algeria', 'egypt', 'libya', 'mauritania', 'morocco', 'sudan', 'tunisia'] },
  { name: 'Levant',         countries: ['jordan', 'lebanon', 'palestine', 'syria'] },
  { name: 'Gulf',           countries: ['bahrain', 'kuwait', 'oman', 'qatar', 'saudi_arabia', 'uae'] },
  { name: 'Horn of Africa', countries: ['comoros', 'djibouti', 'somalia'] },
  { name: 'Other',          countries: ['iraq', 'yemen'] },
];

export const mapConfig = {
  viewBox: '0 0 1408 768',
};
