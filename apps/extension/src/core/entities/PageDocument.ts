/* ============================================================
   PAGE DOCUMENT — Entity for indexed page content
   ============================================================ */

export interface PageDocument {
  /** URL as the unique key */
  url: string;
  title: string;
  description: string;
  favicon: string;
  /** Cleaned body text (max 10k chars) */
  text: string;
  /** Auto-assigned category */
  category: PageCategory;
  /** Embedding vector (384-dim for all-MiniLM-L6-v2) */
  embedding?: number[];
  /** Timestamp when content was extracted */
  extractedAt: number;
  /** Timestamp when embedding was computed */
  embeddedAt?: number;
}

export type PageCategory =
  | 'tech'     // Stack Overflow, GitHub, docs
  | 'media'    // YouTube, Netflix, Twitch
  | 'social'   // Twitter/X, Reddit, Facebook
  | 'shopping' // Amazon, eBay
  | 'docs'     // Google Docs, Notion, Confluence
  | 'email'    // Gmail, Outlook
  | 'other';

/**
 * Classify a page URL + title into a category using keyword heuristics.
 * Fast and offline — no ML needed.
 */
export function classifyPage(url: string, title: string): PageCategory {
  const combined = `${url} ${title}`.toLowerCase();

  const rules: [PageCategory, RegExp][] = [
    ['tech',     /github\.com|stackoverflow\.com|gitlab\.com|bitbucket\.org|npmjs\.com|docs\.|developer\.|devdocs\.io|mdn\./],
    ['docs',     /docs\.google\.com|notion\.so|confluence|quip\.com|coda\.io|roamresearch|obsidian/],
    ['social',   /twitter\.com|x\.com|reddit\.com|facebook\.com|instagram\.com|linkedin\.com|threads\.net|mastodon/],
    ['media',    /youtube\.com|netflix\.com|twitch\.tv|spotify\.com|soundcloud\.com|vimeo\.com|disneyplus/],
    ['shopping', /amazon\.|ebay\.|shopify\.com|etsy\.com|aliexpress/],
    ['email',    /mail\.google\.com|outlook\.(live|office)\.com|proton\.me\/mail/],
  ];

  for (const [category, pattern] of rules) {
    if (pattern.test(combined)) return category;
  }
  return 'other';
}
