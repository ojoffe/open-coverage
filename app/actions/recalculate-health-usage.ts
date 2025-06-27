"use server"

import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import type { HealthProfileMember } from "@/lib/health-profile-store"

const healthUsageSchema = z.object({
  members: z.array(z.object({
    memberIndex: z.number(),
    primaryCareVisits: z.number().describe("Expected primary care visits per year"),
    specialistVisits: z.number().describe("Expected specialist visits per year"),
    medicationFills: z.number().describe("Total medication fills per year (all medications combined)"),
    diagnosticTests: z.number().describe("Expected diagnostic tests per year"),
    plannedVisits: z.array(z.object({
      name: z.string().describe("Type of planned visit"),
      frequency: z.string().describe("Frequency per year (e.g., '2 per year', '1 per month')")
    })),
    reasoning: z.string().describe("Brief explanation of the calculation for this member")
  })),
  overallReasoning: z.string().describe("Summary of the overall analysis and adjustments made")
})

export type RecalculatedHealthUsage = z.infer<typeof healthUsageSchema>

export async function recalculateHealthUsage(
  healthProfile: HealthProfileMember[],
  userInput: string
): Promise<RecalculatedHealthUsage> {
  try {
    const result = await generateObject({
      model: anthropic('claude-3-5-sonnet-20240620'),
      schema: healthUsageSchema,
      messages: [
        {
          role: "system",
          content: `You are a healthcare utilization analyst. Your job is to estimate realistic annual healthcare usage based on a family's health profile and any additional context provided by the user.

Guidelines for estimation:
- Primary care: Typically 1-2 visits per year for healthy adults, plus 1 additional visit per chronic condition
- Specialist visits: Usually 1-2 visits per year per specialist needed for each condition
- Medication fills: Standard is 12 fills per year per medication (monthly refills)
- Diagnostic tests: 1 annual routine test plus additional based on conditions and age
- Consider age, conditions, medications, and user's additional context
- Be realistic and evidence-based in your estimates
- If user mentions specific upcoming procedures, surgeries, or health events, factor those in`
        },
        {
          role: "user", 
          content: `Please analyze this family's health profile and calculate expected annual healthcare utilization:

**Current Health Profile:**
${healthProfile.map((member, index) => `
Member ${index + 1} (${member.name || 'Unnamed'}):
- Age: ${member.age || 'Not specified'}
- Medical conditions: ${member.conditions.length > 0 ? member.conditions.join(', ') : 'None listed'}
- Current medications: ${member.medications.length > 0 ? member.medications.join(', ') : 'None listed'}
- Planned visits: ${member.visits.length > 0 ? member.visits.map(v => `${v.name} (${v.frequency})`).join(', ') : 'None planned'}
`).join('\n')}

**Additional Context from User:**
${userInput || 'No additional information provided'}

Please recalculate the expected healthcare utilization based on this information. Consider:
1. The existing health profile data
2. Any additional information the user provided
3. Realistic healthcare usage patterns for people with these conditions
4. Any upcoming procedures, changes in health status, or specific concerns mentioned

Provide specific numbers for each member and explain your reasoning.`
        }
      ]
    })

    return result.object
  } catch (error) {
    console.error('Error recalculating health usage:', error)
    
    // Fallback calculation based on basic rules
    return {
      members: healthProfile.map((member, index) => ({
        memberIndex: index,
        primaryCareVisits: 2 + member.conditions.length,
        specialistVisits: member.conditions.length,
        medicationFills: member.medications.length * 12,
        diagnosticTests: 1 + Math.floor(member.conditions.length / 2),
        plannedVisits: member.visits,
        reasoning: "Fallback calculation - 2 primary care visits + 1 per condition, 1 specialist per condition, 12 fills per medication"
      })),
      overallReasoning: "API unavailable - using conservative estimates based on standard healthcare utilization patterns"
    }
  }
}