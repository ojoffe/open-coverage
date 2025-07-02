export interface ConditionRiskProfile {
  condition: string
  category: 'chronic' | 'acute' | 'mental_health' | 'cancer' | 'neurological' | 'autoimmune' | 'cardiovascular' | 'metabolic'
  severity: 'mild' | 'moderate' | 'severe' | 'variable'
  riskScore: number // 1-10 scale for overall healthcare utilization risk
  utilizationImpact: {
    primaryCareVisits: number // Annual visits beyond baseline
    specialistVisits: number // Annual specialist visits
    emergencyRisk: number // Percentage chance of ER visit per year
    hospitalizationRisk: number // Percentage chance of hospitalization per year
    diagnosticTests: number // Annual diagnostic tests
    procedures: number // Annual procedures
    medications: {
      count: number // Number of medications typically needed
      categories: ('generic' | 'brand' | 'specialty' | 'biologic')[]
      monthlyEstimate: { min: number; max: number } // Cost range
    }
  }
  relatedConditions: string[] // Conditions that often occur together
  ageImpact: {
    under18: number // Multiplier for children
    '18-39': number // Multiplier for young adults
    '40-64': number // Multiplier for middle age
    '65+': number // Multiplier for seniors
  }
  complications: {
    condition: string
    risk: number // Percentage
    additionalCost: { min: number; max: number }
  }[]
  specialConsiderations?: string[]
}

export interface MedicationRiskProfile {
  medication: string
  category: 'generic' | 'brand' | 'specialty' | 'biologic'
  condition: string[] // Conditions this medication treats
  sideEffectRisk: 'low' | 'moderate' | 'high'
  monitoringRequired: boolean
  labFrequency?: number // Times per year
  interactionRisk: 'low' | 'moderate' | 'high'
  adherenceImpact: number // 1-10 scale for how critical adherence is
}

export interface AllergyRiskProfile {
  allergy: string
  type: 'food' | 'drug' | 'environmental' | 'other'
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  emergencyRisk: number // Percentage annual risk
  preventiveCare: string[]
  medicationRestrictions: string[]
}

