/** Normalize text for case-insensitive search */
export function normalizeSearch(q: string): string {
  return q.toLowerCase().trim();
}

export function matchesQuery(text: string | undefined | null, query: string): boolean {
  if (!query) return true;
  return (text ?? '').toLowerCase().includes(query);
}

export function matchesDate(date: Date, query: string): boolean {
  if (!query) return true;
  const d = date.toLocaleDateString().toLowerCase();
  const iso = date.toISOString().slice(0, 10);
  return d.includes(query) || iso.includes(query);
}
