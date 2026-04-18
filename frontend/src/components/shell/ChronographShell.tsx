/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useVariant, type Variant } from "./VariantContext";

const VIEWS: { key: Variant; label: string; href: string; path: string }[] = [
  { key: "a", label: "Notebook", href: "/", path: "/" },
  { key: "b", label: "Stratum", href: "/stratum", path: "/stratum" },
  { key: "c", label: "Atlas", href: "/atlas", path: "/atlas" },
];

function deriveBodyVariant(pathname: string | null): Variant {
  if (pathname?.startsWith("/stratum")) return "b";
  // Atlas page keeps the surrounding shell on Notebook tokens; only the
  // globe canvas inside is dark.
  return "a";
}

function deriveActiveView(pathname: string | null): Variant {
  if (pathname?.startsWith("/stratum")) return "b";
  if (pathname?.startsWith("/atlas")) return "c";
  return "a";
}

/** Routes where the view switcher applies. On year/era/methodology/error
 * routes the switcher is hidden because it would push the user out of the
 * current reading context. */
function showsViewSwitcher(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/" ||
    pathname.startsWith("/stratum") ||
    pathname.startsWith("/atlas")
  );
}

export function ChronographShell() {
  const { setVariant } = useVariant();
  const pathname = usePathname();

  const bodyVariant = deriveBodyVariant(pathname);
  const activeView = deriveActiveView(pathname);
  const switcherVisible = showsViewSwitcher(pathname);

  useEffect(() => {
    const body = document.body;
    body.classList.remove("variant-a", "variant-b", "variant-c");
    body.classList.add("variant-" + bodyVariant);
    setVariant(activeView);
  }, [bodyVariant, activeView, setVariant]);

  const onMethodology = pathname?.startsWith("/methodology");

  return (
    <>
      {/* Primary nav — brand + site-wide links. Always visible, one layer. */}
      <header className="chronograph-chrome chronograph-chrome-primary">
        <Link href="/" className="chronograph-brand-link">
          <span className="chronograph-brand-dot" aria-hidden="true" />
          <span className="chronograph-brand-name">Chronograph</span>
        </Link>

        <div className="chronograph-spacer" />

        <nav className="chronograph-links" aria-label="Site">
          <Link
            href="/methodology"
            className={"chronograph-link" + (onMethodology ? " on" : "")}
          >
            Methodology
          </Link>
          <a
            href="https://github.com/Magnussmari/Human_history_Acording_to_AI"
            target="_blank"
            rel="noopener noreferrer"
            className="chronograph-link chronograph-link-external"
            aria-label="View source on GitHub"
          >
            GitHub <ExternalLink size={12} aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* Secondary nav — view switcher. Only on the three interactive
          section routes (home, stratum, atlas). Reading routes — year, era,
          methodology — don't show it. */}
      {switcherVisible && (
        <div className="chronograph-chrome chronograph-chrome-secondary">
          <div className="chronograph-subtitle">
            Human History According to AI
          </div>
          <div className="chronograph-spacer" />
          <nav className="chronograph-variants" aria-label="View">
            {VIEWS.map((v) => (
              <Link
                key={v.key}
                href={v.href}
                className={
                  "chronograph-variant" + (activeView === v.key ? " active" : "")
                }
                scroll={false}
                prefetch
              >
                {v.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
