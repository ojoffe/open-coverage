"use server"

import type { SBCData } from "@/lib/sbc-schema"
import type { HealthProfileMember } from "@/lib/health-profile-store"
import { getMedicalCostEstimate, getBatchMedicalCosts, type CostEstimate } from "./get-medical-costs"
import type { AnalysisConfig } from "./calculate-analysis"

export interface ServicePricing {
  serviceId: string
  serviceName: string
  description: string
  memberIndex: number
  frequency: number
  policyQuotedCost: number
  marketEstimate: CostEstimate
  recommendedCost: number
  costSource: 'policy' | 'market_estimate' | 'percentage_of_market'
  notes?: string
}

export interface PricingRetrievalResult {
  services: ServicePricing[]
  totalServices: number
  policyBasedServices: number
  marketBasedServices: number
  percentageBasedServices: number
}

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

function extractPolicyCost(policy: SBCData, serviceName: string, networkType: string): { cost: number; type: 'fixed' | 'percentage' | 'unclear' } {
  // Handle different drug type mappings
  let searchTerm = serviceName.toLowerCase()
  if (serviceName === 'preferred') {
    searchTerm = 'preferred brand'
  } else if (serviceName === 'specialty') {
    searchTerm = 'specialty'
  }
  
  const service = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes(searchTerm)
  )
  
  if (!service) return { cost: 0, type: 'unclear' }
  
  const costString = networkType === 'out-of-network' 
    ? service.what_you_will_pay.out_of_network_provider
    : service.what_you_will_pay.network_provider
  
  const lowerCost = costString.toLowerCase()
  
  // Not covered = very high cost
  if (lowerCost.includes('not covered') || lowerCost.includes('no coverage')) {
    return { cost: 10000, type: 'fixed' }
  }
  
  // Free/no charge = 0
  if (lowerCost.includes('no charge') || lowerCost.includes('free')) {
    return { cost: 0, type: 'fixed' }
  }
  
  // Extract dollar amount
  const match = costString.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    return { cost: parseFloat(match[1].replace(/,/g, '')), type: 'fixed' }
  }
  
  // Percentage copay
  if (lowerCost.includes('%')) {
    const percentMatch = costString.match(/(\d+)%/);
    if (percentMatch) {
      return { cost: parseInt(percentMatch[1]), type: 'percentage' }
    }
  }
  
  return { cost: 0, type: 'unclear' }
}

