/**
 * Hand-drawn SVG product mockups (takeaway cup + coffee bag) carrying the 44 branding.
 * Pure SVG so they stay crisp at any size and need no image assets.
 */

const deco = "var(--font-unbounded), sans-serif";
const sans = "var(--font-inter-tight), sans-serif";
const mono = "var(--font-jetbrains), monospace";
const script = "var(--font-caveat), cursive";

export function CupMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 420" className={className} role="img" aria-label="44 брэндийн кофены аяга">
      <defs>
        <linearGradient id="cup-body" x1="0" x2="1">
          <stop offset="0" stopColor="#bdb6aa" />
          <stop offset="0.18" stopColor="#ebe6dc" />
          <stop offset="0.55" stopColor="#f7f3ec" />
          <stop offset="0.85" stopColor="#ddd6ca" />
          <stop offset="1" stopColor="#a9a195" />
        </linearGradient>
        <linearGradient id="cup-lid" x1="0" x2="1">
          <stop offset="0" stopColor="#050505" />
          <stop offset="0.45" stopColor="#2b2b2b" />
          <stop offset="1" stopColor="#070707" />
        </linearGradient>
        <linearGradient id="cup-sleeve" x1="0" x2="1">
          <stop offset="0" stopColor="#0b0b0b" />
          <stop offset="0.5" stopColor="#222" />
          <stop offset="1" stopColor="#090909" />
        </linearGradient>
        <clipPath id="cup-clip">
          <path d="M42 92 H278 L250 408 Q160 418 70 408 Z" />
        </clipPath>
      </defs>

      {/* shadow */}
      <ellipse cx="160" cy="412" rx="110" ry="9" fill="#000" opacity="0.45" />

      {/* body */}
      <path d="M42 92 H278 L250 408 Q160 418 70 408 Z" fill="url(#cup-body)" />
      <g clipPath="url(#cup-clip)">
        {/* bottom sleeve */}
        <rect x="0" y="352" width="320" height="70" fill="url(#cup-sleeve)" />
        {/* print */}
        <text x="160" y="196" textAnchor="middle" fontFamily={deco} fontWeight="600" fontSize="78" fill="#151110" letterSpacing="-4">
          44
        </text>
        <text x="160" y="224" textAnchor="middle" fontFamily={sans} fontWeight="700" fontSize="13" fill="#151110" letterSpacing="5">
          CONCEPT CAFÉ
        </text>
        <line x1="88" y1="252" x2="232" y2="252" stroke="#151110" strokeWidth="1.2" />
        <text x="92" y="276" fontFamily={sans} fontWeight="500" fontSize="12" fill="#151110" letterSpacing="1">
          САЙН КОФЕ
        </text>
        <text x="92" y="292" fontFamily={sans} fontWeight="500" fontSize="12" fill="#151110" letterSpacing="1">
          САЙН ӨДӨР
        </text>
        <line x1="92" y1="308" x2="228" y2="308" stroke="#151110" strokeWidth="1.2" />
        <text x="118" y="332" textAnchor="middle" fontFamily={mono} fontSize="10.5" fill="#151110">
          350 МЛ
        </text>
        <line x1="160" y1="316" x2="160" y2="344" stroke="#151110" strokeWidth="1.2" />
        <text x="196" y="328" textAnchor="middle" fontFamily={mono} fontSize="9" fill="#151110">
          ӨДӨР БҮР
        </text>
        <text x="196" y="340" textAnchor="middle" fontFamily={mono} fontSize="9" fill="#151110">
          ШИНЭ
        </text>
      </g>

      {/* lid */}
      <path d="M30 78 Q30 62 48 60 H272 Q290 62 290 78 V92 Q290 100 280 100 H40 Q30 100 30 92 Z" fill="url(#cup-lid)" />
      <path d="M56 60 Q62 30 92 26 H228 Q258 30 264 60 Z" fill="url(#cup-lid)" />
      <rect x="120" y="32" width="56" height="7" rx="3.5" fill="#000" opacity="0.6" />
      <path d="M40 66 H280" stroke="#fff" strokeOpacity="0.08" strokeWidth="2" />
    </svg>
  );
}

