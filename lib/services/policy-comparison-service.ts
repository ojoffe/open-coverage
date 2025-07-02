/**
 * Policy Comparison Service - Multi-policy analysis and grading
 * 
 * This service handles comparing multiple insurance policies against
 * various healthcare situations, providing grades and cost estimates
 * for each policy-situation combination.
 * 
 * Key features:
 * - Multi-policy comparison and ranking
 * - Situation-based grading system
 * - Cost estimation for specific scenarios
 * - AI-powered analysis and recommendations
 * - Batch processing for efficiency
 */

import { generateObjectWithAIRetry } from "@/lib/ai-retry";
import { AI_ERROR_CODES } from "@/lib/services/insurance-ai-service";
import type { ParsedPolicy } from "@/types/schemas";
import { anthropic } from "@ai-sdk/anthropic";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface PolicyWithGrades extends ParsedPolicy {
  id: string;
  overallGrade: string;
  situationGrades: Record<string, string>;
  costEstimates: Record<string, PolicyCostEstimate>;
}

export interface PolicyCostEstimate {
  estimatedCost: number;
  coverageDetails: string;
  recommendations: string[];
  confidenceLevel: "high" | "medium" | "low";
}

export interface HealthcareSituation {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ComparisonContext {
  isInNetwork: boolean;
  deductibleSpent: number;
  outOfPocketSpent: number;
  familySize: number;
  preferredProviders?: string[];
}

// =============================================================================
// ZOOD SCHEMAS FOR VALIDATION
// =============================================================================

const PolicyGradeSchema = z.object({
  grade: z.enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]),
  reasoning: z.string().min(10, "Reasoning must be at least 10 characters"),
  coveragePercentage: z.number().min(0).max(100),
  keyFactors: z.array(z.string()).min(1, "At least one key factor required"),
});

const SituationAnalysisSchema = z.object({
  policyId: z.string(),
  situationId: z.string(),
  grade: z.enum(["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"]),
  estimatedCost: z.number().min(0),
  coverageDetails: z.string().min(10),
  recommendations: z.array(z.string()),
  confidenceLevel: z.enum(["high", "medium", "low"]),
  reasoning: z.string().min(10),
});

const BatchAnalysisSchema = z.object({
  analyses: z.array(SituationAnalysisSchema),
});

// =============================================================================
// AI MODEL CONFIGURATION
// =============================================================================

const AI_MODELS = {
  COMPARISON: anthropic("claude-sonnet-4-20250514"),
  GRADING: anthropic("claude-sonnet-4-20250514"),
  FALLBACK: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
} as const;

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class PolicyComparisonError extends Error {
  constructor(
    message: string,
    public code: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "PolicyComparisonError";
  }
}

function createComparisonError(
  message: string,
  code: keyof typeof AI_ERROR_CODES,
  operation: string,
  originalError?: unknown
): PolicyComparisonError {
  return new PolicyComparisonError(message, AI_ERROR_CODES[code], operation, originalError);
}

// =============================================================================
// OVERALL POLICY GRADING
// =============================================================================

/**
 * Generate an overall grade for a single policy
 * 
 * @param policy The policy to grade
 * @param context User context for grading
 * @returns Promise resolving to policy grade and analysis
 */
