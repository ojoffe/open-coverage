import { Member } from "./health-profile-store"
import { TreatmentCategory } from "./treatment-cost-service"
import { 
  DetailedTreatment, 
  MedicationDetail, 
  ConditionManagementPlan,
  conditionManagementPlans,
  preventiveCareSchedules
} from "./enhanced-treatment-mapping"
import { MedicationCostCalculator } from "./medication-cost-calculator"

export interface EnhancedTreatmentItem extends DetailedTreatment {
  reason: string
  relatedCondition?: string
  severity?: 'mild' | 'moderate' | 'severe'
  annualFrequency: number
  estimatedUnitCost?: number
  estimatedAnnualCost?: number
}

export interface EnhancedMedicationItem extends MedicationDetail {
  relatedCondition: string
  severity?: 'mild' | 'moderate' | 'severe'
  monthlyCost?: number
  annualCost?: number
  tier?: 'generic' | 'preferred_brand' | 'non_preferred_brand' | 'specialty'
  alternatives?: Array<{ name: string; monthlyCost: number; savings: number }>
}

export interface EnhancedTreatmentPlan {
  memberId: string
  memberAge: number
  memberGender?: string
  conditions: string[]
  treatments: EnhancedTreatmentItem[]
  medications: EnhancedMedicationItem[]
  preventiveCare: EnhancedTreatmentItem[]
  totalAnnualVisits: number
  totalAnnualCost: {
    treatments: number
    medications: number
    preventive: number
    total: number
  }
  hasChronicConditions: boolean
  requiresSpecialistCare: boolean
  emergencyRiskLevel: 'low' | 'medium' | 'high'
  recommendations: string[]
  savingsOpportunities: Array<{
    type: 'medication' | 'treatment'
    item: string
    potentialSavings: number
    recommendation: string
  }>
}

export class EnhancedTreatmentPlanGenerator {
  private medicationCalculator: MedicationCostCalculator
  
  constructor() {
    this.medicationCalculator = new MedicationCostCalculator()
  }
  
