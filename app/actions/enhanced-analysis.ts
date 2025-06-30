"use server"

import type { SBCData } from "@/lib/sbc-schema"
import type { HealthProfileMember } from "@/lib/health-profile-store"
import { getMedicalCostEstimate, getBatchMedicalCosts, type CostEstimate } from "./get-medical-costs"
import type { AnalysisConfig, PolicyAnalysis, MemberCostBreakdown } from "./calculate-analysis"

// Common drug type classifications
function predictDrugType(medicationName: string): 'generic' | 'preferred' | 'specialty' {
  const medication = medicationName.toLowerCase()
  
  // Specialty drugs (high-cost, complex conditions)
  const specialtyIndicators = [
    'humira', 'enbrel', 'remicade', 'rituximab', 'adalimumab', 'infliximab',
    'insulin', 'lantus', 'novolog', 'humalog', 'tresiba', 'levemir',
    'copaxone', 'tecfidera', 'gilenya', 'tysabri', 'ocrevus',
    'harvoni', 'sovaldi', 'epclusa', 'mavyret',
    'keytruda', 'opdivo', 'yervoy', 'tecentriq',
    'herceptin', 'avastin', 'perjeta', 'kadcyla',
    'gleevec', 'tasigna', 'sprycel', 'bosulif',
    'revlimid', 'velcade', 'pomalyst', 'ninlaro',
    'orkambi', 'kalydeco', 'symdeko', 'trikafta',
    'spinraza', 'zolgensma', 'exondys',
    'epipen', 'auvi-q', 'twinject'
  ]
  
  // Generic drugs (common, off-patent medications)
  const genericIndicators = [
    'metformin', 'lisinopril', 'amlodipine', 'atorvastatin', 'simvastatin',
    'omeprazole', 'pantoprazole', 'lansoprazole', 'esomeprazole',
    'levothyroxine', 'synthroid', 'armour thyroid',
    'sertraline', 'fluoxetine', 'citalopram', 'escitalopram', 'paroxetine',
    'lorazepam', 'alprazolam', 'clonazepam', 'diazepam',
    'ibuprofen', 'naproxen', 'meloxicam', 'celecoxib',
    'prednisone', 'prednisolone', 'methylprednisolone',
    'albuterol', 'fluticasone', 'budesonide', 'montelukast',
    'hydrochlorothiazide', 'furosemide', 'spironolactone',
    'metoprolol', 'carvedilol', 'propranolol',
    'gabapentin', 'pregabalin', 'tramadol', 'cyclobenzaprine'
  ]
  
  // Check for specialty drugs first (most expensive)
  for (const specialty of specialtyIndicators) {
    if (medication.includes(specialty)) {
      return 'specialty'
    }
  }
  
  // Check for generic drugs
  for (const generic of genericIndicators) {
    if (medication.includes(generic)) {
      return 'generic'
    }
  }
  
  // Default to preferred brand if not clearly generic or specialty
  return 'preferred'
}

interface EnhancedCostData {
  serviceName: string
  policyQuotedCost: number
  marketEstimate: CostEstimate
  finalCost: number
  costSource: 'policy' | 'market_estimate'
}

interface EnhancedMemberBreakdown extends Omit<MemberCostBreakdown, 'primaryCareVisits' | 'specialistVisits' | 'medications' | 'diagnosticTests' | 'plannedVisits'> {
  primaryCareVisits: { count: number; costData: EnhancedCostData; total: number }
  specialistVisits: { count: number; costData: EnhancedCostData; total: number }
  medications: { count: number; costData: EnhancedCostData; total: number }
  diagnosticTests: { count: number; costData: EnhancedCostData; total: number }
  plannedVisits: Array<{ 
    name: string; 
    frequency: number; 
    costData: EnhancedCostData; 
    total: number 
  }>
}

export interface EnhancedPolicyAnalysis extends Omit<PolicyAnalysis, 'memberBreakdowns'> {
  memberBreakdowns: EnhancedMemberBreakdown[]
  costDataSources: {
    totalPolicyBased: number
    totalMarketBased: number
    reliabilityScore: number
  }
}

function extractPolicyCost(policy: SBCData, serviceName: string, networkType: string): number {
  const service = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes(serviceName.toLowerCase())
  )
  
  if (!service) return 0
  
  const costString = networkType === 'out-of-network' 
    ? service.what_you_will_pay.out_of_network_provider
    : service.what_you_will_pay.network_provider
  
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
  
  // Percentage copay - will need market estimate to calculate
  if (lowerCost.includes('%')) {
    const percentMatch = costString.match(/(\d+)%/);
    if (percentMatch) {
      return -parseInt(percentMatch[1]); // Return negative to indicate percentage
    }
  }
  
  return -1 // Indicates unclear pricing, need market estimate
}

