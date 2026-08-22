import { Button } from "@/components/ui";

type JournalProps = { navigate: (path: string) => void };

const sections = [
  {
    title: "A language learner now meets Arabic in more than one place.",
    paragraphs: [
      "Nowadays, language learning should not be reduced to identifying, reading, writing, and recalling letters, syllables, vocabulary, and rules. Those foundations remain essential, but they are now practiced in environments shaped by keyboards, screens, audio interfaces, and digital communication.",
      "Learners therefore need more than knowledge about Arabic. They need practical confidence in how Arabic behaves when it is written, heard, selected, and produced on contemporary devices. Acquiring the fundamentals of Digital Arabic Literacy is not an optional extra. It is part of meeting the language as it is used today.",
    ],
  },
  {
    title: "From a letter on the page to a letter in motion.",
    paragraphs: [
      "That is why we built Arabic1010. We moved beyond simple flashcards to create a platform that respects the fluid complexity of the Arabic writing system. Instead of treating letters as static images, the platform uses digital guides to show how they are drawn, stroke by stroke.",
      "This matters for beginners because Arabic letters do not function only as isolated pictures. Their form, direction, and connection behavior become part of the learner's developing understanding of the language.",
    ],
  },
  {
    title: "The Syllable Playground connects what the learner sees with what the learner hears.",
    paragraphs: [
      "Orthography is the written form of language. Phonology concerns the organization of its sounds. In the Syllable Playground, the learner chooses a long vowel, watches the written combination appear, and hears the resulting syllable immediately.",
      "The point is not to introduce technical vocabulary for its own sake. The point is to make a relationship perceptible. A learner can see how a letter and a vowel combine, then hear the sound that belongs to that combination. Writing and pronunciation are no longer presented as unrelated exercises.",
    ],
  },
  {
    title: "A beginning in Arabic also needs a beginning in register awareness.",
    paragraphs: [
      "Arabic is used across a range of formal and spoken settings. Arabic1010 introduces a concise distinction between Modern Standard Arabic and Elevated or Educated Spoken Arabic so that beginners can recognize the register they are encountering without being asked to master the entire sociolinguistic landscape at once.",
      "This is not a reason to overwhelm a first-time learner with dialect surveys. It is a reason to make the social setting visible from the beginning and to avoid implying that every Arabic interaction follows one uniform pattern.",
    ],
  },
  {
    title: "Foundational competence, named honestly.",
    paragraphs: [
      "Arabic1010 culminates in a Certificate of Foundational Competence in Digital Arabic Literacy, Level 1. The certificate recognizes work with Arabic letters, syllables, screen-based writing, pronunciation, and introductory register awareness.",
      "It is deliberately a beginning, not a claim to the whole language. Future levels can extend the learner's work without asking the first credential to say more than the curriculum can support.",
    ],
  },
];

export default function Journal({ navigate }: JournalProps) {
  return (
    <main className="min-h-screen bg-ink text-sand">
      <header className="border-b border-gold/15 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left transition hover:text-gold" aria-label="Return to Arabic1010 home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-gold via-coral to-maroon text-lg font-black text-ink">ع</span>
            <span>
              <span className="block text-sm font-extrabold tracking-wide">Arabic<span className="text-gold">1010</span></span>
              <span className="ar block text-xs text-sand/55">العَرَبِيَّة</span>
            </span>
          </button>
          <a href="https://arabic1010.com" className="hidden items-center gap-1 text-xs text-sand/60 transition hover:text-gold sm:flex">Learning environment <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <article className="mx-auto max-w-3xl">
          <header className="border-b border-gold/15 pb-10 pt-16 sm:pt-24">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold"><span aria-hidden="true">◌</span> Arabic1010 Journal</div>
            <h1 className="mt-7 text-4xl font-extrabold leading-[1.03] tracking-tight text-sand sm:text-6xl">From ink to interface:<span className="mt-2 block font-serif italic font-medium text-gold">why Arabic learning now requires digital literacy.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-sand/65">A note from Dr. Ali H. Raddaoui, linguist and founder of Arabic1010, on the relationship between Arabic letters, sound, screens, and the learner's first steps.</p>
            <div className="mt-6 text-xs uppercase tracking-[0.18em] text-sand/35">Digital Arabic Literacy · Level 1</div>
          </header>

          <div className="border-l border-gold/40 pl-5 pt-12 text-lg font-medium leading-8 text-sand/85 sm:pl-8">Language learning should meet learners where language is now encountered: in the hand, the ear, the screen, and the social setting.</div>

          <div className="mt-12 space-y-16 sm:mt-16 sm:space-y-20">
            {sections.map((section, index) => (
              <section key={section.title}>
                <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold/75">0{index + 1}</div>
                <h2 className="max-w-2xl text-3xl font-bold leading-tight text-sand sm:text-4xl">{section.title}</h2>
                <div className="mt-6 space-y-5 text-base leading-8 text-sand/65 sm:text-lg">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-20 rounded-2xl border border-gold/20 bg-gold/5 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Continue the work</p>
            <h2 className="mt-3 text-2xl font-bold text-sand">Start with the letter. Stay for the system.</h2>
            <p className="mt-3 max-w-xl leading-7 text-sand/60">Read the argument here, then experience the method in the Arabic1010 learning environment.</p>
            <Button className="mt-6" onClick={() => navigate("/")}>Return to learning <span aria-hidden="true">←</span></Button>
          </aside>
        </article>
      </div>

      <footer className="border-t border-white/5 px-5 py-7 text-center text-xs text-sand/35 sm:px-8">
        <span>© 2026 Arabic1010 · All Rights Reserved</span>
      </footer>
    </main>
  );
}
