// Mobile Lighthouse run over the public routes, against the budget in
// budget.json. See ./README.md for what the numbers mean and how to run it.
//
// Lighthouse comes from `npx`, not from devDependencies: it pulls in Chrome
// tooling an order of magnitude larger than the site, and this runs by hand
// every so often rather than on every install.

import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = (process.env.PERF_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
const BUDGET = fileURLToPath(new URL("./budget.json", import.meta.url));
/** The score the catalogue and a product page have to clear. See issue #30. */
const MIN_SCORE = 90;

const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(BASE);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited ${code}\n${stderr.slice(-2000)}`)),
    );
  });
}

/**
 * The first piece in the run, so the product page measured is a real one
 * whatever the catalogue currently holds — a hard-coded `ref` would start
 * failing the day that piece is renamed or retired.
 */
async function firstProductPath(html) {
  const match = html.match(/href="(\/product\/[^"]+)"/);
  if (!match) throw new Error(`no product link found at ${BASE}`);
  return match[1].replace(/&amp;/g, "&");
}

/**
 * Whether a route is actually there to measure.
 *
 * `/course` is the one that can vanish: the CMS can retire the course, and the
 * route enforces that with a 404. Auditing it anyway does not fail — Lighthouse
 * scores the not-found page perfectly happily, it clears every budget by virtue
 * of being nearly empty, and the run reports a pass for a page that no longer
 * exists. A gate that green-lights the wrong page is worse than one route fewer.
 */
async function exists(route) {
  const res = await fetch(BASE + route, { redirect: "manual" });
  return res.ok;
}

/**
 * Fetch a route and every image derivative it references, so the measured run
 * isn't paying for a cold transform in the image optimiser. Only worth doing
 * locally; a deployed origin is warmed by its own CDN.
 */
async function warm(route) {
  const html = await (await fetch(BASE + route)).text();
  if (!isLocal) return html;
  const urls = new Set();
  for (const match of html.matchAll(
    /\/_next\/image\?url=[^"'\s]+?(?:&amp;|&)w=(\d+)(?:&amp;|&)q=\d+/g,
  )) {
    // The widths a phone actually picks; warming all the way to 3840 would
    // spend far longer than the run it is preparing.
    if (Number(match[1]) <= 1200) urls.add(match[0].replaceAll("&amp;", "&"));
  }
  await Promise.all(
    [...urls].map((url) => fetch(BASE + url).then((res) => res.arrayBuffer())),
  );
  return html;
}

async function audit(route, outDir) {
  const out = join(outDir, route.replace(/\W+/g, "_") + ".json");
  await run("npx", [
    "-y",
    // Pinned to the patch, not left on `lighthouse@12`. `npx -y` resolves the
    // range afresh on every run, so a floating major means the tool that
    // decides pass or fail can change between two runs of the same commit —
    // and the baselines in ./README.md are quoted against one version of it.
    // 12.8.2 is what `@12` resolves to today (13.x is `latest`), so pinning
    // changes no number here; it only stops the next 12.x from moving them.
    "lighthouse@12.8.2",
    BASE + route,
    "--only-categories=performance",
    "--form-factor=mobile",
    "--screenEmulation.mobile",
    "--throttling-method=simulate",
    "--output=json",
    `--output-path=${out}`,
    "--chrome-flags=--headless=new --no-sandbox",
    "--quiet",
  ]);
  return JSON.parse(await readFile(out, "utf8"));
}

/**
 * Check a report against the budget.
 *
 * Deliberately not Lighthouse's own `--budget-path`. That flag emits its
 * verdict as two audits, `performance-budget` and `timing-budget`, and
 * `--only-categories=performance` drops both — so the budget was passed in,
 * ignored, and nothing said so. A gate that cannot fail is worse than no gate,
 * and the check itself is a comparison against numbers already in the report.
 *
 * The file stays in Lighthouse's budget format, so it can still be handed to
 * `--budget-path` on a full run. Its single `/*` entry applies to every route.
 */
function overBudget(report, budget) {
  const failures = [];
  const summary = new Map(
    report.audits["resource-summary"].details.items.map((item) => [
      item.resourceType,
      item,
    ]),
  );

  for (const { resourceType, budget: max } of budget.resourceSizes ?? []) {
    const row = summary.get(resourceType);
    if (!row) continue;
    const kib = Math.round(row.transferSize / 1024);
    if (kib > max) failures.push(`${resourceType} ${kib} KiB (budget ${max})`);
  }

  for (const { resourceType, budget: max } of budget.resourceCounts ?? []) {
    const row = summary.get(resourceType);
    if (!row) continue;
    if (row.requestCount > max)
      failures.push(
        `${resourceType} ${row.requestCount} requests (budget ${max})`,
      );
  }

  for (const { metric, budget: max } of budget.timings ?? []) {
    const audit = report.audits[metric];
    if (!audit) continue;
    if (audit.numericValue > max)
      failures.push(`${metric} ${audit.displayValue} (budget ${max})`);
  }

  return failures;
}

const outDir = await mkdtemp(join(tmpdir(), "perf-"));
const [budget] = JSON.parse(await readFile(BUDGET, "utf8"));
let failed = false;

try {
  const home = await warm("/");
  const routes = ["/", await firstProductPath(home)];
  if (await exists("/course")) routes.push("/course");
  else console.log("skip   /course".padEnd(35) + "route not available");

  for (const route of routes) {
    if (route !== "/") await warm(route);
    const report = await audit(route, outDir);
    const score = Math.round(report.categories.performance.score * 100);
    const metric = (id) => report.audits[id].displayValue ?? "-";
    const broken = overBudget(report, budget);

    const bad = score < MIN_SCORE || broken.length > 0;
    failed ||= bad;
    console.log(
      `${bad ? "FAIL" : "ok  "} ${route.padEnd(28)} perf ${score}  ` +
        `LCP ${metric("largest-contentful-paint")}  ` +
        `CLS ${metric("cumulative-layout-shift")}  ` +
        `TBT ${metric("total-blocking-time")}`,
    );
    for (const line of broken) console.log(`       over budget — ${line}`);
    if (score < MIN_SCORE) console.log(`       score below ${MIN_SCORE}`);
  }
} finally {
  await rm(outDir, { recursive: true, force: true });
}

process.exit(failed ? 1 : 0);