async function getEnhancedCostData(
  policy: SBCData,
  serviceName: string,
  serviceDescription: string,
  networkType: 'in-network' | 'out-of-network' | 'both'
): Promise<EnhancedCostData> {
  const policyQuotedCost = extractPolicyCost(policy, serviceName, networkType)
  
  // Get market estimate
  const marketEstimate = await getMedicalCostEstimate(
    serviceName,
    serviceDescription,
    networkType === 'both' ? 'in-network' : networkType
  )
  
  let finalCost: number
  let costSource: 'policy' | 'market_estimate'
  
  if (policyQuotedCost > 0) {
    // Use policy cost if available and reasonable
    finalCost = policyQuotedCost
    costSource = 'policy'
  } else if (policyQuotedCost < 0 && policyQuotedCost !== -1) {
    // Handle percentage copay
    const percentage = Math.abs(policyQuotedCost)
    finalCost = Math.round((percentage / 100) * marketEstimate.averageCost)
    costSource = 'market_estimate'
  } else {
    // Use market estimate for unclear policy pricing
    finalCost = marketEstimate.averageCost
    costSource = 'market_estimate'
  }
  
  // For "both" networks, use weighted average
  if (networkType === 'both' && costSource === 'market_estimate') {
    const outOfNetworkEstimate = await getMedicalCostEstimate(
      serviceName,
      serviceDescription,
      'out-of-network'
    )
    finalCost = Math.round((finalCost * 0.8) + (outOfNetworkEstimate.averageCost * 0.2))
  }
  
  return {
    serviceName: `${serviceName} - ${serviceDescription}`,
    policyQuotedCost: policyQuotedCost > 0 ? policyQuotedCost : 0,
    marketEstimate,
    finalCost,
    costSource
  }
}

