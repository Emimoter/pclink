import { Product } from "@/types/product";
import { getCategoryName } from "./categories";

/**
 * Calculates a relevance score for a product based on a search query.
 * Higher score means more relevant.
 * 
 * Priority:
 * 1. Name Match (Highest: 100-180 points)
 * 2. Category Match (Medium: 50-75 points)
 * 3. Description Match (Lowest: 10-15 points)
 */
export function getRelevanceScore(product: Product, query: string): number {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  
  const name = product.name ? String(product.name).toLowerCase() : "";
  const desc = product.description ? String(product.description).toLowerCase() : "";
  const categoryId = product.category ? String(product.category).toLowerCase() : "";
  
  const categoryName = product.category ? getCategoryName(product.category).toLowerCase() : "";
  const subCategory = product.subCategory ? String(product.subCategory).toLowerCase() : "";

  let score = 0;

  // 1. Prioritize NAME matches
  if (name.includes(q)) {
    score += 100;
    // Extra boost if name starts with query
    if (name.startsWith(q)) {
      score += 50;
    }
    // Extra boost if query matches a whole word
    // Escape regex special characters to be safe
    const escapedQuery = q.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    const wordRegex = new RegExp(`\\b${escapedQuery}\\b`);
    if (wordRegex.test(name)) {
      score += 30;
    }
  }

  // 2. Prioritize CATEGORY matches
  if (categoryId.includes(q) || categoryName.includes(q) || subCategory.includes(q)) {
    score += 50;
    if (categoryId === q || categoryName === q) {
      score += 25; // exact category match
    }
  }

  // 3. Prioritize DESCRIPTION matches
  if (desc.includes(q)) {
    score += 10;
    const escapedQuery = q.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
    const wordRegex = new RegExp(`\\b${escapedQuery}\\b`);
    if (wordRegex.test(desc)) {
      score += 5;
    }
  }

  return score;
}
