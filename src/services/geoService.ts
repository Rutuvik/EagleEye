import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRetryable = 
        error?.status === "UNAVAILABLE" || 
        error?.status === "RESOURCE_EXHAUSTED" ||
        error?.code === 503 || 
        error?.code === 429 ||
        (error?.message && error.message.toLowerCase().includes("high demand")) ||
        (error?.message && error.message.toLowerCase().includes("temporary")) ||
        (error?.message && error.message.toLowerCase().includes("timeout")) ||
        (error?.message && error.message.toLowerCase().includes("deadline exceeded"));

      if (isRetryable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API busy (GEO Lab). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      console.error("Gemini API Error (GEO Lab):", error);
      throw error;
    }
  }
  throw lastError;
}

export interface GEOContentAudit {
  geoScore: number;
  factualDensity: number;
  citationPotential: number;
  directAnswerClarity: number;
  eeatScore: number;
  analysis: string;
  recommendations: {
    type: "content" | "technical" | "authority";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
  }[];
  aiSimulation: {
    query: string;
    aiResponse: string;
    citationStatus: "cited" | "not_cited" | "partial";
    reasoning: string;
  }[];
  brutalHonesty: string;
  roadmapToTop: {
    step: string;
    priority: "critical" | "high" | "medium";
    timeframe: string;
  }[];
}

export interface GEOMarketAudit {
  marketIntent: {
    topQueries: {
      query: string;
      volume: "high" | "medium" | "low";
      intent: "informational" | "transactional" | "comparative";
    }[];
    featureProbability: {
      feature: string;
      probability: number;
      reason: string;
    }[];
    topicAlignment: {
      topic: string;
      relevance: number;
      gap: "high" | "medium" | "low";
    }[];
  };
  citationGap: {
    liveCitedBrands: string[];
    authoritySources: {
      source: string;
      url: string;
      reason: string;
    }[];
    gapScore: number;
    blueprint: string;
  };
}

export type GEOAuditResult = GEOContentAudit & Partial<GEOMarketAudit>;

export async function performContentAudit(
  data: {
    type: "website" | "marketplace";
    platform?: string;
    title?: string;
    bullets?: string;
    description?: string;
    url?: string;
    content?: string;
    competitorContext?: string;
  }
): Promise<GEOContentAudit> {
  const model = "gemini-3-flash-preview";

  const contextInfo = data.type === "marketplace" 
    ? `MARKETPLACE DATA (${data.platform}):
       - Title: ${data.title}
       - Bullets: ${data.bullets}
       - Description: ${data.description}`
    : `WEBSITE DATA:
       - URL: ${data.url}
       - Content: ${data.content}`;

  const prompt = `
    You are a Generative Engine Optimization (GEO) Expert. 
    Perform a deep CONTENT AUDIT of this ${data.type === "marketplace" ? "product listing" : "website"}.
    
    AUDIT CONTEXT:
    ${contextInfo}

    AUDIT REQUIREMENTS:
    1. GEO Score (0-100): Overall AI-readiness.
    2. Factual Density (0-100): Ratio of hard data/specs to marketing fluff.
    3. Citation Potential (0-100): How "cite-able" the facts are.
    4. Direct Answer Clarity (0-100): How well it answers specific user intent questions.
    5. E-E-A-T Score (0-100): Signals of expertise, authority, and trust.
    6. Detailed Analysis: A breakdown of why the scores are what they are.
    7. Recommendations: 3 specific, actionable steps to improve GEO.
    8. AI Simulation: Simulate 2 high-intent user queries and how an AI would respond based ONLY on this data.
    9. Brutal Honesty & Roadmap to #1: Be blunt. If it's weak, say it. Provide a prioritized roadmap.

    STRICT JSON OUTPUT:
    Return the result in the following JSON structure.
  `;

  const response = await withRetry(() => {
    const contents = data.url 
      ? `Please audit the following website: ${data.url}\n\n${prompt}`
      : prompt;

    return Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: data.url ? [{ urlContext: {} }] : undefined,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              geoScore: { type: Type.NUMBER },
              factualDensity: { type: Type.NUMBER },
              citationPotential: { type: Type.NUMBER },
              directAnswerClarity: { type: Type.NUMBER },
              eeatScore: { type: Type.NUMBER },
              analysis: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, enum: ["content", "technical", "authority"] },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impact: { type: Type.STRING, enum: ["high", "medium", "low"] }
                  },
                  required: ["type", "title", "description", "impact"]
                }
              },
              aiSimulation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    query: { type: Type.STRING },
                    aiResponse: { type: Type.STRING },
                    citationStatus: { type: Type.STRING, enum: ["cited", "not_cited", "partial"] },
                    reasoning: { type: Type.STRING }
                  },
                  required: ["query", "aiResponse", "citationStatus", "reasoning"]
                }
              },
              brutalHonesty: { type: Type.STRING },
              roadmapToTop: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.STRING },
                    priority: { type: Type.STRING, enum: ["critical", "high", "medium"] },
                    timeframe: { type: Type.STRING }
                  },
                  required: ["step", "priority", "timeframe"]
                }
              }
            },
            required: [
              "geoScore", "factualDensity", "citationPotential", 
              "directAnswerClarity", "eeatScore", "analysis", 
              "recommendations", "aiSimulation", "brutalHonesty", "roadmapToTop"
            ]
          }
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Content audit timed out (90s)")), 90000)
      )
    ]);
  });

  return JSON.parse(response.text || "{}") as GEOContentAudit;
}

