/* @provenance: BORG-PROVENANCE-STANDARD-2026-03
 * @orchestrator: Magnus Smárason | smarason.is
 * @created: 2026-04-18
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useVariant, type Variant } from "./VariantContext";

const VARIANTS: { key: Variant; label: string; href: string }[] = [
  { key: "a", label: "Notebook", href: "/" },
  { key: "b", label: "Stratum", href: "/stratum" },
  { key: "c", label: "Atlas", href: "/?view=map" },
];

function deriveVariant(pathname: string | null, view: string | null): Variant {
  if (pathname?.startsWith("/stratum")) return "b";
  if (pathname === "/" && view === "map") return "c";
  return "a";
}

export function ChronographShell() {
  const { setVariant } = useVariant();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get("view");

  const currentVariant = deriveVariant(pathname, view);

  // Bind body class to variant (drives token swaps)
  useEffect(() => {
    const body = document.body;
    body.classList.remove("variant-a", "variant-b", "variant-c");
    body.classList.add("variant-" + currentVariant);
    setVariant(currentVariant);
  }, [currentVariant, setVariant]);

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
            className={
              "chronograph-variant" + (currentVariant === v.key ? " active" : "")
            }
            onClick={() => router.push(v.href)}
          >
            {v.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
