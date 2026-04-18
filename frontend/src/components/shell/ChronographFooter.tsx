/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */

export function ChronographFooter() {
  return (
    <footer className="chronograph-footer">
      <div className="chronograph-footer-inner">
        <span className="chronograph-footer-brand">Chronograph</span>
        <span>
          Assembled by{" "}
          <a
            href="https://smarason.is"
            target="_blank"
            rel="noopener noreferrer"
            className="chronograph-footer-link"
          >
            Magnús Smári Smárason
          </a>
        </span>
        <span>
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="chronograph-footer-link"
          >
            Source &amp; corpus
          </a>
        </span>
        <span>
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            className="chronograph-footer-link"
          >
            Contribute
          </a>
        </span>
        <span className="chronograph-footer-meta">Vol. I · 5,226 entries</span>
        <span className="chronograph-footer-colophon">
          Claude Sonnet 4.6 · ICCRA schema · open source
        </span>
      </div>
    </footer>
  );
}
