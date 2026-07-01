/**
 * Course seed data — ported from the design prototype. Two courses share one
 * layout behind a toggle. `checkoutUrl` is intentionally null for now: the
 * Enrol buttons render but stay disabled until real checkout links exist.
 * Becomes CMS-backed in Phase 3.
 */

export interface CourseModule {
  no: string;
  title: string;
  body: string;
  duration: string;
}

export interface Course {
  key: string;
  label: string;
  headline: string;
  intro: string;
  price: string;
  meta: string;
  level: string;
  length: string;
  checkoutUrl: string | null;
  modules: CourseModule[];
  includes: string[];
}

/** Format fields shared by every course. */
export const courseFormat = {
  format: "Online · self-paced",
  access: "Lifetime + updates",
  files: "Project files included",
} as const;

export const courses: Course[] = [
  {
    key: "jewellery",
    label: "Jewellery",
    headline: "Design jewellery in 3D, from sketch to render.",
    intro:
      "The exact process I use in the studio — modelling signet rings, hardware and objects in 3D, then preparing them for casting. No prior CAD experience needed.",
    price: "£240",
    meta: "Lifetime access · 6 modules · 5.5 hours",
    level: "Beginner → intermediate",
    length: "6 modules · ~5.5 hrs",
    checkoutUrl: null, // placeholder: easytools.link/mattborowczyk-course
    modules: [
      { no: "01", title: "Getting set up", body: "Software, workspace and the core toolset. We start from zero.", duration: "40 min" },
      { no: "02", title: "Modelling a signet ring", body: "Band, shoulders and bezel — building a clean, castable ring.", duration: "70 min" },
      { no: "03", title: "Surfaces & detailing", body: "Chamfers, fillets and the finish decisions that read in metal.", duration: "55 min" },
      { no: "04", title: "Objects & hardware", body: "Take the method to buckles, cases and larger objects.", duration: "65 min" },
      { no: "05", title: "Rendering for clients", body: "Materials, lighting and turntables that sell the piece.", duration: "50 min" },
      { no: "06", title: "Preparing for casting", body: "Wall thickness, tolerances and a print-ready export.", duration: "50 min" },
    ],
    includes: [
      "Six on-demand video modules, watch in any order",
      "Project files and starter templates for every lesson",
      "A casting-prep checklist to take to your caster",
      "Lifetime access, including future updates",
    ],
  },
  {
    key: "grillz",
    label: "Grillz",
    headline: "Model custom grillz that actually fit.",
    intro:
      "A focused course on scanning, modelling and finishing custom grillz — from a dental impression to a cast-ready file. Built for jewellers moving into custom fronts.",
    price: "£280",
    meta: "Lifetime access · 6 modules · 4.5 hours",
    level: "Intermediate",
    length: "6 modules · ~4.5 hrs",
    checkoutUrl: null, // placeholder: easytools.link/mattborowczyk-grillz
    modules: [
      { no: "01", title: "Impressions & scanning", body: "From a dental impression to a clean, usable 3D scan.", duration: "35 min" },
      { no: "02", title: "Building the base", body: "Modelling caps that seat accurately on the teeth.", duration: "60 min" },
      { no: "03", title: "Fronts & fangs", body: "Open faces, closed faces and fang variations.", duration: "55 min" },
      { no: "04", title: "Stone settings", body: "Prong and channel settings that survive casting.", duration: "50 min" },
      { no: "05", title: "Finishing & fit", body: "Tolerances, polish and comfort along the gum line.", duration: "40 min" },
      { no: "06", title: "Casting & delivery", body: "Print-ready export and handing off to your caster.", duration: "30 min" },
    ],
    includes: [
      "Six on-demand video modules, watch in any order",
      "An impression-to-scan reference workflow",
      "Grillz base and stone-setting template files",
      "Lifetime access, including future updates",
    ],
  },
];
