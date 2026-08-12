import { useState } from "react";
import { Button, Card } from "@/components/ui";
import terms from "../../TERMS_OF_SERVICE.md?raw";
import privacy from "../../PRIVACY_POLICY.md?raw";

type PublicPath = "/terms" | "/privacy" | "/contact";

const CONTACT_EMAIL = "contact@arabic1010.com";

function go(path: string) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function InlineText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={index} className="font-semibold text-sand">{part.slice(2, -2)}</strong>
          : <span key={index}>{part}</span>
      )}
    </>
  );
}

function DocumentBody({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  if (lines[0]?.startsWith("# ")) lines.shift();
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="text-sm leading-7 text-sand/75">
        <InlineText text={paragraph.join(" ")} />
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc space-y-2 pl-5 text-sm leading-7 text-sand/75">
        {list.map((item) => <li key={item}><InlineText text={item} /></li>)}
      </ul>
    );
    list = [];
  };

  lines.forEach((line) => {
    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }
    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();
      blocks.push(<h1 key={`h1-${blocks.length}`} className="text-3xl font-extrabold text-sand">{line.slice(2)}</h1>);
      return;
    }
    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={`h2-${blocks.length}`} className="border-b border-gold/15 pb-2 pt-3 text-xl font-bold text-gold">{line.slice(3)}</h2>);
      return;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2));
      return;
    }
    paragraph.push(line);
  });

  flushParagraph();
  flushList();
  return <div className="space-y-5">{blocks}</div>;
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="pattern relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-maroon/55 via-ink-2 to-ink p-6 sm:p-8">
      <div className="relative z-10">
        <button onClick={() => go("/")} className="text-xs font-semibold text-gold transition hover:text-sand">← Back to Arabic1010</button>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="majestic-arabic text-3xl" aria-label="Arabic language">العَرَبِيَّة</div>
            <h1 className="mt-2 text-3xl font-extrabold text-sand sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-sand/60">{subtitle}</p>
          </div>
          <div className="rounded-2xl border border-gold/20 bg-black/20 px-4 py-3 text-center text-xs text-sand/55">
            <div className="font-semibold text-gold">Arabic1010</div>
            <div>English-language release documents</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegalDocument({ title, subtitle, content }: { title: string; subtitle: string; content: string }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Header title={title} subtitle={subtitle} />
      <div className="rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-xs leading-6 text-sand/75">
        <strong className="text-warn">Launch review notice:</strong> This is a working draft prepared for the current client-only release. Have a qualified lawyer review the operator details, jurisdiction, age/consent rules, and privacy obligations before relying on it publicly.
      </div>
      <Card className="p-6 sm:p-9">
        <DocumentBody markdown={content} />
      </Card>
    </div>
  );
}

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("General question");
  const [message, setMessage] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const subject = `[Arabic1010] ${topic}`;
    const body = `Name: ${name || "Not provided"}\nReply email: ${email || "Not provided"}\n\n${message}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Header title="Contact Arabic1010" subtitle="Questions, corrections, accessibility feedback, and partnership ideas are welcome." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <Card className="p-6">
          <div className="majestic-arabic text-4xl" aria-label="Welcome">أَهْلاً وَسَهْلاً</div>
          <h2 className="mt-4 text-xl font-bold text-sand">A direct line to the project</h2>
          <p className="mt-2 text-sm leading-7 text-sand/65">This release uses your device’s email application rather than a server-side contact inbox. Your message is not sent until you review and send the email draft.</p>
          <a className="mt-5 inline-block text-sm font-semibold text-gold underline decoration-gold/30 underline-offset-4 hover:text-sand" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <p className="mt-5 text-xs leading-6 text-sand/45">Please do not include passwords, payment details, government identifiers, health information, or other sensitive material.</p>
        </Card>
        <Card className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sand/60" htmlFor="contact-name">Name</label>
              <input id="contact-name" className="w-full rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-sm outline-none focus:border-gold/70" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sand/60" htmlFor="contact-email">Reply email</label>
              <input id="contact-email" type="email" className="w-full rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-sm outline-none focus:border-gold/70" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sand/60" htmlFor="contact-topic">Topic</label>
              <select id="contact-topic" className="w-full rounded-xl border border-white/12 bg-ink px-4 py-3 text-sm outline-none focus:border-gold/70" value={topic} onChange={(e) => setTopic(e.target.value)}>
                <option>General question</option>
                <option>Privacy request</option>
                <option>Content correction</option>
                <option>Accessibility feedback</option>
                <option>Partnership idea</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-sand/60" htmlFor="contact-message">Message</label>
              <textarea id="contact-message" required rows={6} className="w-full resize-y rounded-xl border border-white/12 bg-black/25 px-4 py-3 text-sm outline-none focus:border-gold/70" value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Open email draft →</Button>
            <p className="text-center text-[11px] leading-5 text-sand/40">This form opens your email app. It does not submit data to an Arabic1010 server in this release.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function PublicInfo({ path }: { path: PublicPath }) {
  if (path === "/terms") {
    return <LegalDocument title="Terms of Service" subtitle="The rules and responsibilities for using Arabic1010." content={terms} />;
  }
  if (path === "/privacy") {
    return <LegalDocument title="Privacy Policy" subtitle="How the current client-only release handles information." content={privacy} />;
  }
  return <ContactPage />;
}