// Comprehensive condition risk profiles
export const conditionRiskProfiles: Record<string, ConditionRiskProfile> = {
  // Cancer conditions
  'breast_cancer': {
    condition: 'Breast Cancer',
    category: 'cancer',
    severity: 'severe',
    riskScore: 9,
    utilizationImpact: {
      primaryCareVisits: 4,
      specialistVisits: 12,
      emergencyRisk: 30,
      hospitalizationRisk: 40,
      diagnosticTests: 8,
      procedures: 4,
      medications: {
        count: 3,
        categories: ['specialty', 'biologic'],
        monthlyEstimate: { min: 2000, max: 8000 }
      }
    },
    relatedConditions: ['anxiety', 'depression', 'lymphedema', 'neuropathy'],
    ageImpact: {
      under18: 0.3,
      '18-39': 0.8,
      '40-64': 1.2,
      '65+': 1.0
    },
    complications: [
      { condition: 'Metastasis', risk: 20, additionalCost: { min: 50000, max: 200000 } },
      { condition: 'Lymphedema', risk: 15, additionalCost: { min: 5000, max: 15000 } }
    ],
    specialConsiderations: ['Requires oncology team', 'Regular imaging', 'Genetic testing may be needed']
  },

  'lung_cancer': {
    condition: 'Lung Cancer',
    category: 'cancer',
    severity: 'severe',
    riskScore: 10,
    utilizationImpact: {
      primaryCareVisits: 6,
      specialistVisits: 18,
      emergencyRisk: 45,
      hospitalizationRisk: 60,
      diagnosticTests: 12,
      procedures: 6,
      medications: {
        count: 4,
        categories: ['specialty', 'biologic'],
        monthlyEstimate: { min: 3000, max: 12000 }
      }
    },
    relatedConditions: ['COPD', 'pneumonia', 'depression', 'anxiety'],
    ageImpact: {
      under18: 0.1,
      '18-39': 0.4,
      '40-64': 1.2,
      '65+': 1.3
    },
    complications: [
      { condition: 'Respiratory failure', risk: 30, additionalCost: { min: 20000, max: 100000 } },
      { condition: 'Brain metastasis', risk: 25, additionalCost: { min: 40000, max: 150000 } }
    ],
    specialConsiderations: ['May require radiation therapy', 'Oxygen therapy often needed', 'Palliative care planning']
  },

  // Neurological conditions
  'parkinsons_disease': {
    condition: "Parkinson's Disease",
    category: 'neurological',
    severity: 'severe',
    riskScore: 8,
    utilizationImpact: {
      primaryCareVisits: 4,
      specialistVisits: 8,
      emergencyRisk: 25,
      hospitalizationRisk: 20,
      diagnosticTests: 4,
      procedures: 2,
      medications: {
        count: 3,
        categories: ['brand', 'specialty'],
        monthlyEstimate: { min: 500, max: 2000 }
      }
    },
    relatedConditions: ['depression', 'dementia', 'sleep_disorders', 'constipation'],
    ageImpact: {
      under18: 0.01,
      '18-39': 0.1,
      '40-64': 1.0,
      '65+': 1.5
    },
    complications: [
      { condition: 'Falls and fractures', risk: 40, additionalCost: { min: 10000, max: 50000 } },
      { condition: 'Dementia', risk: 30, additionalCost: { min: 20000, max: 80000 } }
    ],
    specialConsiderations: ['Requires movement disorder specialist', 'Physical therapy essential', 'Home modifications needed']
  },

  'multiple_sclerosis': {
    condition: 'Multiple Sclerosis',
    category: 'neurological',
    severity: 'severe',
    riskScore: 8,
    utilizationImpact: {
      primaryCareVisits: 4,
      specialistVisits: 10,
      emergencyRisk: 20,
      hospitalizationRisk: 15,
      diagnosticTests: 6,
      procedures: 2,
      medications: {
        count: 2,
        categories: ['biologic', 'specialty'],
        monthlyEstimate: { min: 4000, max: 8000 }
      }
    },
    relatedConditions: ['depression', 'fatigue', 'bladder_dysfunction', 'spasticity'],
    ageImpact: {
      under18: 0.3,
      '18-39': 1.2,
      '40-64': 1.0,
      '65+': 0.8
    },
    complications: [
      { condition: 'Severe relapse', risk: 25, additionalCost: { min: 15000, max: 40000 } },
      { condition: 'Mobility loss', risk: 20, additionalCost: { min: 10000, max: 30000 } }
    ],
    specialConsiderations: ['MRI monitoring required', 'Disease-modifying therapy essential', 'Rehabilitation services']
  },

  // Chronic conditions
  'type_2_diabetes': {
    condition: 'Type 2 Diabetes',
    category: 'metabolic',
    severity: 'moderate',
    riskScore: 6,
    utilizationImpact: {
      primaryCareVisits: 3,
      specialistVisits: 2,
      emergencyRisk: 15,
      hospitalizationRisk: 10,
      diagnosticTests: 6,
      procedures: 1,
      medications: {
        count: 2,
        categories: ['generic', 'brand'],
        monthlyEstimate: { min: 50, max: 500 }
      }
    },
    relatedConditions: ['hypertension', 'high_cholesterol', 'heart_disease', 'kidney_disease'],
    ageImpact: {
      under18: 0.3,
      '18-39': 0.7,
      '40-64': 1.0,
      '65+': 1.2
    },
    complications: [
      { condition: 'Diabetic neuropathy', risk: 20, additionalCost: { min: 3000, max: 10000 } },
      { condition: 'Kidney disease', risk: 15, additionalCost: { min: 10000, max: 50000 } }
    ],
    specialConsiderations: ['Regular A1C monitoring', 'Eye and foot exams required', 'Nutrition counseling']
  },

  'rheumatoid_arthritis': {
    condition: 'Rheumatoid Arthritis',
    category: 'autoimmune',
    severity: 'moderate',
    riskScore: 7,
    utilizationImpact: {
      primaryCareVisits: 3,
      specialistVisits: 6,
      emergencyRisk: 10,
      hospitalizationRisk: 8,
      diagnosticTests: 8,
      procedures: 2,
      medications: {
        count: 2,
        categories: ['biologic', 'generic'],
        monthlyEstimate: { min: 1000, max: 5000 }
      }
    },
    relatedConditions: ['osteoporosis', 'cardiovascular_disease', 'depression', 'fibromyalgia'],
    ageImpact: {
      under18: 0.4,
      '18-39': 0.8,
      '40-64': 1.0,
      '65+': 1.1
    },
    complications: [
      { condition: 'Joint damage', risk: 30, additionalCost: { min: 10000, max: 40000 } },
      { condition: 'Infection (due to immunosuppression)', risk: 15, additionalCost: { min: 5000, max: 20000 } }
    ],
    specialConsiderations: ['Regular lab monitoring', 'Biologic therapy management', 'Physical therapy']
  },

  'crohns_disease': {
    condition: "Crohn's Disease",
    category: 'autoimmune',
    severity: 'moderate',
    riskScore: 7,
    utilizationImpact: {
      primaryCareVisits: 4,
      specialistVisits: 8,
      emergencyRisk: 20,
      hospitalizationRisk: 15,
      diagnosticTests: 6,
      procedures: 3,
      medications: {
        count: 3,
        categories: ['biologic', 'generic'],
        monthlyEstimate: { min: 2000, max: 6000 }
      }
    },
    relatedConditions: ['anemia', 'arthritis', 'skin_conditions', 'anxiety'],
    ageImpact: {
      under18: 0.8,
      '18-39': 1.2,
      '40-64': 1.0,
      '65+': 0.9
    },
    complications: [
      { condition: 'Intestinal obstruction', risk: 20, additionalCost: { min: 15000, max: 50000 } },
      { condition: 'Fistula', risk: 15, additionalCost: { min: 10000, max: 30000 } }
    ],
    specialConsiderations: ['Colonoscopy surveillance', 'Nutritional support', 'Surgery may be needed']
  },

  // Mental health conditions
  'major_depression': {
    condition: 'Major Depression',
    category: 'mental_health',
    severity: 'moderate',
    riskScore: 5,
    utilizationImpact: {
      primaryCareVisits: 2,
      specialistVisits: 12,
      emergencyRisk: 10,
      hospitalizationRisk: 5,
      diagnosticTests: 1,
      procedures: 0,
      medications: {
        count: 1,
        categories: ['generic'],
        monthlyEstimate: { min: 20, max: 200 }
      }
    },
    relatedConditions: ['anxiety', 'insomnia', 'chronic_pain', 'substance_abuse'],
    ageImpact: {
      under18: 0.8,
      '18-39': 1.2,
      '40-64': 1.0,
      '65+': 0.9
    },
    complications: [
      { condition: 'Treatment-resistant depression', risk: 20, additionalCost: { min: 5000, max: 20000 } },
      { condition: 'Suicide attempt', risk: 5, additionalCost: { min: 10000, max: 50000 } }
    ],
    specialConsiderations: ['Therapy essential', 'Medication monitoring', 'Crisis planning']
  }
}

