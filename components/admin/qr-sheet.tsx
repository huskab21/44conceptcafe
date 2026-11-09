"use client";

import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { AdminGate, type AdminHeaders } from "@/components/admin/admin-gate";
import { Logo } from "@/components/logo";

type TableQr = { table: number; url: string; svg: string };

/** Printable table cards: one QR per table, each opening /t/<n>?k=<signature>. Print once, stick on the table. */
function Sheet({ auth }: { auth: AdminHeaders }) {
  const [cards, setCards] = useState<TableQr[]>([]);
  const [base, setBase] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setBase(process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!base) return;
    (async () => {
      const res = await fetch("/api/tables", { headers: await auth() });
      if (!res.ok) return;
      const { tables } = (await res.json()) as { tables: { table: number; path: string }[] };
      const out = await Promise.all(
        tables.map(async (t) => {
          const url = base.replace(/\/$/, "") + t.path;
          const svg = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#120c08", light: "#00000000" } });
          return { table: t.table, url, svg };
        }),
      );
      setCards(out);
    })();
  }, [auth, base]);

  return (
    <main className="min-h-svh px-4 py-6 sm:px-6 print:bg-white print:p-0">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 print:hidden">
        <div>
          <p className="font-mono text-[0.62rem] tracking-[0.3em] text-gold uppercase">44 concept café · Staff</p>
          <h1 className="mt-1 font-display text-4xl text-cream">Ширээний QR</h1>
          <p className="mt-2 max-w-xl text-sm text-cream-dim">
            Ширээ бүр өөрийн QR-тэй. Нэг удаа хэвлээд ширээн дээр нааж болно — меню, үнэ өөрчлөгдсөн ч QR солих шаардлагагүй.
            {base.includes("localhost") && <b className="text-gold"> ⚠ Одоо localhost хаяг байна — сайтаа байршуулсны дараа хэвлээрэй.</b>}
          </p>
        </div>
        <div className="flex gap-2 font-mono text-[0.65rem] tracking-[0.15em] uppercase">
          <Link href="/admin" className="rounded-full border border-white/20 px-4 py-2 text-cream hover:border-gold">
            ← Захиалгууд
          </Link>
          <button type="button" onClick={() => window.print()} className="rounded-full bg-gold px-5 py-2 text-ink">
            Хэвлэх
          </button>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:mt-0 print:grid-cols-3 print:gap-0">
        {cards.map((c) => (
          <article key={c.table} className="flex break-inside-avoid flex-col items-center rounded-3xl bg-[#f3ece2] p-6 text-center text-[#120c08] print:rounded-none print:border print:border-dashed print:border-black/30">
            <p>
              <Logo size="1.5rem" tone="dark" />
            </p>
            <div className="mt-4 aspect-square w-full max-w-[180px]" dangerouslySetInnerHTML={{ __html: c.svg }} />
            <p className="mt-4 font-mono text-[0.6rem] tracking-[0.25em] uppercase opacity-70">Уншуулаад захиал</p>
            <p className="mt-1 font-display text-3xl">Ширээ {c.table}</p>
            <a href={c.url} target="_blank" rel="noreferrer" className="mt-2 font-mono text-[0.55rem] break-all opacity-50 print:hidden">
              {c.url.replace(/^https?:\/\//, "")}
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}

export function QrSheet() {
  return <AdminGate>{(auth) => <Sheet auth={auth} />}</AdminGate>;
}
