/* ============================================================
   PAGE INDEXER — Orchestrates extraction → classification → indexing
   ============================================================ */

import type { PageDocument } from '@/core/entities/PageDocument';
import { classifyPage } from '@/core/entities/PageDocument';
import { indexPage } from '@/infrastructure/search/searchIndex';

export interface ExtractedPagePayload {
  url: string;
  title: string;
  description: string;
  favicon: string;
  text: string;
  extractedAt: number;
}

/**
 * Process an extracted page: classify and index it.
 */
export async function processExtractedPage(payload: ExtractedPagePayload): Promise<PageDocument> {
  const category = classifyPage(payload.url, payload.title);

  const doc: PageDocument = {
    url: payload.url,
    title: payload.title,
    description: payload.description,
    favicon: payload.favicon,
    text: payload.text,
    category,
    extractedAt: payload.extractedAt,
  };

  await indexPage(doc);

  return doc;
}