// Helper function to get risk assessment for a condition
export function getConditionRiskAssessment(conditionName: string): ConditionRiskProfile | undefined {
  // Normalize condition name for lookup
  const normalizedName = conditionName.toLowerCase().replace(/\s+/g, '_')
  
  // Try exact match first
  if (conditionRiskProfiles[normalizedName]) {
    return conditionRiskProfiles[normalizedName]
  }
  
  // Try partial match
  for (const [key, profile] of Object.entries(conditionRiskProfiles)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return profile
    }
  }
  
  return undefined
}

// Calculate total risk score for a member
export function calculateMemberRiskScore(conditions: string[], age: number): {
  totalRiskScore: number
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  utilizationMultiplier: number
} {
  let totalRiskScore = 0
  const ageGroup = age < 18 ? 'under18' : age < 40 ? '18-39' : age < 65 ? '40-64' : '65+'
  
  for (const condition of conditions) {
    const riskProfile = getConditionRiskAssessment(condition)
    if (riskProfile) {
      const ageMultiplier = riskProfile.ageImpact[ageGroup]
      totalRiskScore += riskProfile.riskScore * ageMultiplier
    } else {
      // Default risk score for unknown conditions
      totalRiskScore += 3
    }
  }
  
  // Normalize risk score
  const normalizedScore = Math.min(totalRiskScore, 30) // Cap at 30
  
  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  let utilizationMultiplier: number
  
  if (normalizedScore < 5) {
    riskLevel = 'low'
    utilizationMultiplier = 1.0
  } else if (normalizedScore < 10) {
    riskLevel = 'moderate'
    utilizationMultiplier = 1.5
  } else if (normalizedScore < 20) {
    riskLevel = 'high'
    utilizationMultiplier = 2.0
  } else {
    riskLevel = 'very_high'
    utilizationMultiplier = 3.0
  }
  
  return {
    totalRiskScore: normalizedScore,
    riskLevel,
    utilizationMultiplier
  }
}

