"use server"

import type { SBCData } from "@/lib/sbc-schema"
import type { HealthProfileMember } from "@/lib/health-profile-store"

export interface AnalysisConfig {
  currentDeductible: number
  currentOutOfPocket: number
  networkType: 'in-network' | 'out-of-network' | 'both'
}

export interface MemberCostBreakdown {
  memberIndex: number
  primaryCareVisits: { count: number; costPerVisit: number; total: number }
  specialistVisits: { count: number; costPerVisit: number; total: number }
  medications: { count: number; costPerFill: number; total: number }
  diagnosticTests: { count: number; costPerTest: number; total: number }
  plannedVisits: Array<{ name: string; frequency: number; costPerVisit: number; total: number }>
  memberTotal: number
}

export interface PolicyAnalysis {
  policyName: string
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  estimatedAnnualCost: number
  memberBreakdowns: MemberCostBreakdown[]
  breakdown: {
    premiums: number
    totalMedicalCosts: number
    deductibleApplied: number
    coinsuranceApplied: number
    outOfPocketMax: number
    finalMedicalCosts: number
  }
}

function extractCostNumber(costString: string): number {
  const lowerCost = costString.toLowerCase()
  
  // Not covered = very high cost
  if (lowerCost.includes('not covered') || lowerCost.includes('no coverage')) return 10000
  
  // Free/no charge = 0
  if (lowerCost.includes('no charge') || lowerCost.includes('free')) return 0
  
  // Extract dollar amount
  const match = costString.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  
  // Percentage copay - estimate based on average service cost
  if (lowerCost.includes('%')) {
    const percentMatch = costString.match(/(\d+)%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      return (percent / 100) * 300; // Assume $300 average service cost
    }
  }
  
  return 200; // Default estimate for unclear pricing
}

function calculateServiceCost(
  policy: SBCData, 
  serviceName: string, 
  frequency: number,
  networkType: 'in-network' | 'out-of-network' | 'both'
): number {
  const service = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes(serviceName.toLowerCase())
  )
  
  if (!service) return 0
  
  let cost = 0
  if (networkType === 'in-network') {
    cost = extractCostNumber(service.what_you_will_pay.network_provider)
  } else if (networkType === 'out-of-network') {
    cost = extractCostNumber(service.what_you_will_pay.out_of_network_provider)
  } else {
    // Both - use weighted average (80% in-network, 20% out-of-network)
    const inNetworkCost = extractCostNumber(service.what_you_will_pay.network_provider)
    const outOfNetworkCost = extractCostNumber(service.what_you_will_pay.out_of_network_provider)
    cost = (inNetworkCost * 0.8) + (outOfNetworkCost * 0.2)
  }
  
  return cost * frequency
}

function calculateMemberCosts(
  policy: SBCData,
  member: HealthProfileMember,
  memberIndex: number,
  config: AnalysisConfig
): MemberCostBreakdown {
  // Get cost per service
  const primaryCareCost = calculateServiceCost(policy, 'primary care', 1, config.networkType)
  const specialistCost = calculateServiceCost(policy, 'specialist', 1, config.networkType)
  const genericMedCost = calculateServiceCost(policy, 'generic', 1, config.networkType)
  const diagnosticCost = calculateServiceCost(policy, 'diagnostic', 1, config.networkType)

  // Calculate visits and costs for this member
  
  // Primary care: 2 annual visits + 1 per condition
  const primaryCareCount = 2 + member.conditions.length
  const primaryCareTotal = primaryCareCost * primaryCareCount

  // Specialist visits: 1 per condition (minimum 0)
  const specialistCount = member.conditions.length
  const specialistTotal = specialistCost * specialistCount

  // Medications: 12 fills per medication per year
  const medicationCount = member.medications.length * 12
  const medicationTotal = genericMedCost * medicationCount

  // Diagnostic tests: 1 annual + 1 per condition
  const diagnosticCount = 1 + member.conditions.length
  const diagnosticTotal = diagnosticCost * diagnosticCount

  // Planned visits from health profile
  const plannedVisits = member.visits.map(visit => {
    const frequency = parseFloat(visit.frequency.match(/(\d+)/)?.[1] || '1')
    const costPerVisit = calculateServiceCost(policy, visit.name, 1, config.networkType)
    return {
      name: visit.name,
      frequency,
      costPerVisit,
      total: costPerVisit * frequency
    }
  })

  const plannedVisitsTotal = plannedVisits.reduce((sum, visit) => sum + visit.total, 0)
  
  const memberTotal = primaryCareTotal + specialistTotal + medicationTotal + diagnosticTotal + plannedVisitsTotal

  return {
    memberIndex,
    primaryCareVisits: { count: primaryCareCount, costPerVisit: primaryCareCost, total: primaryCareTotal },
    specialistVisits: { count: specialistCount, costPerVisit: specialistCost, total: specialistTotal },
    medications: { count: medicationCount, costPerFill: genericMedCost, total: medicationTotal },
    diagnosticTests: { count: diagnosticCount, costPerTest: diagnosticCost, total: diagnosticTotal },
    plannedVisits,
    memberTotal
  }
}

