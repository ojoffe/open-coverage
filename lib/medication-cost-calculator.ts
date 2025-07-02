// Medication Cost Calculator
// Provides detailed medication cost estimates based on drug type, dosage, and insurance coverage

import { MedicationDetail } from "./enhanced-treatment-mapping"

export interface MedicationCostEstimate {
  medicationId: string
  name: string
  genericName: string
  isGeneric: boolean
  isSpecialty: boolean
  monthlyCost: {
    retail: number
    mailOrder: number
    specialty: number
  }
  annualCost: number
  tier: 'generic' | 'preferred_brand' | 'non_preferred_brand' | 'specialty'
  requiresPriorAuth: boolean
  alternatives?: {
    name: string
    monthlyCost: number
    savings: number
  }[]
}

// Base medication costs by category
const medicationBaseCosts: Record<string, { retail: number; mailOrder: number; specialty: number }> = {
  // Common generics
  'metformin': { retail: 15, mailOrder: 10, specialty: 0 },
  'lisinopril': { retail: 12, mailOrder: 8, specialty: 0 },
  'amlodipine': { retail: 10, mailOrder: 7, specialty: 0 },
  'atorvastatin': { retail: 20, mailOrder: 15, specialty: 0 },
  'levothyroxine': { retail: 15, mailOrder: 10, specialty: 0 },
  'metoprolol': { retail: 15, mailOrder: 10, specialty: 0 },
  'omeprazole': { retail: 20, mailOrder: 15, specialty: 0 },
  'albuterol': { retail: 30, mailOrder: 25, specialty: 0 },
  'sertraline': { retail: 15, mailOrder: 10, specialty: 0 },
  'gabapentin': { retail: 20, mailOrder: 15, specialty: 0 },
  
  // Brand name drugs
  'eliquis': { retail: 550, mailOrder: 500, specialty: 0 },
  'xarelto': { retail: 550, mailOrder: 500, specialty: 0 },
  'jardiance': { retail: 600, mailOrder: 550, specialty: 0 },
  'ozempic': { retail: 0, mailOrder: 0, specialty: 1000 },
  'humira': { retail: 0, mailOrder: 0, specialty: 6500 },
  'enbrel': { retail: 0, mailOrder: 0, specialty: 6000 },
  'stelara': { retail: 0, mailOrder: 0, specialty: 12000 },
  'symbicort': { retail: 380, mailOrder: 350, specialty: 0 },
  'advair': { retail: 400, mailOrder: 370, specialty: 0 },
  'lantus': { retail: 450, mailOrder: 400, specialty: 0 },
  'humalog': { retail: 350, mailOrder: 320, specialty: 0 },
  
  // Specialty medications
  'remicade': { retail: 0, mailOrder: 0, specialty: 4000 },
  'keytruda': { retail: 0, mailOrder: 0, specialty: 13000 },
  'revlimid': { retail: 0, mailOrder: 0, specialty: 21000 },
  'harvoni': { retail: 0, mailOrder: 0, specialty: 31500 },
  'sovaldi': { retail: 0, mailOrder: 0, specialty: 28000 },
}

// Drug class average costs
const drugClassCosts: Record<string, { generic: number; brand: number; specialty: number }> = {
  'ace_inhibitors': { generic: 15, brand: 200, specialty: 0 },
  'beta_blockers': { generic: 15, brand: 150, specialty: 0 },
  'calcium_channel_blockers': { generic: 12, brand: 180, specialty: 0 },
  'statins': { generic: 20, brand: 300, specialty: 0 },
  'proton_pump_inhibitors': { generic: 20, brand: 280, specialty: 0 },
  'ssri_antidepressants': { generic: 15, brand: 250, specialty: 0 },
  'diabetes_oral': { generic: 25, brand: 400, specialty: 0 },
  'diabetes_glp1': { generic: 0, brand: 0, specialty: 1000 },
  'insulin': { generic: 150, brand: 350, specialty: 0 },
  'asthma_controllers': { generic: 50, brand: 400, specialty: 0 },
  'biologics': { generic: 0, brand: 0, specialty: 5000 },
  'oncology': { generic: 500, brand: 5000, specialty: 15000 },
  'hepatitis_c': { generic: 0, brand: 0, specialty: 30000 },
}

export class MedicationCostCalculator {
  
