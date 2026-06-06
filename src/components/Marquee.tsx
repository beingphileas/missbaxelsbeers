interface MarqueeProps {
  text?: string;
  className?: string;
}

const DEFAULT_TEXT =
  "GEEN ZEVER. GEWOON BIER. ✦ BIJ KOEN EN MARIJKE ✦ LOKAAL GEBROUWEN ✦ THE PORTUGAL COLLECTION ✦ ";

export default function Marquee({ text = DEFAULT_TEXT, className = "" }: MarqueeProps) {
  // Duplicate the text several times so the loop is seamless
  const repeated = Array(6).fill(text).join("");

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{
        background: "#0a0a0a",
        borderBottom: "2px solid #0a0a0a",
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <div className="marquee-track flex whitespace-nowrap">
        <span
          className="marquee-content inline-block"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.4vw, 18px)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#2b4cff",
            paddingRight: 24,
          }}
        >
          {repeated}
        </span>
        <span
          className="marquee-content inline-block"
          aria-hidden="true"
          style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(14px, 1.4vw, 18px)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#2b4cff",
            paddingRight: 24,
          }}
        >
          {repeated}
        </span>
      </div>
    </div>
  );
}