// Predict healthcare utilization based on conditions
export function predictHealthcareUtilization(
  conditions: string[],
  medications: string[],
  age: number
): {
  annualPrimaryCareVisits: number
  annualSpecialistVisits: number
  annualEmergencyRisk: number
  annualHospitalizationRisk: number
  annualDiagnosticTests: number
  annualProcedures: number
  estimatedAnnualMedicationCost: { min: number; max: number }
  relatedConditionRisks: { condition: string; risk: number }[]
} {
  // Base utilization for healthy individuals
  let primaryCareVisits = 2
  let specialistVisits = 0
  let emergencyRisk = 5
  let hospitalizationRisk = 2
  let diagnosticTests = 1
  let procedures = 0
  let medicationCostMin = 0
  let medicationCostMax = 0
  
  const relatedConditionRisks: { condition: string; risk: number }[] = []
  const processedRelatedConditions = new Set<string>()
  
  // Add utilization from each condition
  for (const condition of conditions) {
    const riskProfile = getConditionRiskAssessment(condition)
    if (riskProfile) {
      const ageGroup = age < 18 ? 'under18' : age < 40 ? '18-39' : age < 65 ? '40-64' : '65+'
      const ageMultiplier = riskProfile.ageImpact[ageGroup]
      
      primaryCareVisits += riskProfile.utilizationImpact.primaryCareVisits * ageMultiplier
      specialistVisits += riskProfile.utilizationImpact.specialistVisits * ageMultiplier
      emergencyRisk += riskProfile.utilizationImpact.emergencyRisk * ageMultiplier
      hospitalizationRisk += riskProfile.utilizationImpact.hospitalizationRisk * ageMultiplier
      diagnosticTests += riskProfile.utilizationImpact.diagnosticTests * ageMultiplier
      procedures += riskProfile.utilizationImpact.procedures * ageMultiplier
      
      // Add medication costs
      medicationCostMin += riskProfile.utilizationImpact.medications.monthlyEstimate.min * 12
      medicationCostMax += riskProfile.utilizationImpact.medications.monthlyEstimate.max * 12
      
      // Track related condition risks
      for (const relatedCondition of riskProfile.relatedConditions) {
        if (!conditions.includes(relatedCondition) && !processedRelatedConditions.has(relatedCondition)) {
          processedRelatedConditions.add(relatedCondition)
          relatedConditionRisks.push({
            condition: relatedCondition,
            risk: 20 // Base 20% risk of developing related conditions
          })
        }
      }
    }
  }
  
  // Age-based adjustments
  if (age >= 65) {
    primaryCareVisits *= 1.2
    diagnosticTests *= 1.3
    emergencyRisk *= 1.2
  } else if (age < 5) {
    primaryCareVisits *= 1.5 // Well-child visits
  }
  
  // Cap values at reasonable maximums
  primaryCareVisits = Math.min(primaryCareVisits, 24) // Max 2x per month
  specialistVisits = Math.min(specialistVisits, 52) // Max weekly
  emergencyRisk = Math.min(emergencyRisk, 80)
  hospitalizationRisk = Math.min(hospitalizationRisk, 60)
  
  return {
    annualPrimaryCareVisits: Math.round(primaryCareVisits),
    annualSpecialistVisits: Math.round(specialistVisits),
    annualEmergencyRisk: Math.round(emergencyRisk),
    annualHospitalizationRisk: Math.round(hospitalizationRisk),
    annualDiagnosticTests: Math.round(diagnosticTests),
    annualProcedures: Math.round(procedures),
    estimatedAnnualMedicationCost: {
      min: Math.round(medicationCostMin),
      max: Math.round(medicationCostMax)
    },
    relatedConditionRisks: relatedConditionRisks.slice(0, 5) // Top 5 risks
  }
}