  calculateMedicationCost(medication: MedicationDetail): MedicationCostEstimate {
    const baseName = medication.genericName.toLowerCase().replace(/[^a-z]/g, '')
    
    // Check if we have specific pricing for this medication
    let costs = medicationBaseCosts[baseName]
    
    if (!costs) {
      // Fall back to drug class pricing
      const drugClass = this.getDrugClassKey(medication.drugClass)
      const classData = drugClassCosts[drugClass]
      
      if (classData) {
        if (medication.isSpecialty) {
          costs = { retail: 0, mailOrder: 0, specialty: classData.specialty }
        } else if (medication.brandNames.length > 0 && !this.isGenericAvailable(medication)) {
          costs = { retail: classData.brand, mailOrder: classData.brand * 0.9, specialty: 0 }
        } else {
          costs = { retail: classData.generic, mailOrder: classData.generic * 0.8, specialty: 0 }
        }
      } else {
        // Default fallback pricing
        if (medication.isSpecialty) {
          costs = { retail: 0, mailOrder: 0, specialty: 3000 }
        } else {
          costs = { retail: 100, mailOrder: 85, specialty: 0 }
        }
      }
    }
    
    // Apply dosage multiplier
    const dosageMultiplier = this.getDosageMultiplier(medication.dosageRange.typical)
    const adjustedCosts = {
      retail: Math.round(costs.retail * dosageMultiplier),
      mailOrder: Math.round(costs.mailOrder * dosageMultiplier),
      specialty: Math.round(costs.specialty * dosageMultiplier),
    }
    
    // Determine best price source
    const bestMonthlyCost = medication.isSpecialty 
      ? adjustedCosts.specialty
      : Math.min(adjustedCosts.retail, adjustedCosts.mailOrder)
    
    // Calculate annual cost
    const annualCost = bestMonthlyCost * 12
    
    // Determine tier
    const tier = this.determineTier(medication, bestMonthlyCost)
    
    // Find alternatives if applicable
    const alternatives = this.findAlternatives(medication, bestMonthlyCost)
    
    return {
      medicationId: medication.id,
      name: medication.name,
      genericName: medication.genericName,
      isGeneric: this.isGenericAvailable(medication),
      isSpecialty: medication.isSpecialty,
      monthlyCost: adjustedCosts,
      annualCost,
      tier,
      requiresPriorAuth: medication.requiresPriorAuth,
      alternatives
    }
  }
  
  private getDrugClassKey(drugClass: string): string {
    const normalized = drugClass.toLowerCase()
    
    if (normalized.includes('ace inhibitor')) return 'ace_inhibitors'
    if (normalized.includes('beta blocker')) return 'beta_blockers'
    if (normalized.includes('calcium channel')) return 'calcium_channel_blockers'
    if (normalized.includes('statin')) return 'statins'
    if (normalized.includes('proton pump') || normalized.includes('ppi')) return 'proton_pump_inhibitors'
    if (normalized.includes('ssri') || normalized.includes('antidepressant')) return 'ssri_antidepressants'
    if (normalized.includes('glp-1') || normalized.includes('glp1')) return 'diabetes_glp1'
    if (normalized.includes('insulin')) return 'insulin'
    if (normalized.includes('biologic')) return 'biologics'
    if (normalized.includes('oncology') || normalized.includes('cancer')) return 'oncology'
    
    return 'unknown'
  }
  
  private getDosageMultiplier(dosage: string): number {
    const normalized = dosage.toLowerCase()
    
    // Extract numeric values
    const matches = normalized.match(/(\d+)/g)
    if (!matches) return 1
    
    const value = parseInt(matches[0])
    
    // Check for frequency multipliers
    if (normalized.includes('twice') || normalized.includes('2x') || normalized.includes('bid')) {
      return 2
    }
    if (normalized.includes('three') || normalized.includes('3x') || normalized.includes('tid')) {
      return 3
    }
    if (normalized.includes('four') || normalized.includes('4x') || normalized.includes('qid')) {
      return 4
    }
    
    // Check for high doses
    if (normalized.includes('mg')) {
      if (value >= 1000) return 2 // High dose
      if (value >= 500) return 1.5 // Medium-high dose
    }
    
    return 1
  }
  
  private isGenericAvailable(medication: MedicationDetail): boolean {
    // Check if it's explicitly a generic
    if (medication.name.toLowerCase() === medication.genericName.toLowerCase()) {
      return true
    }
    
    // Check if brand names exist but generic is available
    const genericDrugs = [
      'metformin', 'lisinopril', 'amlodipine', 'atorvastatin',
      'levothyroxine', 'metoprolol', 'omeprazole', 'albuterol',
      'sertraline', 'gabapentin', 'simvastatin', 'losartan',
      'hydrochlorothiazide', 'furosemide', 'prednisone'
    ]
    
    return genericDrugs.some(drug => 
      medication.genericName.toLowerCase().includes(drug)
    )
  }
  
