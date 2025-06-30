import { generateObject } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { useHealthProfileStore } from "@/lib/health-profile-store";
import { generateHealthProfileSummary } from "@/lib/health-profile-utils";

export const runtime = "edge";
export const maxDuration = 30;

// Schema for health profile analysis
const healthProfileAnalysisSchema = z.object({
  riskScore: z.number().min(0).max(100).describe("Overall health risk score 0-100"),
  
  recommendations: z.array(z.object({
    category: z.enum(["coverage", "provider", "preventive", "cost", "lifestyle"]),
    priority: z.enum(["high", "medium", "low"]),
    recommendation: z.string(),
    reasoning: z.string(),
  })),
  
  coveragePriorities: z.array(z.object({
    feature: z.string().describe("Insurance feature to prioritize"),
    importance: z.enum(["critical", "important", "nice-to-have"]),
    reason: z.string(),
  })),
  
  expectedCosts: z.object({
    lowEstimate: z.number().max(500000).describe("Low estimate annual healthcare costs"),
    highEstimate: z.number().max(1000000).describe("High estimate annual healthcare costs"),
    breakdown: z.array(z.object({
      category: z.string(),
      annualCost: z.number().max(250000),
    })),
  }),
  
  careGaps: z.array(z.object({
    type: z.string(),
    description: z.string(),
    suggestedAction: z.string(),
  })),
  
  providerNeeds: z.array(z.object({
    specialty: z.string(),
    frequency: z.string(),
    inNetwork: z.boolean().optional(),
  })),
});

export async function POST(req: Request) {
  const { members, enhancedMode = false } = await req.json();
  
  // Generate health profile summary
  const profileSummary = generateHealthProfileSummary(members);
  
  const systemPrompt = `You are a health insurance analyst helping families understand their healthcare needs and choose appropriate insurance coverage.

Analyze the following family health profile and provide:
1. Risk assessment based on age, conditions, and medications
2. Specific recommendations for insurance features to prioritize
3. Expected annual healthcare costs (realistic ranges)
4. Identify any gaps in preventive care or treatment
5. Provider/specialist needs based on conditions

Health Profile:
${profileSummary}

Consider:
- Age-appropriate preventive care schedules
- Condition-specific treatment requirements
- Medication costs (generic vs brand, specialty drugs)
- Potential complications or disease progression
- Family medical patterns`;

  try {
    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: healthProfileAnalysisSchema,
      system: systemPrompt,
      prompt: "Analyze this family's health profile and provide comprehensive insurance guidance.",
    });

    return Response.json(result.object);
  } catch (error) {
    console.error("Health profile analysis error:", error);
    return Response.json(
      { error: "Failed to analyze health profile" },
      { status: 500 }
    );
  }
}