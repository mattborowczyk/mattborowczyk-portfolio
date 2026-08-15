# Performance budget

`budget.json` is a [Lighthouse budget](https://developer.chrome.com/docs/lighthouse/performance/performance-budgets)
applied to every public route by `pnpm perf`. It is a **regression guard, not a
certificate**: the numbers are the ones the site actually hit on 2026-08-10 plus
enough headroom that ordinary variance doesn't trip it, so a failure means
something changed rather than something is merely imperfect.

Measured then, mobile, against a local production build (Lighthouse 12,
simulated Slow 4G):

| route             | perf | FCP   | LCP   | TBT   | CLS | transfer |
| ----------------- | ---- | ----- | ----- | ----- | --- | -------- |
| `/`               | 96   | 0.8 s | 2.8 s | 40 ms | 0   | 377 KiB  |
| `/?view=grid`     | 95   | —     | 3.0 s | 0 ms  | 0   | —        |
| `/product/[ref]`  | 96   | 0.8 s | 2.8 s | 30 ms | 0   | 304 KiB  |
| `/course`         | 97   | 0.8 s | 2.6 s | 60 ms | 0   | 276 KiB  |

`/?view=grid` is the archive's other arrangement, added 2026-08-15. It is
audited because Site Settings decides which of the two a bare `/` renders,
without a deploy — so the one that is *not* the default can drift over budget
and nothing would say so, and which one that is can change between two runs of
the same commit.

### Re-measured 2026-08-15, and what it showed

The table above is from 2026-08-10 and **has drifted**. Measured again on
2026-08-15, `main` itself is over the LCP line on two routes:

| route            | `main`             | with the grid      |
| ---------------- | ------------------ | ------------------ |
| `/`              | 94 · LCP 3.1 s     | 96 · LCP 2.8 s     |
| `/?view=grid`    | —                  | 97 · LCP 2.6 s     |
| `/product/[ref]` | 93 · LCP 3.2 s     | 98 · LCP 2.4 s     |
| `/course`        | 97 · LCP 2.6 s     | 96 · LCP 2.8 s     |

CLS is 0 everywhere in both columns. The `main` figures are the honest baseline
for judging anything measured now, and they say the 3000 ms budget no longer
reflects the site: real photography has replaced the placeholder tones since
August 10th. **Re-baselining the table is outstanding work, and is not the
grid's to do.**

Read the differences with suspicion rather than pride. `/product/[ref]` is
0.8 s apart between the two columns and the grid changes almost nothing on that
route — which is a plain statement that run-to-run variance on this machine is
wider than the ±0.3 s claimed above, not that anything got faster. What the
numbers do support is the narrower claim: adding the grid did not make the
existing routes worse.

### Two things the grid learned the hard way

**Measure against a server you have proved is serving the build you think.**
Every number in the first pass of this work was wrong, in both directions,
because `pnpm start` had failed with `EADDRINUSE` and a server from an earlier
build was answering on port 3000 — happily serving prerendered HTML from a
`.next` that had since been rebuilt underneath it. It reported a regression that
did not exist and then a fix that fixed nothing. Check for `Ready in` in the
server's output, and check that the page's `webpack-*.js` is a file that exists
in the current `.next/static/chunks`.

**Do not `next/dynamic` the grid.** Code-splitting it looks obviously right and
is actively harmful, because the arrangement can be what `/` prerenders: the
server sends the grid's markup, hydration has no chunk for it yet and renders
the `loading` state instead, and the grid vanishes and comes back. That measured
as CLS 0.13 on a route that is otherwise 0, and as an LCP whose image had
arrived in 69 ms and then waited 2.6 s to paint. The note in
`components/catalogue-view.tsx` says so at the call site.

### The lever, when the grid is over budget

The compositions in `lib/grid-pattern.ts`, and the **first row of the narrowest
one** before anything else. A void costs nothing to paint, so an opening row's
tile count is what the opening viewport costs; `loading="lazy"` buys nothing for
any of it, because none of it is below the fold.

The two-column composition originally opened on a feature, which spans both
columns and is therefore a full-bleed image on a phone — the largest possible
LCP element on the device Lighthouse grades. Opening on a single half-width tile
instead was worth **8 points and 1.1 s of LCP** (89 → 97, 3.7 s → 2.6 s) and no
loss anyone could see. The wider compositions keep their feature in the first
row, where it is one element among several rather than the whole screen.

## Running it

In one terminal, build and start the production server, and wait for Next to
report it is listening (`✓ Ready in …`):

```bash
pnpm build
pnpm start
```

Then, in a second terminal:

```bash
pnpm perf
```

Two terminals rather than `pnpm start &` followed straight by `pnpm perf`:
backgrounding the server returns the prompt immediately, but Next has not bound
the port yet, so the audit's first request loses the race and the run dies on a
connection refused before it has measured anything.

`pnpm perf` drives Lighthouse through `npx` (nothing is added to the
dependencies), one run per route, and exits non-zero if any route scores under
90 or breaks a budget line. Point it somewhere else with `PERF_URL`:

```bash
PERF_URL=https://mattborowczyk.com pnpm perf
```

Against a local server it warms each route first — including the `/_next/image`
derivatives the page asks for — because the optimiser transforms on demand and
the first visit would otherwise be timing image processing rather than the page.
A deployed target is warmed by its own CDN and is skipped.

Not wired into CI: CI builds with no Sanity credentials, so it renders the local
seed, which has no media at all — the run would measure a version of the site
with none of the images whose weight this is here to watch.
