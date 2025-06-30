// Insurance Cost Calculator Engine
// Calculates actual out-of-pocket costs based on insurance policy mechanics

import { EnhancedTreatmentPlan } from "./enhanced-treatment-plan-generator"

export interface InsurancePolicy {
  id: string
  name: string
  carrier: string
  type: 'HMO' | 'PPO' | 'EPO' | 'HDHP' | 'POS'
  
  // Premium costs
  premium: {
    individual: number
    family: number
    employer_contribution?: number
  }
  
  // Deductibles
  deductible: {
    individual: number
    family: number
    embedded: boolean // Whether individual deductibles apply within family plan
  }
  
  // Out-of-pocket maximums
  outOfPocketMax: {
    individual: number
    family: number
  }
  
  // Cost sharing
  coinsurance: number // Percentage after deductible (e.g., 0.2 for 20%)
  
  // Service-specific copays/coinsurance
  costSharing: {
    primaryCare: { copay?: number; coinsurance?: number }
    specialist: { copay?: number; coinsurance?: number }
    urgentCare: { copay?: number; coinsurance?: number }
    emergencyRoom: { copay?: number; coinsurance?: number; waived_if_admitted?: boolean }
    labWork: { copay?: number; coinsurance?: number }
    imaging: { copay?: number; coinsurance?: number }
    genericDrugs: { copay?: number; coinsurance?: number; tier: 1 }
    preferredBrandDrugs: { copay?: number; coinsurance?: number; tier: 2 }
    nonPreferredBrandDrugs: { copay?: number; coinsurance?: number; tier: 3 }
    specialtyDrugs: { copay?: number; coinsurance?: number; tier: 4 }
    preventiveCare: { copay: 0; coinsurance: 0 } // ACA requirement
  }
  
  // Network
  network: {
    size: 'narrow' | 'standard' | 'broad'
    outOfNetworkCoverage: boolean
    outOfNetworkDeductible?: number
    outOfNetworkCoinsurance?: number
    outOfNetworkOopMax?: number
  }
  
  // Additional benefits
  benefits?: {
    hsaEligible?: boolean
    hsaContribution?: number
    fsaEligible?: boolean
    wellnessRewards?: number
    telehealth?: { copay: number }
  }
}

export interface MonthlyExpense {
  month: number
  premium: number
  medical: {
    services: Array<{
      name: string
      cost: number
      coveredAmount: number
      yourCost: number
      appliedToDeductible: number
    }>
    totalCost: number
    totalCovered: number
    totalYourCost: number
  }
  medications: {
    drugs: Array<{
      name: string
      cost: number
      tier: number
      yourCost: number
    }>
    totalCost: number
    totalYourCost: number
  }
  runningTotals: {
    deductibleMet: number
    oopSpent: number
    premiumsPaid: number
  }
}

export interface PolicyCostAnalysis {
  policyId: string
  memberId: string
  annual: {
    premiums: number
    medicalCosts: number
    medicationCosts: number
    totalOutOfPocket: number
    totalCosts: number // premiums + out of pocket
    deductibleMet: number
    oopMaxReached: boolean
    hsaSavings?: number
  }
  monthly: MonthlyExpense[]
  scenarios: {
    bestCase: {
      description: string
      totalCost: number
      breakdown: { premiums: number; medical: number; medications: number }
    }
    likelyCase: {
      description: string
      totalCost: number
      breakdown: { premiums: number; medical: number; medications: number }
    }
    worstCase: {
      description: string
      totalCost: number
      breakdown: { premiums: number; medical: number; medications: number }
    }
  }
  keyMetrics: {
    breakEvenMonth: number | null // When total medical costs exceed premium difference
    deductibleMetMonth: number | null
    effectivePremium: number // Including HSA/wellness benefits
    riskProtection: 'low' | 'medium' | 'high'
  }
}

export class InsuranceCalculator {
  