export function BagMockup({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 520" className={className} role="img" aria-label="44 брэндийн кофены үрийн уут">
      <defs>
        <linearGradient id="bag-body" x1="0" x2="1">
          <stop offset="0" stopColor="#cfc6b6" />
          <stop offset="0.12" stopColor="#efe8db" />
          <stop offset="0.6" stopColor="#f6f1e7" />
          <stop offset="0.9" stopColor="#e2d9c9" />
          <stop offset="1" stopColor="#b9af9d" />
        </linearGradient>
        <linearGradient id="bag-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9d0c0" />
          <stop offset="1" stopColor="#efe8db" />
        </linearGradient>
      </defs>

      <ellipse cx="180" cy="510" rx="150" ry="10" fill="#000" opacity="0.45" />

      {/* gusset top */}
      <path d="M28 70 L52 18 H308 L332 70 Z" fill="url(#bag-top)" />
      <path d="M52 18 H308" stroke="#b5ab98" strokeWidth="2" />
      <path d="M28 70 L52 18 M332 70 L308 18" stroke="#b5ab98" strokeWidth="1.5" />

      {/* body */}
      <path d="M28 70 H332 L338 498 Q180 506 22 498 Z" fill="url(#bag-body)" />
      <path d="M28 70 H332" stroke="#c4baa8" strokeWidth="2" />
      <path d="M40 120 Q34 300 40 480" stroke="#000" strokeOpacity="0.05" strokeWidth="10" fill="none" />

      {/* print */}
      <text x="180" y="150" textAnchor="middle" fontFamily={deco} fontWeight="600" fontSize="64" fill="#1a1512" letterSpacing="-3">
        44
      </text>
      <text x="180" y="178" textAnchor="middle" fontFamily={sans} fontWeight="700" fontSize="13" fill="#1a1512" letterSpacing="6">
        CONCEPT CAFÉ
      </text>

      <text x="180" y="262" textAnchor="middle" fontFamily={script} fontWeight="500" fontSize="70" fill="#4a423b" transform="rotate(-6 180 250)">
        deco roast
      </text>

      <text x="52" y="324" fontFamily={sans} fontWeight="500" fontSize="11.5" fill="#1a1512" letterSpacing="0.5">
        ЖИЖИГ БАГЦААР
      </text>
      <text x="52" y="340" fontFamily={sans} fontWeight="500" fontSize="11.5" fill="#1a1512" letterSpacing="0.5">
        ГАРААР ШАРСАН.
      </text>
      <text x="52" y="356" fontFamily={sans} fontWeight="500" fontSize="11.5" fill="#1a1512" letterSpacing="0.5">
        ЗӨӨЛӨН, ТЭНЦВЭРТЭЙ
      </text>
      <text x="52" y="372" fontFamily={sans} fontWeight="500" fontSize="11.5" fill="#1a1512" letterSpacing="0.5">
        АМТТАЙ.
      </text>

      <text x="214" y="324" fontFamily={sans} fontWeight="700" fontSize="11.5" fill="#1a1512" letterSpacing="1">
        АМТ
      </text>
      <line x1="214" y1="334" x2="310" y2="334" stroke="#1a1512" strokeWidth="1" />
      {["ШОКОЛАД", "ИНЖИР", "ШАРСАН САМАР"].map((t, i) => (
        <text key={t} x="214" y={354 + i * 17} fontFamily={sans} fontWeight="500" fontSize="11" fill="#1a1512">
          {t}
        </text>
      ))}

      <line x1="46" y1="420" x2="314" y2="420" stroke="#1a1512" strokeWidth="1" />
      <line x1="46" y1="470" x2="314" y2="470" stroke="#1a1512" strokeWidth="1" />
      <line x1="134" y1="420" x2="134" y2="470" stroke="#1a1512" strokeWidth="1" />
      <line x1="226" y1="420" x2="226" y2="470" stroke="#1a1512" strokeWidth="1" />
      <text x="90" y="450" textAnchor="middle" fontFamily={mono} fontSize="11" fill="#1a1512">
        250 Г
      </text>
      <text x="180" y="450" textAnchor="middle" fontFamily={mono} fontSize="11" fill="#1a1512">
        ҮРЭЭРЭЭ
      </text>
      <text x="270" y="444" textAnchor="middle" fontFamily={mono} fontSize="9.5" fill="#1a1512">
        ШАРСАН
      </text>
      <text x="270" y="458" textAnchor="middle" fontFamily={mono} fontSize="9.5" fill="#1a1512">
        УЛААНБААТАР
      </text>
    </svg>
  );
}