  generateEnhancedTreatmentPlan(member: Member): EnhancedTreatmentPlan {
    const treatments: EnhancedTreatmentItem[] = []
    const medications: EnhancedMedicationItem[] = []
    const preventiveCare: EnhancedTreatmentItem[] = []
    const recommendations: string[] = []
    const savingsOpportunities: EnhancedTreatmentPlan['savingsOpportunities'] = []
    
    // Process each condition with severity assessment
    member.conditions.forEach(conditionName => {
      const conditionPlan = conditionManagementPlans[conditionName]
      if (conditionPlan) {
        const severity = this.assessConditionSeverity(member, conditionName)
        const severityPlan = conditionPlan.severity[severity]
        
        // Add treatments for this condition
        severityPlan.treatments.forEach(treatment => {
          const annualFrequency = this.calculateAnnualFrequency(treatment.frequency)
          treatments.push({
            ...treatment,
            reason: `${severity.charAt(0).toUpperCase() + severity.slice(1)} ${conditionName} management`,
            relatedCondition: conditionName,
            severity,
            annualFrequency,
          })
        })
        
        // Add medications with cost calculations
        severityPlan.medications.forEach(med => {
          const costEstimate = this.medicationCalculator.calculateMedicationCost(med)
          const enhancedMed: EnhancedMedicationItem = {
            ...med,
            relatedCondition: conditionName,
            severity,
            monthlyCost: Math.min(
              costEstimate.monthlyCost.retail,
              costEstimate.monthlyCost.mailOrder,
              costEstimate.monthlyCost.specialty
            ),
            annualCost: costEstimate.annualCost,
            tier: costEstimate.tier,
            alternatives: costEstimate.alternatives,
          }
          medications.push(enhancedMed)
          
          // Add savings opportunities for expensive medications
          if (costEstimate.alternatives && costEstimate.alternatives.length > 0) {
            const bestAlternative = costEstimate.alternatives[0]
            savingsOpportunities.push({
              type: 'medication',
              item: med.name,
              potentialSavings: bestAlternative.savings * 12,
              recommendation: `Consider switching to ${bestAlternative.name} to save $${bestAlternative.savings}/month`
            })
          }
        })
        
        // Add condition-specific recommendations
        if (conditionPlan.specialConsiderations) {
          recommendations.push(...conditionPlan.specialConsiderations.map(
            consideration => `${conditionName}: ${consideration}`
          ))
        }
        
        // Check for complications
        if (conditionPlan.complications) {
          conditionPlan.complications.forEach(complication => {
            if (Math.random() < complication.probability * 2) { // Adjust probability for planning
              complication.additionalTreatments.forEach(treatment => {
                const annualFrequency = this.calculateAnnualFrequency(treatment.frequency)
                treatments.push({
                  ...treatment,
                  reason: `Potential ${complication.name} related to ${conditionName}`,
                  relatedCondition: conditionName,
                  severity,
                  annualFrequency,
                })
              })
            }
          })
        }
      }
    })
    
    // Add age and gender-based preventive care
    const ageGroup = this.getAgeGroup(member)
    const genderGroup = member.gender === 'female' ? 'adult_female' : 'adult_male'
    
    // Add general preventive care
    const preventiveSchedule = member.age && parseInt(member.age) >= 65 
      ? preventiveCareSchedules['senior']
      : preventiveCareSchedules[genderGroup] || preventiveCareSchedules['adult_male']
    
    preventiveSchedule.forEach(care => {
      const annualFrequency = this.calculateAnnualFrequency(care.frequency)
      preventiveCare.push({
        ...care,
        reason: 'Routine preventive care',
        annualFrequency,
      })
    })
    
    // Add pregnancy care if applicable
    if (member.pregnancyStatus?.isPregnant) {
      const pregnancyPlan = conditionManagementPlans['Pregnancy']
      if (pregnancyPlan) {
        const riskLevel = member.pregnancyStatus.riskLevel || 'low'
        const severity = riskLevel === 'high' ? 'severe' : riskLevel === 'medium' ? 'moderate' : 'mild'
        const severityPlan = pregnancyPlan.severity[severity]
        
        severityPlan.treatments.forEach(treatment => {
          const annualFrequency = this.calculateAnnualFrequency(treatment.frequency)
          treatments.push({
            ...treatment,
            reason: `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}-risk pregnancy care`,
            relatedCondition: 'Pregnancy',
            severity,
            annualFrequency,
          })
        })
        
        severityPlan.medications.forEach(med => {
          const costEstimate = this.medicationCalculator.calculateMedicationCost(med)
          medications.push({
            ...med,
            relatedCondition: 'Pregnancy',
            severity,
            monthlyCost: Math.min(
              costEstimate.monthlyCost.retail,
              costEstimate.monthlyCost.mailOrder,
              costEstimate.monthlyCost.specialty
            ),
            annualCost: costEstimate.annualCost,
            tier: costEstimate.tier,
          })
        })
        
        // Add delivery cost estimate
        if (member.pregnancyStatus.deliveryType) {
          const deliveryTreatment = severityPlan.treatments.find(t => 
            t.name.toLowerCase().includes(member.pregnancyStatus!.deliveryType!.toLowerCase())
          )
          if (deliveryTreatment) {
            recommendations.push(
              `Estimated ${member.pregnancyStatus.deliveryType} delivery cost: ` +
              `$${member.pregnancyStatus.deliveryType === 'cesarean' ? '18,000-25,000' : '8,000-18,000'}`
            )
          }
        }
      }
    }
    
    // Add custom services from member profile
    if (member.otherServices) {
      member.otherServices.forEach(service => {
        treatments.push({
          id: `custom_${service.name}`.replace(/\s+/g, '_').toLowerCase(),
          name: service.name,
          category: this.categorizeService(service.name),
          frequency: { min: service.frequency, typical: service.frequency, max: service.frequency },
          annualFrequency: service.frequency,
          requiresSpecialist: false,
          isPreventive: false,
          reason: 'User-specified service',
        })
      })
    }
    
    // Calculate costs and totals
    const treatmentCosts = this.estimateTreatmentCosts(treatments)
    const medicationCosts = medications.reduce((sum, med) => sum + (med.annualCost || 0), 0)
    const preventiveCosts = this.estimateTreatmentCosts(preventiveCare)
    
    const totalAnnualVisits = [...treatments, ...preventiveCare]
      .reduce((sum, t) => sum + t.annualFrequency, 0)
    
    const hasChronicConditions = member.conditions.some(c => 
      ['Diabetes', 'Heart Disease', 'COPD', 'Kidney Disease', 'Cancer', 'Hypertension'].some(chronic => 
        c.includes(chronic)
      )
    )
    
    const requiresSpecialistCare = treatments.some(t => t.requiresSpecialist)
    
    const emergencyRiskLevel = this.calculateEmergencyRisk(member)
    
    // Add general recommendations
    if (hasChronicConditions) {
      recommendations.push('Consider care coordination services to manage multiple chronic conditions')
    }
    
    if (emergencyRiskLevel === 'high') {
      recommendations.push('High emergency risk - ensure adequate emergency coverage and consider urgent care alternatives')
    }
    
    return {
      memberId: member.id,
      memberAge: parseInt(member.age) || 0,
      memberGender: member.gender,
      conditions: member.conditions,
      treatments,
      medications,
      preventiveCare,
      totalAnnualVisits,
      totalAnnualCost: {
        treatments: treatmentCosts,
        medications: medicationCosts,
        preventive: preventiveCosts,
        total: treatmentCosts + medicationCosts + preventiveCosts,
      },
      hasChronicConditions,
      requiresSpecialistCare,
      emergencyRiskLevel,
      recommendations,
      savingsOpportunities,
    }
  }
  