  calculatePolicyCosts(
    policy: InsurancePolicy,
    treatmentPlan: EnhancedTreatmentPlan,
    familySize: number = 1
  ): PolicyCostAnalysis {
    // Initialize monthly expenses
    const monthlyExpenses: MonthlyExpense[] = []
    let runningDeductible = 0
    let runningOOP = 0
    let runningPremiums = 0
    
    // Calculate monthly premium
    const monthlyPremium = this.calculateMonthlyPremium(policy, familySize)
    
    // Distribute treatments across months
    const monthlyTreatments = this.distributeTreatmentsAcrossYear(treatmentPlan)
    const monthlyMedications = this.distributeMediacationsAcrossYear(treatmentPlan)
    
    // Calculate costs for each month
    for (let month = 1; month <= 12; month++) {
      runningPremiums += monthlyPremium
      
      const treatments = monthlyTreatments[month - 1] || []
      const medications = monthlyMedications[month - 1] || []
      
      // Calculate medical costs for this month
      const medicalCosts = this.calculateMedicalCosts(
        treatments,
        policy,
        runningDeductible,
        runningOOP
      )
      
      // Calculate medication costs for this month
      const medicationCosts = this.calculateMedicationCosts(
        medications,
        policy,
        runningDeductible,
        runningOOP
      )
      
      // Update running totals
      runningDeductible = Math.min(
        runningDeductible + medicalCosts.appliedToDeductible + medicationCosts.appliedToDeductible,
        policy.deductible.individual
      )
      
      runningOOP = Math.min(
        runningOOP + medicalCosts.totalYourCost + medicationCosts.totalYourCost,
        policy.outOfPocketMax.individual
      )
      
      monthlyExpenses.push({
        month,
        premium: monthlyPremium,
        medical: medicalCosts,
        medications: medicationCosts,
        runningTotals: {
          deductibleMet: runningDeductible,
          oopSpent: runningOOP,
          premiumsPaid: runningPremiums
        }
      })
    }
    
    // Calculate annual totals
    const annual = this.calculateAnnualTotals(monthlyExpenses, policy)
    
    // Generate scenarios
    const scenarios = this.generateScenarios(policy, treatmentPlan, annual)
    
    // Calculate key metrics
    const keyMetrics = this.calculateKeyMetrics(monthlyExpenses, policy, familySize)
    
    return {
      policyId: policy.id,
      memberId: treatmentPlan.memberId,
      annual,
      monthly: monthlyExpenses,
      scenarios,
      keyMetrics
    }
  }
  
  private calculateMonthlyPremium(policy: InsurancePolicy, familySize: number): number {
    const annualPremium = familySize > 1 ? policy.premium.family : policy.premium.individual
    const employerContribution = policy.premium.employer_contribution || 0
    return (annualPremium - employerContribution) / 12
  }
  
  private distributeTreatmentsAcrossYear(plan: EnhancedTreatmentPlan) {
    const monthlyTreatments: any[][] = Array(12).fill(null).map(() => [])
    
    // Distribute treatments evenly across months
    const allTreatments = [...plan.treatments, ...plan.preventiveCare]
    allTreatments.forEach(treatment => {
      const monthsBetween = Math.floor(12 / treatment.annualFrequency)
      for (let i = 0; i < treatment.annualFrequency; i++) {
        const month = (i * monthsBetween) % 12
        monthlyTreatments[month].push({
          name: treatment.name,
          category: treatment.category,
          cost: treatment.estimatedUnitCost || this.getDefaultCost(treatment.category),
          isPreventive: treatment.isPreventive
        })
      }
    })
    
    return monthlyTreatments
  }
  
  private distributeMediacationsAcrossYear(plan: EnhancedTreatmentPlan) {
    // Medications are monthly recurring
    return Array(12).fill(plan.medications.map(med => ({
      name: med.name,
      cost: med.monthlyCost || 100,
      tier: med.tier || 'generic'
    })))
  }
  
  private calculateMedicalCosts(
    treatments: any[],
    policy: InsurancePolicy,
    currentDeductible: number,
    currentOOP: number
  ) {
    const services: any[] = []
    let totalCost = 0
    let totalCovered = 0
    let totalYourCost = 0
    let appliedToDeductible = 0
    
    treatments.forEach(treatment => {
      const cost = treatment.cost
      totalCost += cost
      
      // Preventive care is covered 100%
      if (treatment.isPreventive) {
        services.push({
          name: treatment.name,
          cost,
          coveredAmount: cost,
          yourCost: 0,
          appliedToDeductible: 0
        })
        totalCovered += cost
        return
      }
      
      // Check if we've hit OOP max
      if (currentOOP >= policy.outOfPocketMax.individual) {
        services.push({
          name: treatment.name,
          cost,
          coveredAmount: cost,
          yourCost: 0,
          appliedToDeductible: 0
        })
        totalCovered += cost
        return
      }
      
      // Get service type and cost sharing
      const costSharing = this.getCostSharing(treatment.category, policy)
      let yourCost = 0
      let coveredAmount = 0
      let deductibleAmount = 0
      
      // Apply copay if exists and deductible is met
      if (costSharing.copay !== undefined && currentDeductible >= policy.deductible.individual) {
        yourCost = costSharing.copay
        coveredAmount = cost - yourCost
      }
      // Otherwise apply deductible then coinsurance
      else {
        const remainingDeductible = policy.deductible.individual - currentDeductible
        
        if (remainingDeductible > 0) {
          deductibleAmount = Math.min(cost, remainingDeductible)
          yourCost += deductibleAmount
          appliedToDeductible += deductibleAmount
        }
        
        const afterDeductible = cost - deductibleAmount
        if (afterDeductible > 0) {
          const coinsurance = costSharing.coinsurance || policy.coinsurance
          yourCost += afterDeductible * coinsurance
          coveredAmount = afterDeductible * (1 - coinsurance)
        }
      }
      
      // Cap at OOP max
      const remainingOOP = policy.outOfPocketMax.individual - currentOOP
      if (yourCost > remainingOOP) {
        coveredAmount += (yourCost - remainingOOP)
        yourCost = remainingOOP
      }
      
      services.push({
        name: treatment.name,
        cost,
        coveredAmount,
        yourCost,
        appliedToDeductible: deductibleAmount
      })
      
      totalCovered += coveredAmount
      totalYourCost += yourCost
    })
    
    return {
      services,
      totalCost,
      totalCovered,
      totalYourCost,
      appliedToDeductible
    }
  }
  
