/**
 * The composed grid: where each piece lands, how large it is, and which cells
 * are deliberately left empty.
 *
 * This file is *data*, and that is the point of it. The arrangement is a design
 * decision, not an arrangement algorithm's opinion, so it is written out as
 * something you can read as a picture and edit by eye — one composition per
 * column count, because a composition that reads well at five columns is not
 * the same composition at two. Squeezing the wide one down produces a layout
 * whose gaps are an accident of wrapping, which is precisely what a deliberate
 * void is not.
 *
 * ── The notation ───────────────────────────────────────────────────────────
 *
 *   #   a piece, one cell
 *   F   a piece, two cells by two — the feature; this marks its top-left
 *   +   a cell covered by the feature above/left of it
 *   .   a deliberately empty cell
 *
 * Pieces are handed out in reading order, left to right and down, so the DOM
 * order of the tiles matches the catalogue's order (newest made first) and a
 * screen reader or a Tab key walks the grid in the same order the run would
 * present it. A 2×2 feature can put a piece visually below one that follows it
 * in the DOM; that is the one place the two orders come apart, and it is worth
 * far less than keeping the reading order truthful.
 *
 * Each pattern is a *cycle*. With more pieces than slots it repeats, offset by
 * its own height, so the arrangement continues rather than stopping. Cycles are
 * sized around 16–24 slots and deliberately differ in length between column
 * counts, so even at a catalogue large enough to repeat, the repeat lands in a
 * different place at every width.
 *
 * ── Why the first row is nearly empty ──────────────────────────────────────
 *
 * `loading="lazy"` does nothing for a tile above the fold — it defers what is
 * below it, and these are not. So the opening row's *tile count* is what the
 * opening viewport costs, and a void costs nothing at all. Every cycle here
 * opens on one feature plus at most one small piece: it is the most striking
 * composition of the four we looked at and also the cheapest to paint, which is
 * a rare direction for those two to point.
 *
 * Changing that means re-running `pnpm perf` against `/?view=grid`, not
 * assuming it is fine.
 */

/** Aspect ratio (width ÷ height) of the image in a cell, by token. */
const TILE_RATIOS: Record<string, number> = {
  // One ratio for every tile, matching the product page's `aspect-[4/5]` so a
  // piece does not change shape as you click through to it. The feature is the
  // same ratio at double scale — 2 columns wide by 2 rows tall lands a hair
  // wider than 4/5 once the gap between them is counted, which is what keeps
  // the rows of a lattice full of different-sized things aligned.
  "#": 0.8,
  F: 0.8,
};

export type GridSlot = {
  /** 0-based column of the slot's left edge. */
  col: number;
  /** 0-based row of the slot's top edge, within the cycle. */
  row: number;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
  /** Width ÷ height of the image drawn in this slot. */
  ratio: number;
};

export type GridPattern = {
  cols: number;
  /** Height of one cycle, in rows. */
  rows: number;
  slots: GridSlot[];
};

/**
 * Parse one composition from its picture.
 *
 * Validation throws rather than warning, and does so at module load — which
 * means a malformed pattern fails the build instead of shipping a grid with
 * tiles stacked on top of each other. A pattern is edited by hand and by eye;
 * the failure mode it needs protecting from is a typo, and a typo should be
 * loud.
 */
function pattern(cols: number, rows: readonly string[]): GridPattern {
  const cells = rows.map((row) => row.split(/\s+/).filter(Boolean));

  cells.forEach((row, r) => {
    if (row.length !== cols) {
      throw new Error(
        `grid pattern (${cols} columns): row ${r} has ${row.length} cells, expected ${cols}`,
      );
    }
  });

  const at = (r: number, c: number) => cells[r]?.[c];
  const slots: GridSlot[] = [];

  cells.forEach((row, r) => {
    row.forEach((token, c) => {
      if (token === "." || token === "+") return;

      const isFeature = token === "F";
      const ratio = TILE_RATIOS[token];
      if (ratio === undefined) {
        throw new Error(
          `grid pattern (${cols} columns): unknown token "${token}" at row ${r}, column ${c}`,
        );
      }

      if (isFeature) {
        // The three covered cells have to be spelled out rather than inferred.
        // Writing them keeps the picture honest — you can see the feature's
        // footprint in the text — and it is what catches a feature placed where
        // another piece already is, or one hanging off the right edge.
        const covered: [number, number][] = [
          [r, c + 1],
          [r + 1, c],
          [r + 1, c + 1],
        ];
        for (const [cr, cc] of covered) {
          if (at(cr, cc) !== "+") {
            throw new Error(
              `grid pattern (${cols} columns): feature at row ${r}, column ${c} needs "+" at row ${cr}, column ${cc} (found ${at(cr, cc) ?? "nothing"})`,
            );
          }
        }
      }

      slots.push({
        col: c,
        row: r,
        colSpan: isFeature ? 2 : 1,
        rowSpan: isFeature ? 2 : 1,
        ratio,
      });
    });
  });

  return { cols, rows: cells.length, slots };
}

