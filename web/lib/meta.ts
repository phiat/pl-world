// Small, client-safe constants and helpers (islands import this; keep it free of data imports).

export const REPO_URL = "https://github.com/phiat/pl-world";

/** The time axis shared by the River, the family tree and adoption curves. A constant rather than the clock,
 * because Cloudflare Workers report the epoch at module scope. Bump it each year. */
export const YEAR_FROM = 1955, YEAR_TO = 2026;

export const FAMILIES = [
  ["fortran", "Fortran", "#6f63d0"],
  ["cobol", "COBOL", "#9b7653"],
  ["basic", "BASIC", "#c9533f"],
  ["algol", "ALGOL", "#2f9585"],
  ["c", "C & BCPL", "#6d7c92"],
  ["smalltalk", "Smalltalk", "#c28a22"],
  ["lisp", "Lisp", "#3a9d5d"],
  ["ml", "ML", "#cf4f6c"],
  ["logic", "Logic", "#9a4e93"],
  ["array", "Array", "#3e8fc2"],
  ["stack", "Stack", "#8a6a3d"],
  ["query", "Query", "#d27b1f"],
  ["scripting", "Scripting", "#2f9fb8"],
] as const;

export const FAMILY: Record<string, { label: string; color: string }> = Object.fromEntries(
  FAMILIES.map(([id, label, color]) => [id, { label, color }]),
);
export const famColor = (family: string) => FAMILY[family]?.color ?? "#888";

export const CATEGORIES = [
  ["control", "Control", "#2c8c7f"],
  ["types", "Types", "#3b6fd1"],
  ["abstraction", "Abstraction", "#c27a17"],
  ["functional", "Functional", "#7c4fc6"],
  ["memory", "Memory", "#b9442f"],
  ["concurrency", "Concurrency", "#c23f8e"],
  ["metaprogramming", "Meta", "#4f8f2c"],
  ["paradigm", "Paradigm", "#8b6a2a"],
  ["syntax", "Syntax", "#5d6d7e"],
] as const;

export const CATEGORY: Record<string, { label: string; color: string }> = Object.fromEntries(
  CATEGORIES.map(([id, label, color]) => [id, { label, color }]),
);

/** Window skin for the Rosetta Desk, by the decade a language appeared. */
export type Era = "paper" | "crt" | "mac" | "dos" | "modern";
export const era = (year: number): Era =>
  year < 1970 ? "paper" : year < 1980 ? "crt" : year < 1990 ? "mac" : year < 2000 ? "dos" : "modern";

export type TraitLite = { level: "core" | "supported" | "library"; since?: number; version?: string; note?: string };
export type ConceptLite = {
  id: string;
  name: string;
  category: string;
  summary: string;
  origin: { lang?: string; external?: string; year: number; note?: string };
  popularized_by: string[];
};

export const normalizeOutput = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").trimEnd();