  private calculateMedicationCosts(
    medications: any[],
    policy: InsurancePolicy,
    currentDeductible: number,
    currentOOP: number
  ) {
    const drugs: any[] = []
    let totalCost = 0
    let totalYourCost = 0
    let appliedToDeductible = 0
    
    medications.forEach(med => {
      const cost = med.cost
      totalCost += cost
      
      // Check if we've hit OOP max
      if (currentOOP >= policy.outOfPocketMax.individual) {
        drugs.push({
          name: med.name,
          cost,
          tier: med.tier,
          yourCost: 0
        })
        return
      }
      
      // Get tier-specific cost sharing
      const tierMap = {
        'generic': policy.costSharing.genericDrugs,
        'preferred_brand': policy.costSharing.preferredBrandDrugs,
        'non_preferred_brand': policy.costSharing.nonPreferredBrandDrugs,
        'specialty': policy.costSharing.specialtyDrugs
      }
      
      const costSharing = tierMap[med.tier as keyof typeof tierMap] || policy.costSharing.genericDrugs
      let yourCost = 0
      
      // Apply copay if exists
      if (costSharing.copay !== undefined) {
        yourCost = Math.min(costSharing.copay, cost)
      }
      // Otherwise apply coinsurance
      else if (costSharing.coinsurance !== undefined) {
        yourCost = cost * costSharing.coinsurance
      }
      
      // Cap at OOP max
      const remainingOOP = policy.outOfPocketMax.individual - currentOOP
      if (yourCost > remainingOOP) {
        yourCost = remainingOOP
      }
      
      drugs.push({
        name: med.name,
        cost,
        tier: costSharing.tier,
        yourCost
      })
      
      totalYourCost += yourCost
    })
    
    return {
      drugs,
      totalCost,
      totalYourCost,
      appliedToDeductible
    }
  }
  
  private getCostSharing(category: string, policy: InsurancePolicy) {
    const categoryMap: Record<string, keyof typeof policy.costSharing> = {
      'office_visit': 'primaryCare',
      'specialist_visit': 'specialist',
      'urgent_care': 'urgentCare',
      'emergency_room': 'emergencyRoom',
      'diagnostic_lab': 'labWork',
      'diagnostic_imaging': 'imaging',
      'preventive_care': 'preventiveCare'
    }
    
    const key = categoryMap[category] || 'primaryCare'
    return policy.costSharing[key]
  }
  
  private getDefaultCost(category: string): number {
    const costs: Record<string, number> = {
      'office_visit': 150,
      'specialist_visit': 350,
      'emergency_room': 2000,
      'urgent_care': 175,
      'diagnostic_lab': 100,
      'diagnostic_imaging': 500,
      'procedure_minor': 1500,
      'procedure_major': 5000,
      'surgery_outpatient': 10000,
      'surgery_inpatient': 25000,
      'therapy_physical': 150,
      'therapy_mental': 200,
      'preventive_care': 100,
      'maternity_care': 500,
      'dental_care': 150,
      'vision_care': 100
    }
    return costs[category] || 200
  }
  
  private calculateAnnualTotals(monthlyExpenses: MonthlyExpense[], policy: InsurancePolicy) {
    const premiums = monthlyExpenses.reduce((sum, m) => sum + m.premium, 0)
    const medicalCosts = monthlyExpenses.reduce((sum, m) => sum + m.medical.totalYourCost, 0)
    const medicationCosts = monthlyExpenses.reduce((sum, m) => sum + m.medications.totalYourCost, 0)
    const totalOutOfPocket = medicalCosts + medicationCosts
    const lastMonth = monthlyExpenses[11]
    
    return {
      premiums,
      medicalCosts,
      medicationCosts,
      totalOutOfPocket,
      totalCosts: premiums + totalOutOfPocket,
      deductibleMet: lastMonth.runningTotals.deductibleMet,
      oopMaxReached: lastMonth.runningTotals.oopSpent >= policy.outOfPocketMax.individual,
      hsaSavings: policy.benefits?.hsaContribution
    }
  }
  