  private assessConditionSeverity(member: Member, condition: string): 'mild' | 'moderate' | 'severe' {
    // Base severity on multiple factors
    let severityScore = 0
    
    // Age factors
    const age = parseInt(member.age) || 0
    if (age > 65) severityScore += 1
    if (age > 75) severityScore += 1
    
    // Multiple conditions
    if (member.conditions.length > 3) severityScore += 1
    if (member.conditions.length > 5) severityScore += 1
    
    // Condition-specific factors
    if (condition.includes('Diabetes')) {
      if (member.conditions.some(c => c.includes('Kidney') || c.includes('Neuropathy'))) {
        severityScore += 2
      }
    }
    
    if (condition.includes('Hypertension')) {
      if (member.conditions.some(c => c.includes('Heart') || c.includes('Stroke'))) {
        severityScore += 2
      }
    }
    
    // Lifestyle factors
    if (member.smokingStatus === 'current') severityScore += 1
    if (member.alcoholUse === 'heavy') severityScore += 1
    if (member.exerciseFrequency === 'none') severityScore += 1
    
    // BMI factors
    if (member.bmi) {
      if (member.bmi > 30) severityScore += 1
      if (member.bmi > 35) severityScore += 1
    }
    
    // Determine severity
    if (severityScore >= 5) return 'severe'
    if (severityScore >= 3) return 'moderate'
    return 'mild'
  }
  
  private calculateAnnualFrequency(frequency: { min: number; typical: number; max: number }): number {
    // Use typical frequency for planning purposes
    return frequency.typical
  }
  
  private estimateTreatmentCosts(treatments: EnhancedTreatmentItem[]): number {
    // Rough cost estimates by category
    const costByCategory: Record<TreatmentCategory, number> = {
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
      'medication_generic': 30,
      'medication_brand': 300,
      'medication_specialty': 1000,
      'therapy_physical': 150,
      'therapy_mental': 200,
      'preventive_care': 100,
      'maternity_care': 500,
      'dental_care': 150,
      'vision_care': 100,
    }
    
    return treatments.reduce((sum, treatment) => {
      const unitCost = treatment.estimatedUnitCost || costByCategory[treatment.category] || 200
      return sum + (unitCost * treatment.annualFrequency)
    }, 0)
  }
  
  private getAgeGroup(member: Member): string {
    const age = parseInt(member.age) || 0
    if (age < 18) return 'child'
    if (age < 50) return 'adult'
    if (age < 65) return 'middle_age'
    return 'senior'
  }
  
  private categorizeService(serviceName: string): TreatmentCategory {
    const normalized = serviceName.toLowerCase()
    
    if (normalized.includes('emergency')) return 'emergency_room'
    if (normalized.includes('urgent')) return 'urgent_care'
    if (normalized.includes('primary') || normalized.includes('pcp')) return 'office_visit'
    if (normalized.includes('specialist')) return 'specialist_visit'
    if (normalized.includes('blood') || normalized.includes('lab')) return 'diagnostic_lab'
    if (normalized.includes('xray') || normalized.includes('x-ray')) return 'diagnostic_imaging'
    if (normalized.includes('ct') || normalized.includes('mri')) return 'diagnostic_imaging'
    if (normalized.includes('surgery')) return 'surgery_outpatient'
    if (normalized.includes('therapy') && normalized.includes('physical')) return 'therapy_physical'
    if (normalized.includes('therapy') || normalized.includes('psych')) return 'therapy_mental'
    if (normalized.includes('delivery') || normalized.includes('prenatal')) return 'maternity_care'
    if (normalized.includes('medication') || normalized.includes('drug')) return 'medication_generic'
    if (normalized.includes('dental')) return 'dental_care'
    if (normalized.includes('vision') || normalized.includes('eye')) return 'vision_care'
    if (normalized.includes('prevent')) return 'preventive_care'
    
    return 'office_visit' // default
  }
  
  private calculateEmergencyRisk(member: Member): 'low' | 'medium' | 'high' {
    let riskScore = 0
    
    // Age factors
    const age = parseInt(member.age) || 0
    if (age > 65) riskScore += 2
    else if (age < 5) riskScore += 1
    
    // Chronic conditions
    const chronicCount = member.conditions.filter(c => 
      ['Diabetes', 'Heart Disease', 'COPD', 'Kidney Disease', 'Asthma'].some(chronic => 
        c.includes(chronic)
      )
    ).length
    riskScore += chronicCount * 2
    
    // Pregnancy
    if (member.pregnancyStatus?.isPregnant) {
      riskScore += 1
      if (member.pregnancyStatus.riskLevel === 'high') riskScore += 2
    }
    
    // Lifestyle factors
    if (member.smokingStatus === 'current') riskScore += 1
    if (member.alcoholUse === 'heavy') riskScore += 1
    
    // Multiple conditions
    if (member.conditions.length > 3) riskScore += 1
    
    // Determine risk level
    if (riskScore >= 5) return 'high'
    if (riskScore >= 3) return 'medium'
    return 'low'
  }
}