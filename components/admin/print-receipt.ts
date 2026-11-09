"use client";

type PrintableOrder = {
  number: number;
  table_no: number;
  lines: { name: string; price: number; qty: number }[];
  note: string | null;
  subtotal?: number;
  discount: number;
  total: number;
  created_at: string;
  paid_at?: string | null;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const money = (n: number) => `${n.toLocaleString("en-US")}₮`;

/**
 * Prints an 80mm kitchen/bar ticket through a hidden iframe.
 * To print straight to the connected receipt printer without the dialog, run Chrome on the bar computer with
 * `--kiosk-printing` and set that printer as the system default.
 */
export function printReceipt(o: PrintableOrder) {
  const when = new Date(o.created_at).toLocaleString("mn-MN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  const rows = o.lines
    .map((l) => `<tr><td class="q">${l.qty}×</td><td>${esc(l.name)}</td><td class="r">${money(l.price * l.qty)}</td></tr>`)
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>#${o.number}</title><style>
    @page { size: 80mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body { margin: 0; width: 74mm; font: 12px/1.35 ui-monospace, Menlo, Consolas, monospace; color: #000; }
    h1 { margin: 0; font-size: 22px; text-align: center; letter-spacing: -0.5px; }
    .c { text-align: center; } .r { text-align: right; white-space: nowrap; } .q { width: 9mm; font-weight: 700; vertical-align: top; }
    .big { font-size: 26px; font-weight: 800; text-align: center; margin: 4px 0; }
    hr { border: 0; border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; } td { padding: 2px 0; vertical-align: top; }
    .tot td { font-size: 15px; font-weight: 800; padding-top: 4px; }
    .note { border: 1px solid #000; padding: 4px; margin-top: 6px; font-weight: 700; }
  </style></head><body>
    <h1>44 concept café</h1><p class="c">Selling the vibe</p><hr>
    <p class="big">ШИРЭЭ ${o.table_no}</p>
    <p class="c">#${String(o.number).padStart(3, "0")} · ${esc(when)}</p><hr>
    <table>${rows}</table><hr>
    <table>
      ${o.discount > 0 ? `<tr><td>2+1 урамшуулал</td><td class="r">−${money(o.discount)}</td></tr>` : ""}
      <tr class="tot"><td>НИЙТ</td><td class="r">${money(o.total)}</td></tr>
    </table>
    ${o.paid_at ? `<p class="c">✓ ТӨЛӨГДСӨН (Bonum)</p>` : ""}
    ${o.note ? `<p class="note">ТЭМДЭГЛЭЛ: ${esc(o.note)}</p>` : ""}
    <hr><p class="c">Баярлалаа!</p>
  </body></html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  const win = frame.contentWindow!;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(() => {
    win.focus();
    win.print();
    cleanup();
  }, 150);
}