  private generateScenarios(
    policy: InsurancePolicy,
    plan: EnhancedTreatmentPlan,
    annual: PolicyCostAnalysis['annual']
  ) {
    const premium = policy.premium.individual - (policy.premium.employer_contribution || 0)
    
    return {
      bestCase: {
        description: "Only preventive care and minimal medication needs",
        totalCost: premium + (plan.totalAnnualCost.preventive * 0), // Preventive is free
        breakdown: {
          premiums: premium,
          medical: 0,
          medications: plan.totalAnnualCost.medications * 0.3 // Assume 30% of medication costs
        }
      },
      likelyCase: {
        description: "Expected treatments based on your conditions",
        totalCost: annual.totalCosts,
        breakdown: {
          premiums: annual.premiums,
          medical: annual.medicalCosts,
          medications: annual.medicationCosts
        }
      },
      worstCase: {
        description: "Major medical event requiring hospitalization",
        totalCost: premium + policy.outOfPocketMax.individual,
        breakdown: {
          premiums: premium,
          medical: policy.outOfPocketMax.individual * 0.8,
          medications: policy.outOfPocketMax.individual * 0.2
        }
      }
    }
  }
  
  private calculateKeyMetrics(
    monthlyExpenses: MonthlyExpense[],
    policy: InsurancePolicy,
    familySize: number
  ) {
    // Find when deductible is met
    const deductibleMetMonth = monthlyExpenses.findIndex(
      m => m.runningTotals.deductibleMet >= policy.deductible.individual
    ) + 1 || null
    
    // Calculate effective premium including HSA benefits
    const monthlyPremium = this.calculateMonthlyPremium(policy, familySize)
    const hsaBenefit = (policy.benefits?.hsaContribution || 0) / 12
    const effectivePremium = (monthlyPremium - hsaBenefit) * 12
    
    // Determine risk protection level
    let riskProtection: 'low' | 'medium' | 'high' = 'medium'
    if (policy.outOfPocketMax.individual <= 3000) riskProtection = 'high'
    else if (policy.outOfPocketMax.individual >= 8000) riskProtection = 'low'
    
    // Calculate break-even month (simplified - would need comparison policy)
    const breakEvenMonth = null // Would need another policy to compare
    
    return {
      breakEvenMonth,
      deductibleMetMonth,
      effectivePremium,
      riskProtection
    }
  }
  
  // Compare multiple policies
  comparePolicies(
    policies: InsurancePolicy[],
    treatmentPlan: EnhancedTreatmentPlan,
    familySize: number = 1
  ): {
    analyses: PolicyCostAnalysis[]
    recommendation: {
      bestValue: string
      bestForHealthyYear: string
      bestForMajorEvent: string
      summary: string
    }
  } {
    const analyses = policies.map(policy => 
      this.calculatePolicyCosts(policy, treatmentPlan, familySize)
    )
    
    // Find best policies for different scenarios
    const bestValue = analyses.reduce((best, current) => 
      current.annual.totalCosts < best.annual.totalCosts ? current : best
    )
    
    const bestForHealthy = analyses.reduce((best, current) => 
      current.scenarios.bestCase.totalCost < best.scenarios.bestCase.totalCost ? current : best
    )
    
    const bestForMajor = analyses.reduce((best, current) => 
      current.scenarios.worstCase.totalCost < best.scenarios.worstCase.totalCost ? current : best
    )
    
    return {
      analyses,
      recommendation: {
        bestValue: bestValue.policyId,
        bestForHealthyYear: bestForHealthy.policyId,
        bestForMajorEvent: bestForMajor.policyId,
        summary: this.generateRecommendationSummary(analyses, treatmentPlan)
      }
    }
  }
  
  private generateRecommendationSummary(
    analyses: PolicyCostAnalysis[],
    plan: EnhancedTreatmentPlan
  ): string {
    const sorted = [...analyses].sort((a, b) => a.annual.totalCosts - b.annual.totalCosts)
    const best = sorted[0]
    const savings = sorted[sorted.length - 1].annual.totalCosts - best.annual.totalCosts
    
    let summary = `Based on your health profile`
    
    if (plan.hasChronicConditions) {
      summary += ` with chronic conditions`
    }
    
    summary += `, the ${best.policyId} plan offers the best value with potential savings of $${savings.toLocaleString()} per year.`
    
    if (plan.emergencyRiskLevel === 'high') {
      summary += ` Given your higher emergency risk, we recommend prioritizing plans with lower out-of-pocket maximums.`
    }
    
    return summary
  }
}