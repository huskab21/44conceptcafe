"use client";

/**
 * Bluetooth (BLE) ESC/POS receipt printer, driven straight from the browser via Web Bluetooth.
 *
 * Works in Chrome on Android / Windows / Mac and in the Bluefy browser on iPhone (iOS Chrome/Safari have no
 * Web Bluetooth). The receipt is drawn on a canvas and sent as a raster image, so Mongolian Cyrillic (Ө, Ү)
 * prints correctly regardless of the printer's built-in code pages. Sized for 58mm paper (384 dots).
 */

export type ReceiptOrder = {
  number: number;
  table_no: number;
  lines: { name: string; price: number; qty: number }[];
  note: string | null;
  discount: number;
  total: number;
  created_at: string;
  paid_at?: string | null;
};

/* ───────────── minimal Web Bluetooth typings (not in lib.dom) ───────────── */

type BtChar = {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValueWithResponse(v: BufferSource): Promise<void>;
  writeValueWithoutResponse(v: BufferSource): Promise<void>;
};
type BtService = { getCharacteristics(): Promise<BtChar[]> };
type BtServer = { connected: boolean; connect(): Promise<BtServer>; getPrimaryServices(): Promise<BtService[]> };
type BtDevice = EventTarget & { name?: string; gatt?: BtServer };
type BtNavigator = Navigator & {
  bluetooth?: { requestDevice(o: { acceptAllDevices: boolean; optionalServices: string[] }): Promise<BtDevice> };
};

/** GATT services used by common cheap BLE thermal printers (Xprinter, GOOJPRT, PT-210, MTP-II, …). */
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

export const WIDTH_DOTS = 384; // 58mm @ 203dpi

/* ───────────── connection (one printer per page) ───────────── */

let device: BtDevice | null = null;
let char: BtChar | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());

export function btSupported() {
  return typeof navigator !== "undefined" && Boolean((navigator as BtNavigator).bluetooth);
}
export function btPrinterName(): string | null {
  return char && device ? device.name || "Принтер" : null;
}
export function onBtChange(f: () => void) {
  listeners.add(f);
  return () => void listeners.delete(f);
}

async function findWritable(server: BtServer): Promise<BtChar> {
  for (const s of await server.getPrimaryServices()) {
    for (const c of await s.getCharacteristics().catch(() => [] as BtChar[])) {
      if (c.properties.writeWithoutResponse || c.properties.write) return c;
    }
  }
  throw new Error("Энэ төхөөрөмж дээр хэвлэх суваг олдсонгүй. Receipt принтер мөн эсэхийг шалгана уу.");
}

async function attach(d: BtDevice) {
  const server = await d.gatt!.connect();
  char = await findWritable(server);
  device = d;
  emit();
}

/** Must be called from a click (browser rule). Shows the Bluetooth picker. */
export async function connectBtPrinter() {
  const bt = (navigator as BtNavigator).bluetooth;
  if (!bt) throw new Error("Энэ browser Bluetooth дэмжихгүй. iPhone дээр Bluefy, Android дээр Chrome ашиглана уу.");
  const d = await bt.requestDevice({ acceptAllDevices: true, optionalServices: PRINTER_SERVICES });
  d.addEventListener("gattserverdisconnected", () => {
    char = null;
    emit();
  });
  await attach(d);
}

async function ensureConnected() {
  if (char && device?.gatt?.connected) return char;
  if (!device) throw new Error("Принтер холбогдоогүй байна.");
  await attach(device); // reconnecting to an already-chosen device needs no click
  return char!;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function send(bytes: Uint8Array) {
  const c = await ensureConnected();
  const CHUNK = 180;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const part = bytes.slice(i, i + CHUNK);
    if (c.properties.writeWithoutResponse) {
      await c.writeValueWithoutResponse(part);
      await sleep(12); // let small printer buffers drain
    } else {
      await c.writeValueWithResponse(part);
    }
  }
}

let queue: Promise<unknown> = Promise.resolve();

/** Prints one receipt; calls are queued so receipts never interleave. */
export function btPrint(o: ReceiptOrder): Promise<void> {
  const job = queue.then(() => send(encode(renderReceipt(o))));
  queue = job.catch(() => null);
  return job;
}

/* ───────────── receipt → canvas ───────────── */

const money = (n: number) => `${n.toLocaleString("en-US")}₮`;