export async function generateOverallPolicyGrade(
  policy: ParsedPolicy,
  context: ComparisonContext
): Promise<{
  grade: string;
  reasoning: string;
  coveragePercentage: number;
  keyFactors: string[];
}> {
  const operation = "generateOverallPolicyGrade";
  
  try {
    console.log("Generating overall grade for policy:", policy.plan_summary.plan_name);

    const systemPrompt = `You are a health insurance expert. Grade this insurance policy on overall value and coverage quality.

Consider these factors:
- Deductible amounts and structure
- Out-of-pocket maximums
- Coverage breadth and depth
- Network restrictions
- Plan type benefits and limitations
- Cost-sharing requirements
- Preventive care coverage
- Specialist access requirements

Context:
- Network: ${context.isInNetwork ? "In-Network" : "Out-of-Network"}
- Family Size: ${context.familySize}
- Current Deductible Spent: $${context.deductibleSpent}
- Current Out-of-Pocket Spent: $${context.outOfPocketSpent}

Policy to analyze:
${JSON.stringify(policy, null, 2)}

Return a grade from A+ to F based on overall value, with A+ being excellent coverage at reasonable cost, and F being poor coverage or excessive cost.`;

    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.GRADING,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: "Analyze this policy and provide an overall grade with detailed reasoning.",
        },
      ],
      schema: PolicyGradeSchema,
      backupModel: AI_MODELS.FALLBACK,
    }) as {
      grade: string;
      reasoning: string;
      coveragePercentage: number;
      keyFactors: string[];
    };

    console.log(`Generated overall grade ${result.grade} for policy: ${policy.plan_summary.plan_name}`);
    return result;

  } catch (error) {
    console.error(`${operation} failed:`, error);
    throw createComparisonError(
      `Failed to generate overall policy grade: ${error instanceof Error ? error.message : "Unknown error"}`,
      "MODEL_UNAVAILABLE",
      operation,
      error
    );
  }
}

// =============================================================================
// SITUATION-BASED ANALYSIS
// =============================================================================

/**
 * Analyze how well multiple policies handle a specific healthcare situation
 * 
 * @param policies Array of policies to analyze
 * @param situation Healthcare situation to analyze
 * @param context User context for analysis
 * @returns Promise resolving to analysis for each policy
 */