async function calculateEnhancedMemberCosts(
  policy: SBCData,
  member: HealthProfileMember,
  memberIndex: number,
  config: AnalysisConfig
): Promise<EnhancedMemberBreakdown> {
  
  // Prepare all cost requests for batch processing
  const costRequests = [
    {
      serviceType: 'primary care',
      description: member.conditions.length > 0 
        ? `Primary care visit for patient with ${member.conditions.slice(0, 2).join(', ')}` 
        : 'Routine primary care visit',
      networkType: config.networkType
    },
    {
      serviceType: 'specialist',
      description: member.conditions.length > 0
        ? `Specialist consultation for ${member.conditions.slice(0, 2).join(', ')}`
        : 'General specialist consultation',
      networkType: config.networkType
    },
    {
      serviceType: 'diagnostic tests',
      description: member.conditions.length > 0
        ? `Diagnostic testing for ${member.conditions.slice(0, 2).join(', ')}`
        : 'Routine diagnostic tests (blood work, urinalysis)',
      networkType: config.networkType
    }
  ]
  
  // Add medication requests - analyze each medication individually by drug type
  member.medications.forEach(medication => {
    const drugType = predictDrugType(medication)
    const serviceType = drugType === 'specialty' ? 'specialty drugs' : 
                       drugType === 'preferred' ? 'preferred brand drugs' : 'generic drugs'
    
    costRequests.push({
      serviceType,
      description: `${drugType.charAt(0).toUpperCase() + drugType.slice(1)} prescription fill for ${medication}`,
      networkType: config.networkType
    })
  })
  
  // Add planned visits to cost requests
  member.visits.forEach(visit => {
    costRequests.push({
      serviceType: visit.name,
      description: `${visit.name} session`,
      networkType: config.networkType
    })
  })
  
  // Get all cost estimates in batch
  const costEstimates = await getBatchMedicalCosts(costRequests)
  
  // Calculate visit counts based on age and health profile
  const age = member.age || 25 // Default to adult if age not specified
  
  // Age-based healthcare utilization patterns
  let basePrimaryCareVisits = 2 // Default adult baseline
  let baseDiagnosticTests = 1 // Default adult baseline
  
  // Adjust based on age groups following medical best practices
  if (age < 2) {
    basePrimaryCareVisits = 8 // Monthly for first year, then quarterly
    baseDiagnosticTests = 3 // Multiple screenings, hearing, vision, development
  } else if (age < 6) {
    basePrimaryCareVisits = 4 // Quarterly visits
    baseDiagnosticTests = 2 // Annual screenings plus additional as needed
  } else if (age < 13) {
    basePrimaryCareVisits = 2 // Annual well-child + sick visits
    baseDiagnosticTests = 1 // Annual screenings
  } else if (age < 18) {
    basePrimaryCareVisits = 2 // Annual physical + additional care
    baseDiagnosticTests = 1 // Annual screenings
  } else if (age < 30) {
    basePrimaryCareVisits = 1 // Many young adults skip annual visits
    baseDiagnosticTests = 1 // Basic annual screening
  } else if (age < 40) {
    basePrimaryCareVisits = 2 // Annual physical + occasional sick visits
    baseDiagnosticTests = 1 // Annual screenings
  } else if (age < 50) {
    basePrimaryCareVisits = 2 // Annual physical + follow-ups
    baseDiagnosticTests = 2 // More comprehensive screenings
  } else if (age < 65) {
    basePrimaryCareVisits = 3 // More frequent monitoring
    baseDiagnosticTests = 3 // Colonoscopy, mammograms, etc.
  } else if (age < 75) {
    basePrimaryCareVisits = 4 // Quarterly check-ins
    baseDiagnosticTests = 3 // Regular screenings and monitoring
  } else {
    basePrimaryCareVisits = 6 // More frequent visits for safety and health
    baseDiagnosticTests = 4 // Comprehensive monitoring
  }
  
  const primaryCareCount = basePrimaryCareVisits + member.conditions.length
  
  // Specialist visits: age-adjusted baseline plus condition-driven needs
  let specialistCount = member.conditions.length
  if (age >= 50) {
    specialistCount += 1 // Likely to see at least one specialist annually (cardio, eye, etc.)
  }
  if (age >= 65) {
    specialistCount += 1 // Additional specialists for senior care
  }
  
  const diagnosticCount = baseDiagnosticTests + Math.floor(member.conditions.length / 2)
  
  // Create enhanced cost data
  const primaryCareCostData: EnhancedCostData = {
    serviceName: costRequests[0].description,
    policyQuotedCost: extractPolicyCost(policy, 'primary care', config.networkType),
    marketEstimate: costEstimates[0],
    finalCost: costEstimates[0].averageCost,
    costSource: 'market_estimate'
  }
  
  const specialistCostData: EnhancedCostData = {
    serviceName: costRequests[1].description,
    policyQuotedCost: extractPolicyCost(policy, 'specialist', config.networkType),
    marketEstimate: costEstimates[1],
    finalCost: costEstimates[1].averageCost,
    costSource: 'market_estimate'
  }
  
  const diagnosticCostData: EnhancedCostData = {
    serviceName: costRequests[2].description,
    policyQuotedCost: extractPolicyCost(policy, 'diagnostic', config.networkType),
    marketEstimate: costEstimates[2],
    finalCost: costEstimates[2].averageCost,
    costSource: 'market_estimate'
  }
  
  // Handle medications individually
  let medicationTotal = 0
  let medicationCostData: EnhancedCostData = {
    serviceName: 'No medications',
    policyQuotedCost: 0,
    marketEstimate: { averageCost: 0, lowCost: 0, highCost: 0, source: 'N/A' },
    finalCost: 0,
    costSource: 'market_estimate'
  }
  
  if (member.medications.length > 0) {
    // Calculate total medication costs from individual drug estimates
    const medicationCosts = member.medications.map((medication, index) => {
      const drugType = predictDrugType(medication)
      const costEstimate = costEstimates[3 + index] // Medications start after diagnostic at index 3
      const annualCost = costEstimate.averageCost * 12 // 12 fills per year
      medicationTotal += annualCost
      return {
        medication,
        drugType,
        costEstimate,
        annualCost
      }
    })
    
    // Create a summary medication cost data
    const avgCostPerFill = medicationTotal / (member.medications.length * 12)
    medicationCostData = {
      serviceName: `Medications: ${member.medications.join(', ')}`,
      policyQuotedCost: 0, // Will be calculated based on individual drug types
      marketEstimate: {
        averageCost: avgCostPerFill,
        lowCost: Math.min(...medicationCosts.map(m => m.costEstimate.lowCost)),
        highCost: Math.max(...medicationCosts.map(m => m.costEstimate.highCost)),
        source: 'Individual medication analysis'
      },
      finalCost: avgCostPerFill,
      costSource: 'market_estimate'
    }
  }
  
  // Handle planned visits (they come after medications in the cost estimates array)
  const visitStartIndex = 3 + member.medications.length
  const plannedVisits = member.visits.map((visit, index) => {
    const frequency = parseFloat(visit.frequency.match(/(\d+)/)?.[1] || '1')
    const costEstimate = costEstimates[visitStartIndex + index]
    
    return {
      name: visit.name,
      frequency,
      costData: {
        serviceName: visit.name,
        policyQuotedCost: 0,
        marketEstimate: costEstimate,
        finalCost: costEstimate.averageCost,
        costSource: 'market_estimate' as const
      },
      total: costEstimate.averageCost * frequency
    }
  })
  
  const primaryCareTotal = primaryCareCostData.finalCost * primaryCareCount
  const specialistTotal = specialistCostData.finalCost * specialistCount
  const diagnosticTotal = diagnosticCostData.finalCost * diagnosticCount
  const plannedVisitsTotal = plannedVisits.reduce((sum, visit) => sum + visit.total, 0)
  
  const memberTotal = primaryCareTotal + specialistTotal + medicationTotal + diagnosticTotal + plannedVisitsTotal
  
  return {
    memberIndex,
    primaryCareVisits: { count: primaryCareCount, costData: primaryCareCostData, total: primaryCareTotal },
    specialistVisits: { count: specialistCount, costData: specialistCostData, total: specialistTotal },
    medications: { count: member.medications.length * 12, costData: medicationCostData, total: medicationTotal },
    diagnosticTests: { count: diagnosticCount, costData: diagnosticCostData, total: diagnosticTotal },
    plannedVisits,
    memberTotal
  }
}