export async function performMarketAudit(
  data: {
    type: "website" | "marketplace";
    platform?: string;
    title?: string;
    url?: string;
  }
): Promise<GEOMarketAudit> {
  const model = "gemini-3-flash-preview";

  const prompt = `
    You are a GEO Market Intelligence Expert. 
    Perform a LIVE MARKET AUDIT for this ${data.type === "marketplace" ? "product" : "website"}.
    
    CONTEXT:
    - Name/Title: ${data.title || data.url}
    - Type: ${data.type}
    - Platform: ${data.platform || "Web"}

    REQUIREMENTS (USE GOOGLE SEARCH):
    1. Market Intent Discovery: 
       - Top Queries: 3 most frequent AI-driven questions in this niche.
       - Feature Probability: Which 2 features are most likely to trigger an AI recommendation?
       - Topic Alignment: 2 high-authority topics this should "own".
    2. Live Citation Gap Audit:
       - Search for high-intent queries in this niche.
       - Identify which brands are currently being cited.
       - Identify 2 "Authority Sources" (blogs, news, reviews) driving these citations.
       - Calculate a "Gap Score" (0-100) and provide an "Authority Blueprint".

    STRICT JSON OUTPUT:
    Return the result in the following JSON structure.
  `;

  const response = await withRetry(() => {
    const contents = data.url 
      ? `Please audit the following website: ${data.url}\n\n${prompt}`
      : prompt;

    return Promise.race([
      ai.models.generateContent({
        model,
        contents,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          tools: data.url ? [{ googleSearch: {} }, { urlContext: {} }] : [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              marketIntent: {
                type: Type.OBJECT,
                properties: {
                  topQueries: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        query: { type: Type.STRING },
                        volume: { type: Type.STRING, enum: ["high", "medium", "low"] },
                        intent: { type: Type.STRING, enum: ["informational", "transactional", "comparative"] }
                      },
                      required: ["query", "volume", "intent"]
                    }
                  },
                  featureProbability: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        feature: { type: Type.STRING },
                        probability: { type: Type.NUMBER },
                        reason: { type: Type.STRING }
                      },
                      required: ["feature", "probability", "reason"]
                    }
                  },
                  topicAlignment: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        topic: { type: Type.STRING },
                        relevance: { type: Type.NUMBER },
                        gap: { type: Type.STRING, enum: ["high", "medium", "low"] }
                      },
                      required: ["topic", "relevance", "gap"]
                    }
                  }
                },
                required: ["topQueries", "featureProbability", "topicAlignment"]
              },
              citationGap: {
                type: Type.OBJECT,
                properties: {
                  liveCitedBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                  authoritySources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        source: { type: Type.STRING },
                        url: { type: Type.STRING },
                        reason: { type: Type.STRING }
                      },
                      required: ["source", "url", "reason"]
                    }
                  },
                  gapScore: { type: Type.NUMBER },
                  blueprint: { type: Type.STRING }
                },
                required: ["liveCitedBrands", "authoritySources", "gapScore", "blueprint"]
              }
            },
            required: ["marketIntent", "citationGap"]
          }
        }
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Market audit timed out (120s)")), 120000)
      )
    ]);
  });

  return JSON.parse(response.text || "{}") as GEOMarketAudit;
}

export async function performGEOAudit(
  data: {
    type: "website" | "marketplace";
    platform?: string;
    title?: string;
    bullets?: string;
    description?: string;
    url?: string;
    content?: string;
    competitorContext?: string;
  }
): Promise<GEOAuditResult> {
  const model = "gemini-3-flash-preview";

  // Create a timeout promise (150 seconds)
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("GEO Audit timed out. The AI model is taking too long to respond. Please try again.")), 150000);
  });

  const auditPromise = (async () => {
    const content = await performContentAudit(data);
    try {
      // Market audit gets its own internal retry/timeout logic via performMarketAudit
      const market = await performMarketAudit(data);
      return { ...content, ...market };
    } catch (e) {
      console.warn("Market audit failed, returning content audit only", e);
      return content;
    }
  })();

  return Promise.race([auditPromise, timeoutPromise]);
}