export async function analyzeSituationAcrossPolicies(
  policies: ParsedPolicy[],
  situation: HealthcareSituation,
  context: ComparisonContext
): Promise<Array<{
  policyId: string;
  grade: string;
  estimatedCost: number;
  coverageDetails: string;
  recommendations: string[];
  confidenceLevel: "high" | "medium" | "low";
  reasoning: string;
}>> {
  const operation = "analyzeSituationAcrossPolicies";
  
  try {
    console.log(`Analyzing situation "${situation.name}" across ${policies.length} policies`);

    // Create policy summaries for the AI
    const policySummaries = policies.map((policy, index) => ({
      id: `policy_${index}`,
      originalPolicy: policy,
      summary: {
        name: policy.plan_summary.plan_name,
        issuer: policy.plan_summary.issuer_name,
        type: policy.plan_summary.plan_type,
        deductible: policy.important_questions.overall_deductible.individual,
        outOfPocketMax: policy.important_questions.out_of_pocket_limit_for_plan.individual,
        requiresReferrals: policy.important_questions.need_referral_for_specialist_care.required,
      }
    }));

    const systemPrompt = `You are a health insurance expert. Analyze how well each policy covers a specific healthcare situation.

Situation to analyze:
- Name: ${situation.name}
- Description: ${situation.description}
- Category: ${situation.category}

Context:
- Network: ${context.isInNetwork ? "In-Network" : "Out-of-Network"}
- Family Size: ${context.familySize}
- Deductible Already Spent: $${context.deductibleSpent}
- Out-of-Pocket Already Spent: $${context.outOfPocketSpent}

For each policy, provide:
1. Grade (A+ to F) based on how well it covers this situation
2. Estimated out-of-pocket cost for the patient
3. Detailed coverage explanation
4. 2-3 specific recommendations
5. Confidence level in the analysis
6. Reasoning for the grade

Consider deductibles already met, coinsurance rates, copays, annual limits, and any situation-specific coverage rules.

Policies to analyze:
${policySummaries.map(p => `Policy ${p.id}: ${JSON.stringify(p.originalPolicy, null, 2)}`).join('\n\n')}`;

    const result = await generateObjectWithAIRetry({
      model: AI_MODELS.COMPARISON,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Analyze how each policy handles the healthcare situation "${situation.name}". Return analysis for each policy.`,
        },
      ],
      schema: BatchAnalysisSchema,
      backupModel: AI_MODELS.FALLBACK,
    }) as { analyses: Array<{
      policyId: string;
      situationId: string;
      grade: string;
      estimatedCost: number;
      coverageDetails: string;
      recommendations: string[];
      confidenceLevel: "high" | "medium" | "low";
      reasoning: string;
    }> };

    console.log(`Generated ${result.analyses.length} situation analyses for: ${situation.name}`);
    return result.analyses;

  } catch (error) {
    console.error(`${operation} failed:`, error);
    throw createComparisonError(
      `Failed to analyze situation across policies: ${error instanceof Error ? error.message : "Unknown error"}`,
      "MODEL_UNAVAILABLE",
      operation,
      error
    );
  }
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process multiple policies and situations in an optimized batch
 * 
 * @param policies Array of policies to analyze
 * @param situations Array of healthcare situations
 * @param context User context for analysis
 * @returns Promise resolving to complete analysis results
 */
export async function batchAnalyzePoliciesAndSituations(
  policies: ParsedPolicy[],
  situations: HealthcareSituation[],
  context: ComparisonContext
): Promise<{
  policies: PolicyWithGrades[];
  completedAt: Date;
  analysisTime: number;
}> {
  const operation = "batchAnalyzePoliciesAndSituations";
  const startTime = Date.now();
  
  try {
    console.log(`Starting batch analysis: ${policies.length} policies × ${situations.length} situations`);

    // Initialize policies with grades structure
    const policiesWithGrades: PolicyWithGrades[] = policies.map((policy, index) => ({
      ...policy,
      id: `policy_${index + 1}`,
      overallGrade: "Pending",
      situationGrades: {},
      costEstimates: {},
    }));

    // Step 1: Generate overall grades for all policies (parallel)
    console.log("Step 1: Generating overall policy grades...");
    const overallGradePromises = policiesWithGrades.map(async (policy) => {
      try {
        const gradeResult = await generateOverallPolicyGrade(policy, context);
        return { policyId: policy.id, ...gradeResult };
      } catch (error) {
        console.error(`Failed to grade policy ${policy.id}:`, error);
        return {
          policyId: policy.id,
          grade: "C",
          reasoning: "Unable to analyze policy at this time",
          coveragePercentage: 50,
          keyFactors: ["Analysis unavailable"],
        };
      }
    });

    const overallGrades = await Promise.all(overallGradePromises);
    
    // Apply overall grades to policies
    overallGrades.forEach(({ policyId, grade }) => {
      const policy = policiesWithGrades.find(p => p.id === policyId);
      if (policy) {
        policy.overallGrade = grade;
      }
    });

    // Step 2: Analyze each situation across all policies (sequential to avoid rate limits)
    console.log("Step 2: Analyzing situations across policies...");
    for (const situation of situations) {
      try {
        const situationAnalyses = await analyzeSituationAcrossPolicies(policies, situation, context);
        
        // Apply situation analysis results to policies
        situationAnalyses.forEach((analysis) => {
          // Find the corresponding policy by matching indices
          const policyIndex = parseInt(analysis.policyId.replace('policy_', ''));
          const policy = policiesWithGrades[policyIndex];
          
          if (policy) {
            policy.situationGrades[situation.id] = analysis.grade;
            policy.costEstimates[situation.id] = {
              estimatedCost: analysis.estimatedCost,
              coverageDetails: analysis.coverageDetails,
              recommendations: analysis.recommendations,
              confidenceLevel: analysis.confidenceLevel,
            };
          }
        });
      } catch (error) {
        console.error(`Failed to analyze situation ${situation.name}:`, error);
        
        // Apply fallback grades for this situation
        policiesWithGrades.forEach((policy) => {
          policy.situationGrades[situation.id] = "C";
          policy.costEstimates[situation.id] = {
            estimatedCost: 0,
            coverageDetails: "Analysis unavailable at this time",
            recommendations: ["Contact your insurance provider for specific details"],
            confidenceLevel: "low",
          };
        });
      }
    }

    const analysisTime = Date.now() - startTime;
    console.log(`Batch analysis completed in ${analysisTime}ms`);

    return {
      policies: policiesWithGrades,
      completedAt: new Date(),
      analysisTime,
    };

  } catch (error) {
    console.error(`${operation} failed:`, error);
    throw createComparisonError(
      `Batch analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      "MODEL_UNAVAILABLE",
      operation,
      error
    );
  }
}

// =============================================================================
// COMPARISON UTILITIES
// =============================================================================

/**
 * Rank policies based on overall performance across all situations
 * 
 * @param policies Array of policies with grades
 * @returns Sorted array with best policies first
 */
export function rankPoliciesByOverallPerformance(
  policies: PolicyWithGrades[]
): PolicyWithGrades[] {
  const gradeValues: Record<string, number> = {
    "A+": 97, "A": 93, "A-": 90,
    "B+": 87, "B": 83, "B-": 80,
    "C+": 77, "C": 73, "C-": 70,
    "D+": 67, "D": 63, "D-": 60,
    "F": 50
  };

  return [...policies].sort((a, b) => {
    const scoreA = gradeValues[a.overallGrade] || 50;
    const scoreB = gradeValues[b.overallGrade] || 50;
    return scoreB - scoreA; // Higher scores first
  });
}

/**
 * Find the best policy for a specific situation
 * 
 * @param policies Array of policies with grades
 * @param situationId ID of the situation to check
 * @returns Best policy for the situation, or null if none found
 */
export function getBestPolicyForSituation(
  policies: PolicyWithGrades[],
  situationId: string
): PolicyWithGrades | null {
  const gradeValues: Record<string, number> = {
    "A+": 97, "A": 93, "A-": 90,
    "B+": 87, "B": 83, "B-": 80,
    "C+": 77, "C": 73, "C-": 70,
    "D+": 67, "D": 63, "D-": 60,
    "F": 50
  };

  const policiesWithSituationGrades = policies.filter(
    policy => policy.situationGrades[situationId]
  );

  if (policiesWithSituationGrades.length === 0) {
    return null;
  }

  return policiesWithSituationGrades.reduce((best, current) => {
    const bestScore = gradeValues[best.situationGrades[situationId]] || 50;
    const currentScore = gradeValues[current.situationGrades[situationId]] || 50;
    return currentScore > bestScore ? current : best;
  });
}

/**
 * Generate a comparison summary for display
 * 
 * @param policies Array of policies with grades
 * @param situations Array of situations analyzed
 * @returns Summary object with key insights
 */
export function generateComparisonSummary(
  policies: PolicyWithGrades[],
  situations: HealthcareSituation[]
): {
  bestOverallPolicy: PolicyWithGrades | null;
  worstOverallPolicy: PolicyWithGrades | null;
  situationWinners: Record<string, PolicyWithGrades>;
  averageGrades: Record<string, string>;
  insights: string[];
} {
  if (policies.length === 0) {
    return {
      bestOverallPolicy: null,
      worstOverallPolicy: null,
      situationWinners: {},
      averageGrades: {},
      insights: [],
    };
  }

  const rankedPolicies = rankPoliciesByOverallPerformance(policies);
  const situationWinners: Record<string, PolicyWithGrades> = {};

  // Find best policy for each situation
  situations.forEach(situation => {
    const winner = getBestPolicyForSituation(policies, situation.id);
    if (winner) {
      situationWinners[situation.id] = winner;
    }
  });

  // Generate insights
  const insights: string[] = [];
  
  if (rankedPolicies.length >= 2) {
    const best = rankedPolicies[0];
    const worst = rankedPolicies[rankedPolicies.length - 1];
    
    insights.push(
      `${best.plan_summary.plan_name} has the best overall grade (${best.overallGrade})`
    );
    
    if (best.overallGrade !== worst.overallGrade) {
      insights.push(
        `${worst.plan_summary.plan_name} has the lowest overall grade (${worst.overallGrade})`
      );
    }
  }

  return {
    bestOverallPolicy: rankedPolicies[0] || null,
    worstOverallPolicy: rankedPolicies[rankedPolicies.length - 1] || null,
    situationWinners,
    averageGrades: {}, // Could calculate if needed
    insights,
  };
}