function renderReceipt(o: ReceiptOrder): HTMLCanvasElement {
  const W = WIDTH_DOTS;
  const PAD = 6;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = 2400;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#fff";
  g.fillRect(0, 0, W, canvas.height);
  g.fillStyle = "#000";
  g.textBaseline = "top";
  const FONT = '"Helvetica Neue", Arial, sans-serif';
  let y = 4;

  const text = (s: string, size: number, opts: { bold?: boolean; align?: "left" | "center" | "right"; x?: number } = {}) => {
    g.font = `${opts.bold ? "700" : "400"} ${size}px ${FONT}`;
    g.textAlign = opts.align ?? "left";
    const x = opts.x ?? (opts.align === "center" ? W / 2 : opts.align === "right" ? W - PAD : PAD);
    g.fillText(s, x, y);
  };
  const wrap = (s: string, size: number, maxW: number, bold = false) => {
    g.font = `${bold ? "700" : "400"} ${size}px ${FONT}`;
    const out: string[] = [];
    let line = "";
    for (const word of s.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > maxW && line) {
        out.push(line);
        line = word;
      } else line = next;
    }
    if (line) out.push(line);
    return out;
  };
  const dashed = () => {
    y += 4;
    for (let x = PAD; x < W - PAD; x += 8) g.fillRect(x, y, 4, 2);
    y += 10;
  };

  text("44 concept café", 30, { bold: true, align: "center" });
  y += 36;
  text("Selling the vibe", 18, { align: "center" });
  y += 24;
  dashed();
  text(`ШИРЭЭ ${o.table_no}`, 44, { bold: true, align: "center" });
  y += 52;
  const when = new Date(o.created_at).toLocaleString("mn-MN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  text(`#${String(o.number).padStart(3, "0")} · ${when}`, 20, { align: "center" });
  y += 26;
  dashed();

  for (const l of o.lines) {
    const price = money(l.price * l.qty);
    g.font = `400 22px ${FONT}`;
    const priceW = g.measureText(price).width;
    const nameLines = wrap(`${l.qty}× ${l.name}`, 22, W - PAD * 2 - priceW - 12, true);
    nameLines.forEach((nl, i) => {
      text(nl, 22, { bold: true });
      if (i === 0) text(price, 22, { align: "right" });
      y += 28;
    });
  }
  dashed();

  if (o.discount > 0) {
    text("2+1 урамшуулал", 20);
    text(`−${money(o.discount)}`, 20, { align: "right" });
    y += 26;
  }
  text("НИЙТ", 28, { bold: true });
  text(money(o.total), 28, { bold: true, align: "right" });
  y += 36;

  if (o.paid_at) {
    text("✓ ТӨЛӨГДСӨН (онлайн)", 22, { bold: true, align: "center" });
    y += 30;
  }
  if (o.note) {
    y += 4;
    const noteLines = wrap(`ТЭМДЭГЛЭЛ: ${o.note}`, 22, W - PAD * 2 - 12, true);
    const top = y;
    y += 6;
    noteLines.forEach((nl) => {
      text(nl, 22, { bold: true, x: PAD + 6 });
      y += 28;
    });
    y += 4;
    g.lineWidth = 2;
    g.strokeRect(PAD, top, W - PAD * 2, y - top);
    y += 6;
  }
  dashed();
  text("Баярлалаа!", 22, { align: "center" });
  y += 30;

  const out = document.createElement("canvas");
  out.width = W;
  out.height = Math.ceil(y / 8) * 8;
  out.getContext("2d")!.drawImage(canvas, 0, 0);
  return out;
}

/* ───────────── canvas → ESC/POS raster ───────────── */

function encode(canvas: HTMLCanvasElement): Uint8Array {
  const { width: w, height: h } = canvas;
  const px = canvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const bytesPerRow = w / 8;
  const parts: number[] = [0x1b, 0x40]; // ESC @  (reset)
  const BAND = 24; // rows per GS v 0 command — small bands keep cheap printers' buffers happy
  for (let top = 0; top < h; top += BAND) {
    const rows = Math.min(BAND, h - top);
    parts.push(0x1d, 0x76, 0x30, 0x00, bytesPerRow & 0xff, bytesPerRow >> 8, rows & 0xff, rows >> 8);
    for (let y = top; y < top + rows; y++) {
      for (let bx = 0; bx < bytesPerRow; bx++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          const i = (y * w + bx * 8 + bit) * 4;
          const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
          if (lum < 160) b |= 0x80 >> bit;
        }
        parts.push(b);
      }
    }
  }
  parts.push(0x1b, 0x64, 0x04); // ESC d 4 — feed so the tear bar clears the text
  return new Uint8Array(parts);
}
