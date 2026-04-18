/**
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 *
 * Next.js config — minimal, development-quality fixes only.
 *
 * 1. turbopack.root  — anchors the workspace root to frontend/ so Next
 *    doesn't pick up the orphan package-lock.json at the repo root.
 *    ESM: derive __dirname from import.meta.url; bare __dirname is
 *    undefined and silently poisons the root path.
 * 2. allowedDevOrigins — Next 16 blocks cross-origin dev-asset requests
 *    by default, which 403s the /__nextjs_font/ endpoint and breaks HMR
 *    when the dev server is reached via a LAN IP instead of localhost.
 */

import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import path from "node:path";

const thisDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: thisDir,
  },
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.54",
  ],
  async redirects() {
    return [
      // Legacy view-toggle URL — the Globe moved to its own /atlas route.
      { source: "/", has: [{ type: "query", key: "view", value: "map" }], destination: "/atlas", permanent: false },
    ];
  },
};

export default nextConfig;