  private determineTier(medication: MedicationDetail, monthlyCost: number): MedicationCostEstimate['tier'] {
    if (medication.isSpecialty) return 'specialty'
    
    const isGeneric = this.isGenericAvailable(medication)
    
    if (isGeneric) return 'generic'
    
    // Brand name tier determination based on cost
    if (monthlyCost < 200) return 'preferred_brand'
    return 'non_preferred_brand'
  }
  
  private findAlternatives(
    medication: MedicationDetail, 
    currentCost: number
  ): MedicationCostEstimate['alternatives'] {
    const alternatives: MedicationCostEstimate['alternatives'] = []
    
    // Generic alternatives for brand drugs
    if (!this.isGenericAvailable(medication) && !medication.isSpecialty) {
      const genericCost = this.estimateGenericCost(medication.drugClass)
      if (genericCost < currentCost) {
        alternatives.push({
          name: `Generic ${medication.drugClass}`,
          monthlyCost: genericCost,
          savings: currentCost - genericCost
        })
      }
    }
    
    // Therapeutic alternatives
    const therapeuticAlts = this.getTherapeuticAlternatives(medication)
    therapeuticAlts.forEach(alt => {
      if (alt.monthlyCost < currentCost) {
        alternatives.push({
          name: alt.name,
          monthlyCost: alt.monthlyCost,
          savings: currentCost - alt.monthlyCost
        })
      }
    })
    
    return alternatives.sort((a, b) => b.savings - a.savings).slice(0, 3)
  }
  
  private estimateGenericCost(drugClass: string): number {
    const classKey = this.getDrugClassKey(drugClass)
    const classData = drugClassCosts[classKey]
    return classData?.generic || 20
  }
  
  private getTherapeuticAlternatives(medication: MedicationDetail): Array<{ name: string; monthlyCost: number }> {
    // Map of therapeutic alternatives
    const alternatives: Record<string, Array<{ name: string; monthlyCost: number }>> = {
      'jardiance': [
        { name: 'Metformin', monthlyCost: 15 },
        { name: 'Glipizide', monthlyCost: 10 }
      ],
      'ozempic': [
        { name: 'Metformin', monthlyCost: 15 },
        { name: 'Jardiance', monthlyCost: 600 },
        { name: 'Trulicity', monthlyCost: 900 }
      ],
      'eliquis': [
        { name: 'Warfarin', monthlyCost: 10 },
        { name: 'Xarelto', monthlyCost: 550 }
      ],
      'symbicort': [
        { name: 'Generic Advair', monthlyCost: 150 },
        { name: 'Breo Ellipta', monthlyCost: 380 }
      ],
      'humira': [
        { name: 'Methotrexate', monthlyCost: 20 },
        { name: 'Enbrel', monthlyCost: 6000 }
      ],
    }
    
    const medName = medication.name.toLowerCase()
    return alternatives[medName] || []
  }
  
  // Calculate total medication costs for a treatment plan
  calculatePlanMedicationCosts(medications: MedicationDetail[]): {
    totalMonthlyCost: number
    totalAnnualCost: number
    byTier: Record<string, { count: number; monthlyCost: number }>
    savingsOpportunities: Array<{ medication: string; potentialSavings: number }>
  } {
    const costs = medications.map(med => this.calculateMedicationCost(med))
    
    const totalMonthlyCost = costs.reduce((sum, cost) => 
      sum + Math.min(cost.monthlyCost.retail, cost.monthlyCost.mailOrder, cost.monthlyCost.specialty), 0
    )
    
    const byTier = costs.reduce((acc, cost) => {
      if (!acc[cost.tier]) {
        acc[cost.tier] = { count: 0, monthlyCost: 0 }
      }
      acc[cost.tier].count++
      acc[cost.tier].monthlyCost += Math.min(
        cost.monthlyCost.retail, 
        cost.monthlyCost.mailOrder, 
        cost.monthlyCost.specialty
      )
      return acc
    }, {} as Record<string, { count: number; monthlyCost: number }>)
    
    const savingsOpportunities = costs
      .filter(cost => cost.alternatives && cost.alternatives.length > 0)
      .map(cost => ({
        medication: cost.name,
        potentialSavings: cost.alternatives![0].savings * 12 // Annual savings
      }))
      .sort((a, b) => b.potentialSavings - a.potentialSavings)
    
    return {
      totalMonthlyCost,
      totalAnnualCost: totalMonthlyCost * 12,
      byTier,
      savingsOpportunities
    }
  }
}