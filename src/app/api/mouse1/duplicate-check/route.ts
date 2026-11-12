import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fast sub-100ms similarity scoring
function computeSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Exact substring check
  if (s1.includes(s2) || s2.includes(s1)) {
    const ratio = Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    return Math.max(0.75, ratio);
  }

  // Word token overlap (Jaccard similarity)
  const words1 = new Set(s1.split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(s2.split(/\s+/).filter(w => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0.0;

  let intersection = 0;
  words1.forEach(w => {
    if (words2.has(w)) intersection++;
  });

  const unionSet = new Set<string>();
  words1.forEach(w => unionSet.add(w));
  words2.forEach(w => unionSet.add(w));

  const jaccard = unionSet.size > 0 ? intersection / unionSet.size : 0;

  // Dice coefficient on character bigrams for typo tolerance
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const bg1 = getBigrams(s1);
  const bg2 = getBigrams(s2);
  let bgIntersection = 0;
  bg1.forEach(bg => {
    if (bg2.has(bg)) bgIntersection++;
  });

  const dice = (bg1.size + bg2.size) > 0 ? (2 * bgIntersection) / (bg1.size + bg2.size) : 0;

  return Math.max(jaccard, dice);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await req.json();
    const { title, projectId, excludeIssueId } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({
        isDuplicate: false,
        matches: [],
        latencyMs: Date.now() - startTime,
      });
    }

    const trimmedTitle = title.trim();

    // Query existing issues in the project
    const issues = await prisma.issue.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(excludeIssueId ? { NOT: { id: excludeIssueId } } : {}),
      },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        priority: true,
        type: true,
      },
      take: 100,
    });

    const matches: Array<{
      id: string;
      key: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      similarity: number;
    }> = [];

    for (const issue of issues) {
      const similarity = computeSimilarity(trimmedTitle, issue.title);
      if (similarity >= 0.55) {
        matches.push({
          ...issue,
          similarity: Math.round(similarity * 100) / 100,
        });
      }
    }

    // Sort by highest similarity first
    matches.sort((a, b) => b.similarity - a.similarity);

    const highestSimilarity = matches[0]?.similarity || 0;
    const isDuplicate = highestSimilarity >= 0.65;

    return NextResponse.json({
      isDuplicate,
      highestSimilarity,
      matches: matches.slice(0, 3), // Return top 3 matches
      latencyMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("Mouse-1 duplicate check error:", error);
    return NextResponse.json(
      { isDuplicate: false, matches: [], error: error.message, latencyMs: Date.now() - startTime },
      { status: 500 }
    );
  }
}
