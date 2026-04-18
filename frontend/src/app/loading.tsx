/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */

export default function Loading() {
  return (
    <div
      style={{
        padding: "120px 40px",
        maxWidth: 960,
        margin: "0 auto",
        fontFamily: "var(--font-mono)",
        color: "var(--fg-mute)",
        fontSize: 14,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      <span className="notebook-stamp">Folio</span>
      <p style={{ margin: "20px 0 0", fontFamily: "var(--font-mono)" }}>
        Fetching entries…
      </p>
      <div
        style={{
          marginTop: 28,
          display: "grid",
          gap: 14,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 104,
              borderBottom: "1px solid var(--rule)",
              animation: "notebook-shimmer 1.4s ease-in-out infinite",
              animationDelay: `${i * 90}ms`,
              background:
                "linear-gradient(90deg, var(--bg) 0%, var(--bg-2) 50%, var(--bg) 100%)",
              backgroundSize: "200% 100%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
