/* ============================================================
   GRAPH BUILDER — Builds + scores the browsing graph
   ============================================================ */

import type { GraphNode, GraphEdge } from '@/core/entities/Graph';
import { extractDomain, computeScore } from '@/core/entities/Graph';
import * as graphStore from '@/infrastructure/db/graphStore';

/**
 * Record a page visit. Creates or updates the node.
 */
export async function recordPageVisit(
  url: string,
  title: string,
  favicon: string,
  category: string
): Promise<void> {
  // Skip non-http
  if (!url.startsWith('http')) return;

  const existing = await graphStore.getNode(url);
  const domain = extractDomain(url);
  const visits = (existing?.visits ?? 0) + 1;

  const node: GraphNode = {
    id: url,
    title: title || existing?.title || url,
    favicon: favicon || existing?.favicon || '',
    category: category || existing?.category || 'other',
    domain,
    visits,
    lastVisit: Date.now(),
    score: 0, // computed below
    cluster: domain, // cluster by domain
  };

  // Get edge count for this node
  const allEdges = await graphStore.getAllEdges();
  const linkCount = allEdges.filter((e) => e.source === url || e.target === url).length;
  node.score = computeScore(visits, node.lastVisit, linkCount);

  await graphStore.upsertNode(node);
}

/**
 * Record a navigation transition from one page to another.
 */
export async function recordNavigation(fromUrl: string, toUrl: string): Promise<void> {
  if (!fromUrl.startsWith('http') || !toUrl.startsWith('http')) return;
  if (fromUrl === toUrl) return;
  await graphStore.recordTransition(fromUrl, toUrl);
}

/**
 * Get the full graph data for visualization.
 * Returns nodes with re-computed scores and edges.
 */
export async function getGraphData(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const [nodes, edges] = await Promise.all([
    graphStore.getAllNodes(),
    graphStore.getAllEdges(),
  ]);

  // Re-compute scores with current edge data
  for (const node of nodes) {
    const linkCount = edges.filter((e) => e.source === node.id || e.target === node.id).length;
    node.score = computeScore(node.visits, node.lastVisit, linkCount);
  }

  // Sort by score descending
  nodes.sort((a, b) => b.score - a.score);

  return { nodes, edges };
}

/**
 * Get cluster metadata: group nodes by domain.
 */
export function buildClusters(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const clusters = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    const group = clusters.get(node.cluster) ?? [];
    group.push(node);
    clusters.set(node.cluster, group);
  }
  return clusters;
}
