// Convert parsed SBC documents to InsurancePolicy format for cost calculations

import { InsurancePolicy } from "./insurance-calculator"
import { SBCAnalysis } from "./sbc-schema"

export function convertSBCToPolicy(
  sbc: SBCAnalysis, 
  premiumData?: {
    individualMonthly: number
    familyMonthly?: number
    employerContribution?: number
  }
): InsurancePolicy {
  // Extract key financial values from medical events
  const deductibleEvent = sbc.medicalEvents?.find(e => 
    e.serviceName.toLowerCase().includes('deductible')
  )
  const oopMaxEvent = sbc.medicalEvents?.find(e => 
    e.serviceName.toLowerCase().includes('out-of-pocket') || 
    e.serviceName.toLowerCase().includes('out of pocket')
  )
  
  // Extract deductible amount
  const deductibleAmount = extractAmount(deductibleEvent?.inNetworkCost || '$0')
  
  // Extract OOP max amount
  const oopMaxAmount = extractAmount(oopMaxEvent?.inNetworkCost || '$8700')
  
  // Determine plan type from name or features
  const planType = detectPlanType(sbc)
  
  // Extract cost sharing for different services
  const costSharing = extractCostSharing(sbc)
  
  // Check if HSA eligible (high deductible health plan)
  const hsaEligible = deductibleAmount >= 1600 && planType === 'HDHP'
  
  return {
    id: sbc.id || generateId(sbc.planName),
    name: sbc.planName || 'Unknown Plan',
    carrier: sbc.insuranceCompany || 'Unknown Carrier',
    type: planType,
    
    premium: {
      individual: premiumData?.individualMonthly ? premiumData.individualMonthly * 12 : (extractPremium(sbc) || 500 * 12),
      family: premiumData?.familyMonthly ? premiumData.familyMonthly * 12 : (extractPremium(sbc) * 3 || 1500 * 12),
      employer_contribution: premiumData?.employerContribution ? premiumData.employerContribution * 12 : 0
    },
    
    deductible: {
      individual: deductibleAmount,
      family: deductibleAmount * 2, // Typically 2x individual
      embedded: true // Assume embedded for safety
    },
    
    outOfPocketMax: {
      individual: oopMaxAmount,
      family: oopMaxAmount * 2 // Typically 2x individual
    },
    
    // Extract coinsurance from medical events
    coinsurance: extractCoinsurance(sbc),
    
    costSharing,
    
    network: {
      size: 'standard', // Default assumption
      outOfNetworkCoverage: hasOutOfNetworkCoverage(sbc),
      outOfNetworkDeductible: deductibleAmount * 2,
      outOfNetworkCoinsurance: 0.5, // Default 50%
      outOfNetworkOopMax: oopMaxAmount * 2
    },
    
    benefits: {
      hsaEligible,
      fsaEligible: !hsaEligible, // Can't have both
      wellnessRewards: 0,
      telehealth: extractTelehealthBenefit(sbc)
    }
  }
}

