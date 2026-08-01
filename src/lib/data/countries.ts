import type { Country } from '@/types';

export const countries: Country[] = [
  { id: 'morocco',      nameEnglish: 'Morocco',       nameArabic: 'المَغْرِب',                          audioFile: 'morocco.mp3',    fact: 'Known for its Berber, Arab, and European influences spanning centuries.',                    region: 'North Africa',   cx: 198,  cy: 290, r: 50 },
  { id: 'algeria',      nameEnglish: 'Algeria',       nameArabic: 'الجَزَائِر',                         audioFile: 'algeria.mp3',    fact: 'The largest country in Africa by area, with vast Sahara desert.',                            region: 'North Africa',   cx: 420,  cy: 240, r: 60 },
  { id: 'tunisia',      nameEnglish: 'Tunisia',       nameArabic: 'تُونِس',                             audioFile: 'tunisia.mp3',    fact: 'Site of the ancient city of Carthage and the start of the Arab Spring.',                     region: 'North Africa',   cx: 540,  cy: 200, r: 32 },
  { id: 'libya',        nameEnglish: 'Libya',         nameArabic: 'لِيبِيَا',                           audioFile: 'libya.mp3',      fact: 'Has the largest proven oil reserves in Africa and vast desert landscapes.',                   region: 'North Africa',   cx: 700,  cy: 255, r: 60 },
  { id: 'egypt',        nameEnglish: 'Egypt',         nameArabic: 'مِصْر',                              audioFile: 'egypt.mp3',      fact: 'Home to the ancient pyramids, the Nile River, and a 7000-year civilization.',                 region: 'North Africa',   cx: 870,  cy: 230, r: 50 },
  { id: 'sudan',        nameEnglish: 'Sudan',         nameArabic: 'السُّودَان',                         audioFile: 'sudan.mp3',      fact: 'Where the Blue Nile and White Nile converge at Khartoum.',                                    region: 'North Africa',   cx: 880,  cy: 420, r: 55 },
  { id: 'mauritania',   nameEnglish: 'Mauritania',    nameArabic: 'مُورِيتَانِيَا',                     audioFile: 'mauritania.mp3', fact: 'One of the last countries to abolish slavery by law, in 1981; the Sahara covers most of its land.', region: 'North Africa', cx: 160,  cy: 430, r: 45 },
  { id: 'syria',        nameEnglish: 'Syria',         nameArabic: 'سُورِيَا',                           audioFile: 'syria.mp3',      fact: 'Home to Damascus, one of the oldest continuously inhabited cities in the world.',             region: 'Levant',         cx: 1000, cy: 145, r: 36 },
  { id: 'lebanon',      nameEnglish: 'Lebanon',       nameArabic: 'لُبْنَان',                           audioFile: 'lebanon.mp3',    fact: 'Known for its mountains, Mediterranean coast, and ancient Phoenician heritage.',              region: 'Levant',         cx: 1020, cy: 175, r: 22 },
  { id: 'palestine',    nameEnglish: 'Palestine',     nameArabic: 'فِلَسْطِين التَّارِيخِيَّة',        audioFile: 'palestine.mp3',  fact: 'A land of deep historical and religious significance to three faiths.',                       region: 'Levant',         cx: 1020, cy: 205, r: 20 },
  { id: 'jordan',       nameEnglish: 'Jordan',        nameArabic: 'الأُرْدُنّ',                         audioFile: 'jordan.mp3',     fact: 'Home to the ancient Nabatean city of Petra, a wonder of the world.',                          region: 'Levant',         cx: 1060, cy: 260, r: 32 },
  { id: 'iraq',         nameEnglish: 'Iraq',          nameArabic: 'العِرَاق',                           audioFile: 'iraq.mp3',       fact: 'The land of ancient Mesopotamia — the cradle of civilization (Sumer, Babylon).',              region: 'Other',          cx: 1135, cy: 185, r: 42 },
  { id: 'saudi_arabia', nameEnglish: 'Saudi Arabia',  nameArabic: 'المَمْلَكَة العَرَبِيَّة السُّعُودِيَّة', audioFile: 'saudi_arabia.mp3', fact: 'The birthplace of Islam and the largest country in the Arabian Peninsula.', region: 'Gulf', cx: 1220, cy: 365, r: 70 },
  { id: 'yemen',        nameEnglish: 'Yemen',         nameArabic: 'اليَمَن',                            audioFile: 'yemen.mp3',      fact: 'Known for its unique architecture, ancient history, and distinctive cuisine.',                region: 'Other',          cx: 1320, cy: 520, r: 45 },
  { id: 'oman',         nameEnglish: 'Oman',          nameArabic: 'عُمَان',                             audioFile: 'oman.mp3',       fact: 'Has a 1,700 km coastline on the Arabian Sea and a rich maritime history.',                     region: 'Gulf',           cx: 1380, cy: 390, r: 42 },
  { id: 'uae',          nameEnglish: 'UAE',           nameArabic: 'الإِمَارَات العَرَبِيَّة المُتَّحِدَة', audioFile: 'uae.mp3',   fact: 'A federation of seven emirates on the Arabian Gulf, including Dubai and Abu Dhabi.',    region: 'Gulf',           cx: 1280, cy: 425, r: 30 },
  { id: 'qatar',        nameEnglish: 'Qatar',         nameArabic: 'قَطَر',                              audioFile: 'qatar.mp3',      fact: "A small peninsula in the Persian Gulf with the world's highest GDP per capita.",             region: 'Gulf',           cx: 1215, cy: 395, r: 22 },
  { id: 'bahrain',      nameEnglish: 'Bahrain',       nameArabic: 'البَحْرَيْن',                        audioFile: 'bahrain.mp3',    fact: 'An island nation in the Persian Gulf, connected to Saudi Arabia by a causeway.',               region: 'Gulf',           cx: 1195, cy: 382, r: 16 },
  { id: 'kuwait',       nameEnglish: 'Kuwait',        nameArabic: 'الكُوَيْت',                          audioFile: 'kuwait.mp3',     fact: 'A small but wealthy Gulf oil state at the head of the Persian Gulf.',                          region: 'Gulf',           cx: 1165, cy: 305, r: 20 },
  { id: 'djibouti',     nameEnglish: 'Djibouti',      nameArabic: 'جِيبُوتِي',                          audioFile: 'djibouti.mp3',   fact: 'Located at the strategic Bab el-Mandeb strait, a key global shipping route.',                  region: 'Horn of Africa', cx: 1060, cy: 505, r: 18 },
  { id: 'somalia',      nameEnglish: 'Somalia',       nameArabic: 'الصُّومَال',                         audioFile: 'somalia.mp3',    fact: 'Has the longest coastline in mainland Africa, along the Indian Ocean.',                        region: 'Horn of Africa', cx: 1130, cy: 580, r: 45 },
  { id: 'comoros',      nameEnglish: 'Comoros',       nameArabic: 'جُزُر القَمَر',                      audioFile: 'comoros.mp3',    fact: 'A volcanic island nation off east Africa, known as the "Perfume Islands" for its ylang-ylang.', region: 'Horn of Africa', cx: 1170, cy: 690, r: 16 },
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