/**
 * Two columns — phones.
 *
 * No feature at all. A feature spans both columns here, which makes it a
 * full-bleed image rather than a highlight — it stops reading as "this one
 * matters" and starts reading as "the layout broke". So the phone gets a plain
 * two-column grid whose only variation is where the voids fall.
 *
 * That is also the cheapest opening viewport in the set, which matters: this is
 * the width Lighthouse grades, and a full-width feature in the first rows cost
 * 8 points and 1.1s of LCP when it was tried.
 */
const COLUMNS_2 = () => pattern(2, [
  "# .",
  ". #",
  "# #",
  ". #",
  "# .",
  "# #",
  ". #",
  "# .",
  ". #",
  "# #",
]);

/**
 * Three columns — large phones in landscape, small tablets.
 *
 * Still no feature. At three columns a 2×2 takes two thirds of the width and
 * two rows of height, which is the same problem the phone has, only slightly
 * less severe. The variation comes entirely from the row templates.
 */
const COLUMNS_3 = () => pattern(3, [
  "# . #",
  ". # #",
  "# . .",
  ". # #",
  "# # .",
  "# . #",
  ". # .",
  "# # #",
]);

/**
 * Four columns — the narrower desktops, and a 1300–1400px window.
 *
 * The first width that gets a feature. Two free columns beside it is enough for
 * the band rule below to read as a band rather than as a leftover.
 */
const COLUMNS_4 = () => pattern(4, [
  "# . # .",
  "# . F +",
  ". . + +",
  "# . . #",
  "F + . #",
  "+ + . .",
  ". # # .",
  "# . # #",
]);

/**
 * Five columns.
 *
 * The band rule, stated once because every composition from here up obeys it:
 *
 *   - The **first row is always small pieces only.** A feature never opens the
 *     cycle; it arrives on the second row.
 *   - A feature occupies a 2×2 **band**. The columns beside it hold small
 *     pieces in *one* of the band's two rows, never split across both, with a
 *     void between them and the feature so the two never touch.
 *   - Which row the smalls take **alternates** band to band — top, then bottom.
 *   - The feature **alternates side** — right, then left — so features step
 *     diagonally down the composition rather than stacking in a column.
 *
 * Read as pictures, the two band forms at this width are `SSxBB` over `xxxBB`,
 * and `BBxxx` over `BBxSS`.
 */
const COLUMNS_5 = () => pattern(5, [
  "# . # . #",
  "# # . F +",
  ". . . + +",
  "# . # . #",
  "F + . . .",
  "+ + . # #",
  ". # . # .",
  "# . # # .",
]);

/**
 * Six columns — the last step. Past this the grid stops widening and centres.
 *
 * Same band rule as five. With four free columns beside the feature the smalls
 * get a little more room to be arranged, so the two bands here are `SxxxBB`
 * over `xSSxBB`, and `BBxxxS` over `BBxSSx`.
 */
const COLUMNS_6 = () => pattern(6, [
  "# . # . # .",
  "# . . . F +",
  ". # # . + +",
  "# . # . # .",
  "F + . . . #",
  "+ + . # # .",
  ". # . # . #",
  "# . # . # .",
]);

/**
 * Every composition, by column count, built on first use.
 *
 * The order is the ladder from `globals.css`: 2 / 3 / 4 / 5 / 6, chosen so a
 * tile stays in a 190–290px band at every step. The container queries there and
 * the entries here have to stay in step — a breakpoint added in one place and
 * not the other leaves a width with no composition to draw.
 *
 * Built lazily rather than at module load, which is a performance decision and
 * not a style. Parsing five pictures means splitting and validating some sixty
 * rows, and as a module-level constant that ran on import — on the main thread,
 * during hydration, for anyone who happened to pull this module in. The grid is
 * already behind a dynamic import for the same reason; this is the half of the
 * cost that a code-split alone would not have moved, since a chunk that is
 * fetched is a chunk that is also initialised.
 */
let patterns: readonly GridPattern[] | null = null;

export function gridPatterns(): readonly GridPattern[] {
  patterns ??= [COLUMNS_2(), COLUMNS_3(), COLUMNS_4(), COLUMNS_5(), COLUMNS_6()];
  return patterns;
}

/** One piece's placement within a given composition. */
export type GridPlacement = GridSlot;

/**
 * Where the `index`-th piece sits in `pattern`.
 *
 * Past the end of the cycle the composition repeats, pushed down by its own
 * height — so the arrangement continues with the same rhythm rather than
 * running out.
 */
export function placement(pattern: GridPattern, index: number): GridPlacement {
  const { slots, rows } = pattern;
  const slot = slots[index % slots.length];
  const cycle = Math.floor(index / slots.length);
  return { ...slot, row: slot.row + cycle * rows };
}

/**
 * How many rows `count` pieces occupy in this composition.
 *
 * Taken from the placements rather than from the arithmetic, because the last
 * cycle is usually partial and a feature in it is two rows tall: the tallest
 * piece placed decides the height, not the last one.
 */
export function rowCount(pattern: GridPattern, count: number): number {
  let rows = 0;
  for (let i = 0; i < count; i++) {
    const slot = placement(pattern, i);
    rows = Math.max(rows, slot.row + slot.rowSpan);
  }
  return rows;
}