export async function calculatePolicyAnalysis(
  policies: SBCData[],
  healthProfile: HealthProfileMember[],
  config: AnalysisConfig
): Promise<PolicyAnalysis[]> {
  const results: PolicyAnalysis[] = []
  
  // Estimate monthly premium (this would ideally come from policy data)
  const estimatedMonthlyPremium = healthProfile.length > 1 ? 450 : 250
  
  for (const policy of policies) {
    const memberBreakdowns: MemberCostBreakdown[] = []
    
    // Calculate costs for each member
    healthProfile.forEach((member, index) => {
      const memberCosts = calculateMemberCosts(policy, member, index, config)
      memberBreakdowns.push(memberCosts)
    })

    // Sum up all medical costs
    const totalMedicalCosts = memberBreakdowns.reduce((sum, member) => sum + member.memberTotal, 0)
    
    // Apply deductible
    const relevantDeductible = healthProfile.length > 1 
      ? policy.important_questions.overall_deductible.family
      : policy.important_questions.overall_deductible.individual
    
    const deductibleApplied = Math.min(totalMedicalCosts, relevantDeductible)
    
    // After deductible costs (assume 20% coinsurance)
    const coinsuranceApplied = Math.max(0, totalMedicalCosts - relevantDeductible) * 0.2
    
    // Cap at out-of-pocket maximum
    const outOfPocketMax = healthProfile.length > 1
      ? policy.important_questions.out_of_pocket_limit_for_plan.family
      : policy.important_questions.out_of_pocket_limit_for_plan.individual
    
    const finalMedicalCosts = Math.min(deductibleApplied + coinsuranceApplied, outOfPocketMax)
    const totalAnnualCost = (estimatedMonthlyPremium * 12) + finalMedicalCosts
    
    // Calculate grade based on total annual cost and comparison with current
    const currentAnnualCost = config.currentDeductible + config.currentOutOfPocket + (estimatedMonthlyPremium * 12)
    const savings = currentAnnualCost - totalAnnualCost
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
    
    if (savings > 3000 && totalAnnualCost <= 10000) {
      grade = 'A'
    } else if (savings > 1500 || totalAnnualCost <= 12000) {
      grade = 'B'
    } else if (savings > 0 || totalAnnualCost <= 16000) {
      grade = 'C'
    } else if (totalAnnualCost <= 20000) {
      grade = 'D'
    } else {
      grade = 'F'
    }
    
    // Calculate score (0-100)
    const score = Math.max(0, Math.min(100, 100 - ((totalAnnualCost - 8000) / 200)))
    
    results.push({
      policyName: policy.plan_summary.plan_name,
      grade,
      score: Math.round(score),
      estimatedAnnualCost: Math.round(totalAnnualCost),
      memberBreakdowns,
      breakdown: {
        premiums: estimatedMonthlyPremium * 12,
        totalMedicalCosts: Math.round(totalMedicalCosts),
        deductibleApplied: Math.round(deductibleApplied),
        coinsuranceApplied: Math.round(coinsuranceApplied),
        outOfPocketMax,
        finalMedicalCosts: Math.round(finalMedicalCosts)
      }
    })
  }
  
  return results
}