function generateId(planName: string): string {
  // Handle undefined or empty planName
  if (!planName) {
    return `policy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  return planName.toLowerCase().replace(/[^a-z0-9]/g, '-')
}

function extractAmount(costString: string): number {
  // Remove all non-numeric characters except decimal point
  const cleanString = costString.replace(/[^0-9.]/g, '')
  const amount = parseFloat(cleanString)
  return isNaN(amount) ? 0 : Math.round(amount)
}

function detectPlanType(sbc: SBCAnalysis): InsurancePolicy['type'] {
  const name = sbc.planName?.toLowerCase() || ''
  
  if (name.includes('hmo')) return 'HMO'
  if (name.includes('ppo')) return 'PPO'
  if (name.includes('epo')) return 'EPO'
  if (name.includes('hdhp') || name.includes('high deductible')) return 'HDHP'
  if (name.includes('pos')) return 'POS'
  
  // Check deductible amount for HDHP
  const deductibleEvent = sbc.medicalEvents?.find(e => 
    e.serviceName.toLowerCase().includes('deductible')
  )
  const deductibleAmount = extractAmount(deductibleEvent?.inNetworkCost || '0')
  if (deductibleAmount >= 1600) return 'HDHP'
  
  return 'PPO' // Default
}

function extractPremium(sbc: SBCAnalysis): number {
  // SBC documents typically don't include premium information
  // This would need to come from another source
  // Return 0 to indicate unknown
  return 0
}

function extractCoinsurance(sbc: SBCAnalysis): number {
  // Look for coinsurance in medical events
  const events = sbc.medicalEvents || []
  
  // Find events with percentage-based cost sharing
  for (const event of events) {
    const cost = event.inNetworkCost?.toLowerCase() || ''
    if (cost.includes('%') && !cost.includes('no charge') && !cost.includes('0%')) {
      const match = cost.match(/(\d+)%/)
      if (match) {
        return parseInt(match[1]) / 100
      }
    }
  }
  
  // Default coinsurance
  return 0.2 // 20%
}

function extractCostSharing(sbc: SBCAnalysis): InsurancePolicy['costSharing'] {
  const events = sbc.medicalEvents || []
  
  // Helper to extract copay or coinsurance from event
  const extractServiceCost = (keywords: string[]) => {
    const event = events.find(e => {
      const serviceName = e.serviceName.toLowerCase()
      return keywords.some(keyword => serviceName.includes(keyword))
    })
    
    if (!event) return { copay: 50 } // Default
    
    const cost = event.inNetworkCost || ''
    
    // Check for "No Charge"
    if (cost.toLowerCase().includes('no charge') || cost === '$0') {
      return { copay: 0 }
    }
    
    // Check for copay (dollar amount)
    if (cost.includes('$')) {
      return { copay: extractAmount(cost) }
    }
    
    // Check for coinsurance (percentage)
    if (cost.includes('%')) {
      const match = cost.match(/(\d+)%/)
      if (match) {
        return { coinsurance: parseInt(match[1]) / 100 }
      }
    }
    
    return { copay: 50 } // Default
  }
  
  return {
    primaryCare: extractServiceCost(['primary', 'office visit', 'pcp']),
    specialist: extractServiceCost(['specialist']),
    urgentCare: extractServiceCost(['urgent care']),
    emergencyRoom: extractServiceCost(['emergency room', 'emergency medical care']),
    labWork: extractServiceCost(['diagnostic test', 'blood test', 'lab']),
    imaging: extractServiceCost(['imaging', 'x-ray', 'mri', 'ct scan']),
    genericDrugs: { ...extractServiceCost(['generic', 'tier 1']), tier: 1 },
    preferredBrandDrugs: { ...extractServiceCost(['preferred brand', 'tier 2']), tier: 2 },
    nonPreferredBrandDrugs: { ...extractServiceCost(['non-preferred', 'tier 3']), tier: 3 },
    specialtyDrugs: { ...extractServiceCost(['specialty', 'tier 4']), tier: 4 },
    preventiveCare: { copay: 0, coinsurance: 0 } // ACA requirement
  }
}

function hasOutOfNetworkCoverage(sbc: SBCAnalysis): boolean {
  // Check if any medical events mention out-of-network costs
  const events = sbc.medicalEvents || []
  return events.some(event => 
    event.outOfNetworkCost && 
    !event.outOfNetworkCost.toLowerCase().includes('not covered')
  )
}

function extractTelehealthBenefit(sbc: SBCAnalysis): { copay: number } | undefined {
  const events = sbc.medicalEvents || []
  const telehealthEvent = events.find(e => 
    e.serviceName.toLowerCase().includes('telehealth') ||
    e.serviceName.toLowerCase().includes('virtual')
  )
  
  if (telehealthEvent) {
    const copay = extractAmount(telehealthEvent.inNetworkCost || '$40')
    return { copay }
  }
  
  return undefined
}

// Enhance SBC analysis with additional derived data
export function enhanceSBCAnalysis(sbc: SBCAnalysis): SBCAnalysis & {
  derivedData: {
    estimatedPremium: number
    planTier: 'bronze' | 'silver' | 'gold' | 'platinum'
    isHSAEligible: boolean
    hasDrugCoverage: boolean
    networkType: 'narrow' | 'standard' | 'broad'
  }
} {
  const policy = convertSBCToPolicy(sbc)
  
  // Estimate plan tier based on actuarial value
  const planTier = estimatePlanTier(policy)
  
  // Estimate premium based on plan tier and features
  const estimatedPremium = estimatePremiumByTier(planTier)
  
  // Check drug coverage
  const hasDrugCoverage = sbc.medicalEvents?.some(e => 
    e.serviceName.toLowerCase().includes('drug') ||
    e.serviceName.toLowerCase().includes('prescription')
  ) || false
  
  return {
    ...sbc,
    derivedData: {
      estimatedPremium,
      planTier,
      isHSAEligible: policy.benefits?.hsaEligible || false,
      hasDrugCoverage,
      networkType: policy.network.size
    }
  }
}

function estimatePlanTier(policy: InsurancePolicy): 'bronze' | 'silver' | 'gold' | 'platinum' {
  // Estimate based on deductible and OOP max
  const deductible = policy.deductible.individual
  const oopMax = policy.outOfPocketMax.individual
  
  if (deductible >= 6000 || oopMax >= 8000) return 'bronze'
  if (deductible >= 2000 || oopMax >= 6000) return 'silver'
  if (deductible >= 500 || oopMax >= 3000) return 'gold'
  return 'platinum'
}

function estimatePremiumByTier(tier: string): number {
  // Annual premium estimates by tier
  const premiums = {
    bronze: 3600,  // $300/month
    silver: 5400,  // $450/month
    gold: 7200,    // $600/month
    platinum: 9600 // $800/month
  }
  return premiums[tier as keyof typeof premiums] || 5400
}