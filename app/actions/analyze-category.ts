"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import type { SBCData } from "@/lib/sbc-schema"

const GEMINI_MODEL = google("gemini-2.0-flash-exp")

const CategoryAnalysisSchema = z.object({
  category: z.string(),
  description: z.string(),
  suggestedSubcategories: z.array(z.object({
    name: z.string(),
    description: z.string(),
    searchTerm: z.string()
  })),
  relatedServices: z.array(z.object({
    serviceName: z.string(),
    description: z.string(),
    relevanceReason: z.string(),
    estimatedFrequency: z.string(),
    policyPricing: z.array(z.object({
      policyName: z.string(),
      inNetworkCost: z.string(),
      outOfNetworkCost: z.string(),
      actualCostAfterDeductible: z.string(),
      limitations: z.string()
    }))
  })),
  policyGrades: z.array(z.object({
    policyName: z.string(),
    grade: z.enum(['A', 'B', 'C', 'D', 'F']),
    reasoning: z.string(),
    estimatedCost: z.string(),
    coverageHighlights: z.array(z.string()),
    costFactors: z.array(z.string())
  })),
  overallInsights: z.array(z.string())
})

export type CategoryAnalysisResult = z.infer<typeof CategoryAnalysisSchema>

export interface CategoryAnalysisInput {
  searchTerm: string
  policies: SBCData[]
  networkType: 'in-network' | 'out-of-network'
  currentDeductible: number
  currentOutOfPocket: number
}

/**
 * Analyze a healthcare category across multiple insurance policies
 * 
 * This server action provides AI-powered analysis of how different policies
 * handle coverage for a specific healthcare category or service type.
 * 
 * @param input Category analysis parameters including search term, policies, and financial context
 * @returns Promise resolving to detailed category analysis with policy grades
 * 
 * @example
 * ```typescript
 * const result = await analyzeCareCategory({
 *   searchTerm: "mental health",
 *   policies: [policy1, policy2],
 *   networkType: "in-network",
 *   familySize: 2,
 *   currentDeductible: 1000,
 *   currentOutOfPocket: 2000
 * });
 * ```
 */
export async function analyzeCareCategory(input: CategoryAnalysisInput): Promise<CategoryAnalysisResult> {
  const { searchTerm, policies, networkType, currentDeductible, currentOutOfPocket } = input
  
  try {
    console.log("Analyzing care category:", { 
      searchTerm, 
      policyCount: policies.length,
      networkType
    })
    
    // Prepare policy summaries for AI analysis
    const policySummaries = policies.map(policy => ({
      name: policy.plan_summary.plan_name,
      planType: policy.plan_summary.plan_type,
      issuer: policy.plan_summary.issuer_name,
      deductible: {
        individual: policy.important_questions.overall_deductible.in_network.individual,
        family: policy.important_questions.overall_deductible.in_network.family
      },
      outOfPocketMax: {
        individual: policy.important_questions.out_of_pocket_limit_for_plan.in_network.individual,
        family: policy.important_questions.out_of_pocket_limit_for_plan.in_network.family
      },
      needsReferral: policy.important_questions.need_referral_for_specialist_care.required,
      services: policy.services_you_may_need.map(service => ({
        name: service.name,
        inNetworkCost: service.what_you_will_pay.network_provider,
        outOfNetworkCost: service.what_you_will_pay.out_of_network_provider,
        limitations: service.what_you_will_pay.limitations_exceptions_and_other_important_information
      }))
    }))

    const result = await generateObject({
      model: GEMINI_MODEL,
      schema: CategoryAnalysisSchema,
      messages: [
        {
          role: "user",
          content: `You are a healthcare insurance expert analyzing coverage for "${searchTerm}" across multiple insurance policies.

ANALYSIS CONTEXT:
- Search term: "${searchTerm}"
- Network preference: ${networkType}
- Current deductible progress: $${currentDeductible.toLocaleString()}
- Current out-of-pocket progress: $${currentOutOfPocket.toLocaleString()}

POLICIES TO ANALYZE:
${JSON.stringify(policySummaries, null, 2)}

INSTRUCTIONS:
1. Identify the care category that best matches "${searchTerm}" and provide a clear description
2. Generate 3-5 suggested subcategories for more specific searches within this category
3. Find 4-8 related services from the policies that are relevant to this category
4. For each service, provide detailed pricing from each policy including actual costs after deductible progress
5. For each policy, assign a letter grade (A-F) based on cost-effectiveness and coverage
6. Provide overall insights about this category across all policies

GRADING CRITERIA:
- A: Excellent coverage, low costs after deductible/existing spending, minimal restrictions
- B: Good coverage with reasonable costs considering current financial position
- C: Average coverage with moderate costs
- D: Limited coverage or high costs relative to benefits
- F: Poor coverage, very high costs, or significant limitations

COST CALCULATION FACTORS:
- Use ${networkType} costs for analysis
- Account for current deductible progress ($${currentDeductible}) - remaining to meet
- Consider out-of-pocket progress ($${currentOutOfPocket}) - how close to maximum
- Consider referral requirements and network limitations
- Calculate actual out-of-pocket costs after applying deductible progress

For suggested subcategories, provide:
- Name of the subcategory
- Brief description of what it covers
- Exact search term to use for that subcategory

For each related service, include:
- Clear description of what the service covers
- Why it's relevant to "${searchTerm}"
- Typical frequency of use (e.g., "1-2 times per year", "Monthly", "As needed")
- For each policy: in-network cost, out-of-network cost, actual cost after current deductible progress, and any limitations

For each policy grade, provide:
- Clear reasoning for the grade considering current financial position
- Estimated cost range factoring in current deductible/out-of-pocket progress
- 2-3 key coverage highlights or limitations
- Specific cost factors that influenced the grade

Provide 3-5 overall insights about this category that would help users make informed decisions.`
        }
      ]
    })

    console.log(`Successfully analyzed category "${searchTerm}" across ${policies.length} policies`)
    return result.object
    
  } catch (error) {
    console.error("Error in analyzeCareCategory:", error)
    
    // Return fallback analysis on error
    return {
      category: searchTerm,
      description: `Analysis of ${searchTerm} coverage across your insurance policies.`,
      relatedServices: [],
      policyGrades: policies.map(policy => ({
        policyName: policy.plan_summary.plan_name,
        grade: 'C' as const,
        reasoning: "Unable to analyze at this time. Please review your policy documents for specific coverage details.",
        estimatedCost: "Contact insurance provider",
        coverageHighlights: ["Review Summary of Benefits and Coverage document"],
        costFactors: ["Unable to calculate cost factors"]
      })),
      overallInsights: [
        "Analysis temporarily unavailable - please contact your insurance provider for specific coverage details",
        "Review your Summary of Benefits and Coverage documents for detailed information",
        "Consider speaking with your healthcare provider about coverage options"
      ]
    }
  }
}