export async function retrievePricingForAnalysis(
  policies: SBCData[],
  healthProfile: HealthProfileMember[],
  config: AnalysisConfig
): Promise<PricingRetrievalResult[]> {
  const results: PricingRetrievalResult[] = []
  
  for (const policy of policies) {
    const services: ServicePricing[] = []
    let serviceIdCounter = 0
    
    // Collect all services needed for each member
    const costRequests: Array<{
      serviceType: string
      description: string
      networkType: 'in-network' | 'out-of-network'
      memberIndex: number
      frequency: number
      serviceId: string
      policyServiceName: string
    }> = []
    
    healthProfile.forEach((member, memberIndex) => {
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
      
      // Primary care visits: age-appropriate baseline + conditions
      const primaryCareCount = basePrimaryCareVisits + member.conditions.length
      costRequests.push({
        serviceType: 'primary care',
        description: member.conditions.length > 0 
          ? `Primary care visit for patient with ${member.conditions.slice(0, 2).join(', ')}` 
          : 'Routine primary care visit',
        networkType: config.networkType === 'both' ? 'in-network' : config.networkType,
        memberIndex,
        frequency: primaryCareCount,
        serviceId: `${serviceIdCounter++}`,
        policyServiceName: 'primary care'
      })
      
      // Specialist visits: age-adjusted baseline plus condition-driven needs
      let specialistCount = member.conditions.length
      if (age >= 50) {
        specialistCount += 1 // Likely to see at least one specialist annually (cardio, eye, etc.)
      }
      if (age >= 65) {
        specialistCount += 1 // Additional specialists for senior care
      }
      
      if (specialistCount > 0) {
        costRequests.push({
          serviceType: 'specialist',
          description: member.conditions.length > 0
            ? `Specialist consultation for ${member.conditions.slice(0, 2).join(', ')}`
            : age >= 50 
              ? 'Age-appropriate specialist consultation (cardiology, ophthalmology, etc.)'
              : 'Specialist consultation',
          networkType: config.networkType === 'both' ? 'in-network' : config.networkType,
          memberIndex,
          frequency: specialistCount,
          serviceId: `${serviceIdCounter++}`,
          policyServiceName: 'specialist'
        })
      }
      
      // Medications (12 fills per medication) - analyze each medication individually
      member.medications.forEach(medication => {
        const drugType = predictDrugType(medication)
        const serviceType = drugType === 'specialty' ? 'specialty drugs' : 
                           drugType === 'preferred' ? 'preferred brand drugs' : 'generic drugs'
        
        costRequests.push({
          serviceType,
          description: `${drugType.charAt(0).toUpperCase() + drugType.slice(1)} prescription fills for ${medication}`,
          networkType: config.networkType === 'both' ? 'in-network' : config.networkType,
          memberIndex,
          frequency: 12, // 12 fills per year per medication
          serviceId: `${serviceIdCounter++}`,
          policyServiceName: drugType
        })
      })
      
      // Diagnostic tests: age-appropriate baseline + condition-based
      const diagnosticCount = baseDiagnosticTests + Math.floor(member.conditions.length / 2)
      costRequests.push({
        serviceType: 'diagnostic tests',
        description: member.conditions.length > 0
          ? `Diagnostic testing for ${member.conditions.slice(0, 2).join(', ')}`
          : age < 6 
            ? 'Pediatric screening tests (hearing, vision, development)'
            : age >= 50
              ? 'Age-appropriate screening tests (colonoscopy, mammogram, cardiac screening)'
              : 'Routine diagnostic tests (blood work, urinalysis)',
        networkType: config.networkType === 'both' ? 'in-network' : config.networkType,
        memberIndex,
        frequency: diagnosticCount,
        serviceId: `${serviceIdCounter++}`,
        policyServiceName: 'diagnostic'
      })
      
      // Planned visits
      member.visits.forEach(visit => {
        const frequency = parseFloat(visit.frequency.match(/(\d+)/)?.[1] || '1')
        costRequests.push({
          serviceType: visit.name,
          description: `${visit.name} session`,
          networkType: config.networkType === 'both' ? 'in-network' : config.networkType,
          memberIndex,
          frequency,
          serviceId: `${serviceIdCounter++}`,
          policyServiceName: visit.name
        })
      })
    })
    
    // Get market estimates for all services
    const marketEstimates = await getBatchMedicalCosts(costRequests.map(req => ({
      serviceType: req.serviceType,
      description: req.description,
      networkType: req.networkType
    })))
    
    // Process each service
    costRequests.forEach((request, index) => {
      const marketEstimate = marketEstimates[index]
      const policyResult = extractPolicyCost(policy, request.policyServiceName, request.networkType)
      
      let recommendedCost: number
      let costSource: 'policy' | 'market_estimate' | 'percentage_of_market'
      let notes: string | undefined
      
      if (policyResult.type === 'fixed' && policyResult.cost > 0) {
        recommendedCost = policyResult.cost
        costSource = 'policy'
        notes = `Using policy-quoted cost of $${policyResult.cost}`
      } else if (policyResult.type === 'percentage') {
        recommendedCost = Math.round((policyResult.cost / 100) * marketEstimate.averageCost)
        costSource = 'percentage_of_market'
        notes = `${policyResult.cost}% of market rate ($${marketEstimate.averageCost})`
      } else {
        recommendedCost = marketEstimate.averageCost
        costSource = 'market_estimate'
        notes = policyResult.type === 'unclear' 
          ? 'Policy pricing unclear, using market estimate'
          : 'Using market research for accurate pricing'
      }
      
      services.push({
        serviceId: request.serviceId,
        serviceName: request.serviceType,
        description: request.description,
        memberIndex: request.memberIndex,
        frequency: request.frequency,
        policyQuotedCost: policyResult.type === 'fixed' ? policyResult.cost : 0,
        marketEstimate,
        recommendedCost,
        costSource,
        notes
      })
    })
    
    // Calculate summary statistics
    const policyBasedServices = services.filter(s => s.costSource === 'policy').length
    const marketBasedServices = services.filter(s => s.costSource === 'market_estimate').length
    const percentageBasedServices = services.filter(s => s.costSource === 'percentage_of_market').length
    
    results.push({
      services,
      totalServices: services.length,
      policyBasedServices,
      marketBasedServices,
      percentageBasedServices
    })
  }
  
  return results
}