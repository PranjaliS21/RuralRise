export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "item";

export function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  return (async () => {
    const root = slugify(base);
    let slug = root;
    let i = 2;
    while (await exists(slug)) slug = `${root}-${i++}`;
    return slug;
  })();
}

export const clampInt = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export const nowPlusDays = (d: number) => new Date(Date.now() + d * 86400000);

export const toPercent = (n: number) => clampInt(Math.round(n), 0, 100);
