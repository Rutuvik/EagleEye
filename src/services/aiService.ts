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
      content: "You are a Senior Amazon Marketplace Strategist. Be sharp, direct, and actionable. NEVER include internal reasoning, thinking tags, or conversational filler. provide the report directly. Use strict GFM Markdown."
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
    You are a World-Class Amazon SEO Architect and Conversion Copywriter who has managed over $100M in marketplace sales. 
    Your goal is to build the absolute best Amazon listing for the provided product, outperforming all competitors in both CTR (Click-Through Rate) and CVR (Conversion Rate).
    STRICT COMPLIANCE: Do NOT include any 'thinking' process, preambles, or conversational filler. Return ONLY the JSON.

    ORIGINAL LISTING CONTEXT:
    - Current Title: ${originalListing.title}
    - Current Copy: ${originalListing.copy}
    - Current Price: ${originalListing.price}
    - Current Reviews: ${originalListing.reviews || "N/A"}
    - Key Features: ${originalListing.focusedFeatures || "General optimization requested"}
    
    DEEP MARKET ANALYSIS:
    ${analysisResult}
    
    INSTRUCTIONS FOR GENERATION:
    1. TITLES: Provide 5 distinct, high-impact titles. 
       - Each title MUST be between 150-180 characters to maximize SEO keyword richness and search engine discoverability.
       - Use sophisticated, professional, and high-impact vocabulary that commands authority and attention.
       - One optimized for SEO (keyword dense, technical precision).
       - One optimized for Psychological Impact (benefit-driven narratives, emotional resonance).
       - One optimized for Mobile (punchy, high-impact first 80 chars, but fully extended to 150-180 total).
       - Two Hybrid options that seamlessly balance Brand Prestige with SEO requirements.
    2. BULLET POINTS: Write 5-7 premium, exhaustive, and deeply persuasive bullet points. 
       - Use an advanced lexicon featuring "hard words" and sophisticated descriptors (e.g., ergonomic, unparalleled, meticulous, avant-garde, resilient, quintessential, industrial-grade, revolutionary, handcrafted) to target high-intent, premium-tier customers. 
       - Each bullet point MUST be substantial, spanning roughly 350-500 characters (designed to appear as 2-3 full lines in a standard desktop layout) to provide deep value and trust.
       - Include a highly relevant [Emoji] at the start of each. 
       - Follow the "CORE FEATURE: STRATEGIC BENEFIT" structure. 
       - Address specific market objections with authoritative, evidence-based reasoning.
    3. DESCRIPTION: Provide a long-form, rich-text description. Include sections for "What's in the Box", "Technical Specifications", "Brand Promise", and "Usage Tips". Use HTML tags for formatting.
    4. SEARCH TERMS: Provide a 250-character Backend Search Term string. Use only the most relevant high-volume terms without repetition.
    5. KEYWORD RATIONALE: Explain the strategic choice for at least 10 key terms used, detailing their search intent and competitive difficulty.

    Return the response as a JSON object strictly following this schema:
    {
      "titles": [{"text": "string", "score": 0-100}],
      "bulletPoints": [{"text": "string", "score": 0-100}],
      "description": "string (HTML formatting)",
      "searchTerms": "string",
      "overallListingScore": 0-100,
      "keywordRationale": [{"term": "string", "reason": "string"}]
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
    You are a Senior Amazon Marketplace Intelligence Analyst specializing in Adversarial Research. 
    Your task is to deconstruct this competitor's listing to find every vulnerability and tactical advantage they have.
    STRICT COMPLIANCE: Do NOT include any 'thinking' process or conversational filler. Return ONLY the JSON content.

    COMPETITOR TO AUDIT:
    - Title: ${competitorListing.title}
    - Copy: ${competitorListing.copy}
    - Price: ${competitorListing.price}
    - Reviews: ${competitorListing.reviews || "N/A"}
    
    MARKET CONTEXT:
    ${analysisResult}
    
    INSTRUCTIONS:
    1. LISTING SCORE: Be brutally honest (0-100). If it's a weak listing, score it 30-50. If it's dominant, 85-95. Factor in keyword strategy and psychological triggers.
    2. PROS/CONS: List at least 8 detailed pros and 8 detailed cons. Focus on copywriting, image strategy (infer from context), and SEO gaps.
    3. KEYWORD STRATEGY: Define exactly what high-volume terms they are likely ranking for vs what they are missing. Use your industry expertise to provide realistic estimates.
    4. VULNERABILITIES: Identify 5 specific, actionable ways we can "steal" their customers or outrank them in 30 days.
    5. CONVERSION TACTICS: What specific psychology are they using? (Scarcity, Social Proof, Authority, Risk Reversal?) Analyze their pricing strategy in detail.

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
    You are a World-Class Creative Director for Amazon Brands. 
    Analyze the visual identity of MY PRODUCT vs the MARKET LEADER.
    STRICT COMPLIANCE: Do NOT include any 'thinking' tags or internal reasoning. Return ONLY the JSON.
    
    MY PRODUCT INFO: ${myListing.title}
    COMPETITOR INFO: ${competitorListing.title}
    
    TASK:
    1. Analyze the "Visual Vibe" of both listings. Are they premium? Budget? Scientific? 
    2. Perform a "7-Image Kill-Switch Strategy". This is a sequence of 7 images designed to convert the customer instantly:
       - Image 1: The Hero (Main image)
       - Image 2: The Lifestyle (Emotional hook)
       - Image 3: The Infographic (Key USP)
       - Image 4: The Comparison (Us vs Them)
       - Image 5: The "What's inside" (Unboxing experience)
       - Image 6: The Trust (Certifications/Reviews)
       - Image 7: The "Call to Action" (Brand Story)
    
    Return the response as a JSON object strictly following this schema:
    {
      "myVisualStrategy": "string (detailed analysis)",
      "competitorVisualStrategy": "string (detailed analysis)",
      "gapAnalysis": "string (what images are they using that we aren't?)",
      "imageOptimizationPlan": [{"imageNumber": 1-7, "title": "string", "description": "detailed visual description for a designer", "whyItWins": "psychological reason", "generationPrompt": "highly detailed midjourney-style image prompt"}],
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
    You are a Senior Amazon Growth Strategist specializing in Market Dominance. 
    You are performing a DEEP ${toolType.toUpperCase().replace('_', ' ')} audit.
    STRICT COMPLIANCE: DO NOT include any 'thinking' tags, <think> blocks, or internal reasoning in your output. Start the report immediately. Use data-driven analysis based ON THE PROVIDED INPUT.

    INPUT DATA:
    - PRIMARY PRODUCT: ${myListing.title} (Price: ${myListing.price})
    - COMPETITORS: ${competitorListings.map(c => `${c.title} (Price: ${c.price}, Link: ${c.url})`).join(" | ")}
    - EXTERNAL CONTEXT: ${additionalGoals || "None provided"}
    - TARGET KEYWORDS: ${currentKeywords || "Generate from industry standards"}
    - HELIUM10/RAW DATA: ${uploadedKeywords || "None provided"}
    
    ${visualBriefOptions?.brandAesthetic ? `BRAND AESTHETIC: ${visualBriefOptions.brandAesthetic}` : ""}
    ${visualBriefOptions?.emotionalHook ? `EMOTIONAL HOOK: ${visualBriefOptions.emotionalHook}` : ""}
    ${visualBriefOptions?.directPrompt ? `SPECIAL USER DIRECTIVE: ${visualBriefOptions.directPrompt}` : ""}

    REQUIREMENTS FOR THE OUTPUT (MUST BE EXHAUSTIVE, DETAILED, AND POSSESS AN ELITE PROFESSIONAL TONE):
    1. EXECUTIVE SUMMARY: A high-level, 400+ word deep-dive strategic analysis. Evaluate the market dominance opportunity, tactical vulnerabilities of incumbents, and our precise "Growth Gap". Use complex market vocabulary and avoid common phrasing.
    2. COMPETITIVE LANDSCAPE: A highly detailed table comparing us to the top 3-5 competitors. Analyze Price elasticity, Review velocity, unique value propositions (USPs), SEO technical quality, visual conversion strategy. 
       - CRITICAL: For the "Competitor Link" column, you MUST use the exact, literal URL provided in the input data for that specific competitor. DO NOT modify, shorten, or hallucinate a link structure. If no link is provided for a competitor, leave it blank or use "N/A".
    3. PSYCHOGRAPHIC MAPPING: Create a master-level "Customer Avatar" profile (250+ words). Map out subconscious lifestyle triggers, visceral frustrations, aspirational goals, and the precise emotional frequency required for conversion.
    4. KEYWORD GAPS: Identify 30-40 targeted keywords. Categorize by search intent (High-Intent Acquisition, Informational Browsing, Competitive Theft). Include search volume estimates based on industry benchmarks.
    5. SEO S.W.O.T ANALYSIS: An uncompromising deconstruction of Strengths, Weaknesses, Opportunities, and Threats for both copy and visual conversion assets.
    6. THE "WINNING FORMULA": provide a 30-day "Blitz" action plan. Include precise PPC bidding methodologies, social architecture for social proof, and CRO (Conversion Rate Optimization) hacks.

    Use strict GFM Markdown. Use Bold, Italics, and complex Tables to make it look like a $5,000 professional audit report. 
    BE EXHAUSTIVE. If data is missing (e.g. competitor conversion rates), use your expert knowledge of the industry and category benchmarks to provide HIGHLY PROBABLE and ACCURATE industry-standard estimates. NEVER use placeholders like "[Insert Data Here]". Always fill in the gaps with realistic expert data.
  `;

  const result = await callAiBackend({ action: "analyze", prompt });
  return result.text;
}
