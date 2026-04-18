/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useVariant, type Variant } from "./VariantContext";

const VARIANTS: { key: Variant; label: string }[] = [
  { key: "a", label: "Notebook" },
  { key: "b", label: "Stratum" },
  { key: "c", label: "Atlas" },
];

export function ChronographShell() {
  const { variant, setVariant } = useVariant();
  const pathname = usePathname();

  // Bind body class to variant
  useEffect(() => {
    const body = document.body;
    body.classList.remove("variant-a", "variant-b", "variant-c");
    body.classList.add("variant-" + variant);
  }, [variant]);

  const onMethodology = pathname?.startsWith("/methodology");

  return (
    <header className="chronograph-chrome">
      <div className="chronograph-brand">
        <Link href="/" className="chronograph-brand-link">
          <span className="chronograph-brand-dot" aria-hidden="true" />
          <span className="chronograph-brand-name">Chronograph</span>
          <span className="chronograph-brand-sub">
            Human History According to AI
          </span>
        </Link>
      </div>

      <nav className="chronograph-links" aria-label="Sections">
        <Link
          href="/methodology"
          className={"chronograph-link" + (onMethodology ? " on" : "")}
        >
          Methodology
        </Link>
      </nav>

      <div className="chronograph-spacer" />

      <nav className="chronograph-variants" aria-label="View">
        {VARIANTS.map((v) => (
          <button
            key={v.key}
            type="button"
            className={"chronograph-variant" + (variant === v.key ? " active" : "")}
            onClick={() => setVariant(v.key)}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
