import type { Country } from '@/types';

export const countries: Country[] = [
  { id: 'morocco',      nameEnglish: 'Morocco',       nameArabic: 'المَغْرِب',                          audioFile: 'morocco.mp3',    fact: 'Known for its Berber, Arab, and European influences spanning centuries.',                    region: 'North Africa',   cx: 198,  cy: 291, r: 18 },
  { id: 'algeria',      nameEnglish: 'Algeria',       nameArabic: 'الجَزَائِر',                         audioFile: 'algeria.mp3',    fact: 'The largest country in Africa by area, with vast Sahara desert.',                            region: 'North Africa',   cx: 400,  cy: 306, r: 18 },
  { id: 'tunisia',      nameEnglish: 'Tunisia',       nameArabic: 'تُونِس',                             audioFile: 'tunisia.mp3',    fact: 'Site of the ancient city of Carthage and the start of the Arab Spring.',                     region: 'North Africa',   cx: 517,  cy: 183, r: 14 },
  { id: 'libya',        nameEnglish: 'Libya',         nameArabic: 'لِيبِيَا',                           audioFile: 'libya.mp3',      fact: 'Has the largest proven oil reserves in Africa and vast desert landscapes.',                   region: 'North Africa',   cx: 660,  cy: 332, r: 18 },
  { id: 'egypt',        nameEnglish: 'Egypt',         nameArabic: 'مِصْر',                              audioFile: 'egypt.mp3',      fact: 'Home to the ancient pyramids, the Nile River, and a 7000-year civilization.',                 region: 'North Africa',   cx: 859,  cy: 342, r: 18 },
  { id: 'sudan',        nameEnglish: 'Sudan',         nameArabic: 'السُّودَان',                         audioFile: 'sudan.mp3',      fact: 'Where the Blue Nile and White Nile converge at Khartoum.',                                    region: 'North Africa',   cx: 865,  cy: 548, r: 18 },
  { id: 'mauritania',   nameEnglish: 'Mauritania',    nameArabic: 'مُورِيتَانِيَا',                     audioFile: 'mauritania.mp3', fact: 'One of the last countries to abolish slavery by law, in 1981; the Sahara covers most of its land.', region: 'North Africa', cx: 177,  cy: 465, r: 18 },
  { id: 'syria',        nameEnglish: 'Syria',         nameArabic: 'سُورِيَا',                           audioFile: 'syria.mp3',      fact: 'Home to Damascus, one of the oldest continuously inhabited cities in the world.',             region: 'Levant',         cx: 1010, cy: 164, r: 14 },
  { id: 'lebanon',      nameEnglish: 'Lebanon',       nameArabic: 'لُبْنَان',                           audioFile: 'lebanon.mp3',    fact: 'Known for its mountains, Mediterranean coast, and ancient Phoenician heritage.',              region: 'Levant',         cx: 964,  cy: 187, r: 12 },
  { id: 'palestine',    nameEnglish: 'Palestine',     nameArabic: 'فِلَسْطِين',        audioFile: 'palestine.mp3',  fact: 'A land of deep historical and religious significance to three faiths.',                       region: 'Levant',         cx: 948,  cy: 239, r: 12 },
  { id: 'jordan',       nameEnglish: 'Jordan',        nameArabic: 'الأُرْدُنّ',                         audioFile: 'jordan.mp3',     fact: 'Home to the ancient Nabatean city of Petra, a wonder of the world.',                          region: 'Levant',         cx: 979,  cy: 247, r: 14 },
  { id: 'iraq',         nameEnglish: 'Iraq',          nameArabic: 'العِرَاق',                           audioFile: 'iraq.mp3',       fact: 'The land of ancient Mesopotamia — the cradle of civilization (Sumer, Babylon).',              region: 'Other',          cx: 1102, cy: 206, r: 18 },
  { id: 'saudi_arabia', nameEnglish: 'Saudi Arabia',  nameArabic: 'المَمْلَكَة العَرَبِيَّة السُّعُودِيَّة', audioFile: 'saudi_arabia.mp3', fact: 'The birthplace of Islam and the largest country in the Arabian Peninsula.', region: 'Gulf', cx: 1115, cy: 392, r: 24 },
  { id: 'yemen',        nameEnglish: 'Yemen',         nameArabic: 'اليَمَن',                            audioFile: 'yemen.mp3',      fact: 'Known for its unique architecture, ancient history, and distinctive cuisine.',                region: 'Other',          cx: 1169, cy: 556, r: 18 },
  { id: 'oman',         nameEnglish: 'Oman',          nameArabic: 'عُمَان',                             audioFile: 'oman.mp3',       fact: 'Has a 1,700 km coastline on the Arabian Sea and a rich maritime history.',                     region: 'Gulf',           cx: 1318, cy: 464, r: 16 },
  { id: 'uae',          nameEnglish: 'UAE',           nameArabic: 'الإِمَارَات العَرَبِيَّة المُتَّحِدَة', audioFile: 'uae.mp3',   fact: 'A federation of seven emirates on the Arabian Gulf, including Dubai and Abu Dhabi.',    region: 'Gulf',           cx: 1288, cy: 399, r: 12 },
  { id: 'qatar',        nameEnglish: 'Qatar',         nameArabic: 'قَطَر',                              audioFile: 'qatar.mp3',      fact: "A small peninsula in the Persian Gulf with the world's highest GDP per capita.",             region: 'Gulf',           cx: 1233, cy: 372, r: 12 },
  { id: 'bahrain',      nameEnglish: 'Bahrain',       nameArabic: 'البَحْرَيْن',                        audioFile: 'bahrain.mp3',    fact: 'An island nation in the Persian Gulf, connected to Saudi Arabia by a causeway.',               region: 'Gulf',           cx: 1245, cy: 345, r: 11 },
  { id: 'kuwait',       nameEnglish: 'Kuwait',        nameArabic: 'الكُوَيْت',                          audioFile: 'kuwait.mp3',     fact: 'A small but wealthy Gulf oil state at the head of the Persian Gulf.',                          region: 'Gulf',           cx: 1168, cy: 286, r: 12 },
  { id: 'djibouti',     nameEnglish: 'Djibouti',      nameArabic: 'جِيبُوتِي',                          audioFile: 'djibouti.mp3',   fact: 'Located at the strategic Bab el-Mandeb strait, a key global shipping route.',                  region: 'Horn of Africa', cx: 1081, cy: 633, r: 12 },
  { id: 'somalia',      nameEnglish: 'Somalia',       nameArabic: 'الصُّومَال',                         audioFile: 'somalia.mp3',    fact: 'Has the longest coastline in mainland Africa, along the Indian Ocean.',                        region: 'Horn of Africa', cx: 1167, cy: 696, r: 16 },
  { id: 'comoros',      nameEnglish: 'Comoros',       nameArabic: 'جُزُر القَمَر',                      audioFile: 'comoros.mp3',    fact: 'A volcanic island nation off east Africa, known as the "Perfume Islands" for its ylang-ylang.', region: 'Horn of Africa', cx: 1330, cy: 705, r: 12 },
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
