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

`/?view=grid` is the archive's other arrangement, added 2026-08-15 and measured
then. It is audited because Site Settings decides which of the two a bare `/`
renders, without a deploy — so the one that is *not* the default can drift over
budget and nothing would say so, and which one that is can change between two
runs of the same commit.

**It passes with no headroom worth the name: 3.0 s against a 3000 ms line.** The
grid puts a feature tile and its neighbours in the opening viewport where the
run puts one piece, and `loading="lazy"` does nothing for any of them, so this
is the route to check first after any change to the compositions in
`lib/grid-pattern.ts` — particularly one that fills the first row. The
compositions open sparse for exactly this reason.

Two things already paid for that headroom and should not be undone. The grid is
behind a dynamic import (`components/catalogue-view.tsx`) so the column view
never downloads it, and the compositions are built on first use rather than at
module load (`gridPatterns()`). Together they were worth 6 points, 70 ms of TBT
and 0.6 s of LCP **on `/`** — a route that was not even showing the grid.

Repeated runs land within about two points of those scores and ±0.3 s of the
LCP, so treat a single run's difference as noise and a five-point drop as real.

Two more things before reading anything into them.

Lighthouse's simulated throttling models a slow phone on a slow connection from
a trace taken on this machine at full speed, so the absolute times are a model,
not a measurement — the useful signal is the score and the shape of the LCP
breakdown, not the millisecond. And the `largest-contentful-paint` budget is set
at 3000ms rather than at the 2500ms that Core Web Vitals calls good, because
that is where the site sits today; tightening it is the goal, and lowering this
number is how that goal gets teeth.

The `font` count budget is 3 against a baseline of 2. Two files are preloaded
from the head — the latin subsets of Cormorant and Plex Mono — and a page whose
copy reaches into latin-ext pulls one more on demand, which is legitimate and
happens intermittently. A fourth means a weight was added in `app/layout.tsx`,
which is a decision worth noticing.

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
