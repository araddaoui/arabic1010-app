import { motion } from "framer-motion";
import { Card, Button } from "@/components/ui";

export default function Verify({ id, navigate }: { id?: string; navigate: (p: string) => void }) {
  // In a real app, this would fetch from a database. 
  // For this version, we'll simulate verification for any ID that matches our format.
  const isValid = id && id.startsWith("A1010-") && id.length > 10;
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-ink text-sand">
      <div className="w-full max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
            <div className="ar-c mx-auto text-6xl text-gold">ع</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight">ARABIC<span className="text-gold">1010</span></h1>
            <p className="text-sm uppercase tracking-[0.3em] text-sand/40">Credential Verification Service</p>
          </div>

          <Card className="border-gold/30 bg-white/5 p-8 text-center">
            {isValid ? (
              <>
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-ok/20 text-4xl text-ok shadow-lg shadow-ok/10">
                  ✓
                </div>
                <h2 className="text-2xl font-bold text-white">Verified Credential</h2>
                <p className="mt-2 text-sand/70">
                  This Digital Arabic Literacy certificate (Foundational Level 1) is authentic and was issued by Arabic1010.
                </p>
                
                <div className="mt-8 grid grid-cols-2 gap-4 text-left border-t border-white/10 pt-8">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-sand/40">Credential ID</div>
                    <div className="mt-1 font-mono text-sm text-gold">{id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-sand/40">Status</div>
                    <div className="mt-1 text-sm font-bold text-ok">Active / Valid</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-sand/40">Issuer</div>
                    <div className="mt-1 text-sm">Arabic1010 Foundation</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-sand/40">Authority</div>
                    <div className="mt-1 text-sm">Dr. Ali H. Raddaoui</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-maroon/20 text-4xl text-maroon shadow-lg shadow-maroon/10">
                  ✕
                </div>
                <h2 className="text-2xl font-bold text-white">Invalid Credential</h2>
                <p className="mt-2 text-sand/70">
                  The provided Credential ID could not be verified. Please check the ID and try again.
                </p>
                <div className="mt-6 font-mono text-sm text-sand/40 italic">{id || "No ID provided"}</div>
              </>
            )}

            <div className="mt-10 flex flex-col gap-3">
              <Button onClick={() => navigate("/")}>Return to Arabic1010</Button>
              <p className="text-[10px] text-sand/30 italic">
                Verification secured by Arabic1010 Digital Ledger. 
                For institutional inquiries, contact verification@arabic1010.com
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