export async function runEnhancedPolicyAnalysis(
  policies: SBCData[],
  healthProfile: HealthProfileMember[],
  config: AnalysisConfig
): Promise<EnhancedPolicyAnalysis[]> {
  const results: EnhancedPolicyAnalysis[] = []
  
  const estimatedMonthlyPremium = healthProfile.length > 1 ? 450 : 250
  
  for (const policy of policies) {
    const memberBreakdowns: EnhancedMemberBreakdown[] = []
    
    // Calculate enhanced costs for each member
    for (let i = 0; i < healthProfile.length; i++) {
      const memberCosts = await calculateEnhancedMemberCosts(policy, healthProfile[i], i, config)
      memberBreakdowns.push(memberCosts)
    }
    
    // Calculate totals and reliability metrics
    const totalMedicalCosts = memberBreakdowns.reduce((sum, member) => sum + member.memberTotal, 0)
    
    let totalPolicyBased = 0
    let totalMarketBased = 0
    
    memberBreakdowns.forEach(member => {
      if (member.primaryCareVisits.costData.costSource === 'policy') totalPolicyBased += member.primaryCareVisits.total
      else totalMarketBased += member.primaryCareVisits.total
      
      if (member.specialistVisits.costData.costSource === 'policy') totalPolicyBased += member.specialistVisits.total
      else totalMarketBased += member.specialistVisits.total
      
      if (member.medications.costData.costSource === 'policy') totalPolicyBased += member.medications.total
      else totalMarketBased += member.medications.total
      
      if (member.diagnosticTests.costData.costSource === 'policy') totalPolicyBased += member.diagnosticTests.total
      else totalMarketBased += member.diagnosticTests.total
      
      member.plannedVisits.forEach(visit => {
        if (visit.costData.costSource === 'policy') totalPolicyBased += visit.total
        else totalMarketBased += visit.total
      })
    })
    
    const reliabilityScore = Math.round((totalPolicyBased / (totalPolicyBased + totalMarketBased)) * 100)
    
    // Apply insurance calculations
    const relevantDeductible = healthProfile.length > 1 
      ? policy.important_questions.overall_deductible.in_network.family
      : policy.important_questions.overall_deductible.in_network.individual
    
    const deductibleApplied = Math.min(totalMedicalCosts, relevantDeductible)
    const coinsuranceApplied = Math.max(0, totalMedicalCosts - relevantDeductible) * 0.2
    
    const outOfPocketMax = healthProfile.length > 1
      ? policy.important_questions.out_of_pocket_limit_for_plan.in_network.family
      : policy.important_questions.out_of_pocket_limit_for_plan.in_network.individual
    
    const finalMedicalCosts = Math.min(deductibleApplied + coinsuranceApplied, outOfPocketMax)
    const totalAnnualCost = (estimatedMonthlyPremium * 12) + finalMedicalCosts
    
    // Calculate grade
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
      },
      costDataSources: {
        totalPolicyBased: Math.round(totalPolicyBased),
        totalMarketBased: Math.round(totalMarketBased),
        reliabilityScore
      }
    })
  }
  
  return results
}