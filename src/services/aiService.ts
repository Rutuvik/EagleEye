export interface ListingData {
  url: string;
  title: string;
  copy: string;
  price: string;
  discountedPrice?: string;
  reviews?: string;
  focusedFeatures?: string;
}

export interface OptimizedListing {
  titles: { text: string; score: number }[];
  bulletPoints: { text: string; score: number }[];
  description: string;
  searchTerms: string;
  overallListingScore: number;
  keywordRationale: { term: string; reason: string }[];
}

export interface VisualAudit {
  myVisualStrategy: string;
  competitorVisualStrategy: string;
  gapAnalysis: string;
  imageOptimizationPlan: {
    imageNumber: number;
    title: string;
    description: string;
    whyItWins: string;
    generationPrompt: string;
  }[];
  conversionTriggers: string[];
}

export interface CompetitorResearch {
  listingScore: number;
  pros: string[];
  cons: string[];
  keywordStrategy: string;
  conversionTactics: string;
  visualAudit: string;
  vulnerabilities: string;
  keywordAnalysis: { good: string[]; bad: string[] };
}

async function callAiBackend(payload: any) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "AI request failed");
  }
  return await response.json();
}

export async function chatWithAnalysis(
  history: { role: "user" | "model"; text: string }[],
  message: string
): Promise<string> {
  const messages = [
    {
      role: "system",
      content: "You are a Senior Amazon Marketplace Strategist. Be sharp, direct, and actionable. Avoid fluff. When using tables, use strict GFM Markdown."
    },
    ...history.map(h => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text
    })),
    { role: "user", content: message }
  ];

  const result = await callAiBackend({ action: "chat", messages });
  return result.text;
}

export async function generateOptimizedListing(
  originalListing: ListingData,
  analysisResult: string
): Promise<OptimizedListing> {
  const prompt = `
    You are a Senior Amazon SEO Specialist & Conversion Copywriter. 
    Based on the ORIGINAL LISTING and the deep ANALYSIS provided, generate a HIGH-PERFORMANCE, HIGH-CONVERTING fresh listing.
    
    ORIGINAL LISTING:
    - Title: ${originalListing.title}
    - Copy: ${originalListing.copy}
    - FOCUSED FEATURES: ${originalListing.focusedFeatures || "None"}
    
    ANALYSIS:
    ${analysisResult}
    
    Return the response as a JSON object strictly following this schema:
    {
      "titles": [{"text": "title string", "score": 0-100}],
      "bulletPoints": [{"text": "bullet string", "score": 0-100}],
      "description": "HTML description",
      "searchTerms": "keywords string",
      "overallListingScore": 0-100,
      "keywordRationale": [{"term": "keyword", "reason": "why"}]
    }
  `;

  const result = await callAiBackend({ action: "json", prompt });
  return JSON.parse(result.text);
}

export async function generateCompetitorResearch(
  competitorListing: ListingData,
  analysisResult: string
): Promise<CompetitorResearch> {
  const prompt = `
    You are a Senior Amazon Marketplace Analyst. 
    Audit the COMPETITOR LISTING based on the market analysis.
    
    COMPETITOR:
    - Title: ${competitorListing.title}
    - Copy: ${competitorListing.copy}
    
    MARKET CONTEXT:
    ${analysisResult}
    
    Return the response as a JSON object strictly following this schema:
    {
      "listingScore": 0-100,
      "pros": ["string"],
      "cons": ["string"],
      "keywordStrategy": "string",
      "keywordAnalysis": {"good": ["string"], "bad": ["string"]},
      "conversionTactics": "string",
      "visualAudit": "string",
      "vulnerabilities": "string"
    }
  `;

  const result = await callAiBackend({ action: "json", prompt });
  return JSON.parse(result.text);
}

export async function generateVisualAudit(
  myListing: ListingData,
  competitorListing: ListingData,
  analysisResult: string,
  myImages: { data: string; mimeType: string }[],
  compImages: { data: string; mimeType: string }[]
): Promise<VisualAudit> {
  const prompt = `
    You are a Senior Amazon Visual Strategist & Creative Director. 
    Analyze the ACTUAL IMAGES of MY PRODUCT vs the BEST-SELLING COMPETITOR.
    
    MY PRODUCT INFO: ${myListing.title}
    COMPETITOR INFO: ${competitorListing.title}
    
    GOAL: Perform a visual audit. Provide a 7-image storyboard to beat them.
    
    Return the response as a JSON object strictly following this schema:
    {
      "myVisualStrategy": "string",
      "competitorVisualStrategy": "string",
      "gapAnalysis": "string",
      "imageOptimizationPlan": [{"imageNumber": 1-7, "title": "string", "description": "string", "whyItWins": "string", "generationPrompt": "detailed prompt"}],
      "conversionTriggers": ["string"]
    }
  `;

  const result = await callAiBackend({ 
    action: "vision", 
    prompt, 
    images: [...myImages, ...compImages] 
  });
  return JSON.parse(result.text);
}

export async function analyzeListing(
  myListing: ListingData,
  competitorListings: ListingData[],
  currentKeywords?: string,
  additionalGoals?: string,
  uploadedKeywords?: string,
  toolType: string = "listing_optimization",
  visualBriefOptions?: {
    brandAesthetic?: string;
    emotionalHook?: string;
    directPrompt?: string;
  }
): Promise<string> {
  const prompt = `
    You are a Senior Amazon Growth Strategist. Analyze the following data for ${toolType}:
    
    OWN LISTING: ${myListing.title}
    COMPETITORS: ${competitorListings.map(c => c.title).join(", ")}
    CONTEXT: ${additionalGoals}
    KEYWORDS: ${currentKeywords}
    UPLOADED: ${uploadedKeywords}
    
    ${visualBriefOptions?.directPrompt ? `USER DIRECTIVE: ${visualBriefOptions.directPrompt}` : ""}
    
    Provide a comprehensive, high-impact growth strategy in Markdown format. Use tables for keyword data.
  `;

  const result = await callAiBackend({ action: "analyze", prompt });
  return result.text;
}
