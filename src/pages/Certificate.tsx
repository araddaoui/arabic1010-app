import { motion } from "framer-motion";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui";

export default function Certificate() {
  const { user } = useApp();
  if (!user) return null;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const certId = `A1010-${user.id.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}-2026`;

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-2xl font-bold">Your Official Certificate</h2>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.print()}>Print / Save as PDF</Button>
          <Button onClick={() => window.open(`https://linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Digital%20Arabic%20Literacy%20(Level%201)&organizationName=Arabic1010&issueYear=2026&issueMonth=8&certId=${certId}`)}>Add to LinkedIn</Button>
        </div>
      </div>

      {/* The Certificate Paper (Front) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="certificate-paper relative aspect-[1.414/1] w-full overflow-hidden rounded-sm border-[12px] border-[#1A1A2E] bg-[#FDF6E3] p-1 shadow-2xl"
        style={{ color: "#1A1A2E" }}
      >
        {/* Inner Gold Border */}
        <div className="h-full w-full border-2 border-[#C9A227] p-12 text-center relative">
          
          {/* Watermark Ayn (Full Vertical Majesty) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
            <div className="ar-c text-[1200px] leading-none select-none text-[#C9A227]">ع</div>
          </div>

          {/* Seal & Ribbon */}
          <div className="absolute bottom-12 left-12 flex flex-col items-center">
            <div className="relative">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
                <div className="w-5 h-12 bg-[#7B2020]" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }}></div>
                <div className="w-5 h-12 bg-[#7B2020] opacity-80" style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 80%, 0% 100%)' }}></div>
              </div>
              <div className="relative h-24 w-24 rounded-full border-4 border-[#C9A227] bg-white flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-[6px] font-black uppercase tracking-tighter">Arabic1010</div>
                  <div className="ar-c text-4xl leading-none text-[#C9A227]">ع</div>
                  <div className="text-[6px] font-black uppercase tracking-tighter">Official Seal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Header (Raised proportionately) */}
          <div className="relative z-10 -mt-4">
            <div className="text-4xl font-black tracking-tighter">ARABIC<span className="text-[#C9A227]">1010</span></div>
            
            <div className="mt-4 ar text-4xl font-bold leading-relaxed">
              شَهَادَةُ الكَفَاءَةِ التَّأْسِيسِيَّةِ فِي مَحْوِ الأُمِّيَّةِ الرَّقْمِيَّةِ بِاللُّغَةِ العَرَبِيَّةِ
            </div>
            <div className="ar text-xl text-[#C9A227] mt-1">(المُسْتَوَى الأَوَّل)</div>
            
            <div className="mt-2 text-xl italic font-serif">
              Certificate of Foundational Competence in Digital Arabic Literacy
            </div>
            <div className="text-sm font-bold text-[#C9A227] mt-1">(Level 1)</div>

            <div className="mt-8 text-lg">This is to certify that</div>
            <div className="mt-2 text-5xl font-black text-[#7B2020] uppercase tracking-wide text-left ml-20">{user.name || "ARABIC LEARNER"}</div>
            
            <div className="ml-20 mt-4 w-64 border-t-2 border-[#C9A227]"></div>
            
            <div className="mx-auto mt-16 max-w-2xl text-lg leading-relaxed font-medium">
              has successfully completed the foundational curriculum of Arabic1010, demonstrating competence in Arabic orthography, phonology, and digital register awareness at a Level 1 proficiency.
            </div>

            {/* Footer Grid */}
            <div className="mt-20 grid grid-cols-3 gap-8 items-end">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Date of Issuance</div>
                <div className="mt-2 text-lg font-bold">{today}</div>
                <div className="mt-1 border-t border-[#1A1A2E]"></div>
              </div>
              
              <div className="text-[14px] font-bold opacity-10 tracking-[0.3em]">ARABIC1010.COM</div>
              
              <div>
                <div className="flex flex-col items-center">
                  <div className="ar text-3xl font-bold">د. علي الهاشمي رداوي</div>
                  <div className="text-xl italic font-serif font-bold mt-1">Dr. Ali H. Raddaoui</div>
                </div>
                <div className="mt-1 border-t border-[#1A1A2E]"></div>
                <div className="text-[10px] font-bold uppercase tracking-widest opacity-40">Lead Linguist & Founder</div>
              </div>
            </div>

            <div className="mt-16 text-[9px] font-bold opacity-30 flex justify-center gap-8">
              <span>Credential ID: {certId}</span>
              <a href={`#/verify/${certId}`} className="hover:text-[#C9A227] underline">Verify at: arabic1010.com/verify</a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The Certificate Paper (Back - Competency Rubric) */}
      <div className="mt-12 text-center no-print">
        <h3 className="text-xl font-bold opacity-50">Certificate Reverse: Competency Rubric</h3>
        <p className="text-sm text-sand/40">This page provides institutional proof of specific skills mastered.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="certificate-paper relative aspect-[1.414/1] w-full overflow-hidden rounded-sm border-[12px] border-[#1A1A2E] bg-[#FDF6E3] p-1 shadow-2xl mt-4"
        style={{ color: "#1A1A2E" }}
      >
        <div className="h-full w-full border-2 border-[#C9A227] p-16 relative">
          <div className="text-center">
            <h3 className="text-2xl font-bold uppercase tracking-widest border-b-2 border-[#1A1A2E] inline-block pb-2">Competency Rubric & Mastery Details</h3>
            <p className="mt-4 text-sm italic opacity-60">Credential ID: {certId}</p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-x-12 gap-y-8 text-left">
            <div>
              <h4 className="font-bold border-l-4 border-[#C9A227] pl-3 text-[#7B2020]">Orthographic Mastery</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Precise stroke order and direction for all 28 Arabic letters.</li>
                <li>• Recognition of initial, medial, and final connection behaviors.</li>
                <li>• Mastery of the "Ghost Medial" and ligature transition points.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold border-l-4 border-[#C9A227] pl-3 text-[#7B2020]">Phonological Decoding</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Distinction between short vowels (harakat) and long vowels.</li>
                <li>• Accurate pronunciation of emphatic and guttural consonants.</li>
                <li>• Syllabic synthesis: combining glyphs into phonetic units.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold border-l-4 border-[#C9A227] pl-3 text-[#7B2020]">Sociolinguistic Awareness</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Identification of Modern Standard Arabic (MSA) formal register.</li>
                <li>• Recognition of Elevated Spoken Arabic (ESA) dialectal cues.</li>
                <li>• Contextual usage of greetings and social protocols.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold border-l-4 border-[#C9A227] pl-3 text-[#7B2020]">Digital Literacy</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Proficiency in the standard Arabic keyboard layout.</li>
                <li>• Speed and automaticity in digital word retrieval.</li>
                <li>• Navigation of Arabic-language digital interfaces.</li>
              </ul>
            </div>
          </div>

          <div className="absolute bottom-16 left-16 right-16 flex justify-between items-end border-t border-[#1A1A2E] pt-8">
            <div className="text-[10px] max-w-md opacity-60">
              <strong>Institutional Note:</strong> This Level 1 certificate validates foundational literacy. It is designed as a prerequisite for Level 2 (Intermediate Synthesis) and Level 3 (Advanced Dialogue).
            </div>
            <div className="text-right">
              <div className="ar text-lg font-bold">د. علي الهاشمي رداوي</div>
              <div className="text-xs font-bold opacity-40 uppercase tracking-widest">Lead Linguist & Founder</div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .certificate-paper { 
            box-shadow: none !important; 
            border-radius: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
