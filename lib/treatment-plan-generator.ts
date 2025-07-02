import { Member } from "./health-profile-store"
import { TreatmentCategory } from "./treatment-cost-service"

export interface TreatmentItem {
  id: string
  name: string
  category: TreatmentCategory
  frequency: number // per year
  urgency: 'routine' | 'urgent' | 'emergency'
  reason: string
  isPreventive: boolean
  requiresSpecialist: boolean
  relatedCondition?: string
  notes?: string
}

export interface MedicationItem {
  id: string
  name: string
  genericAvailable: boolean
  dosagePerMonth: number
  isSpecialty: boolean
  relatedCondition: string
  monthlyCost?: number
}

export interface TreatmentPlan {
  memberId: string
  memberAge: number
  conditions: string[]
  treatments: TreatmentItem[]
  medications: MedicationItem[]
  preventiveCare: TreatmentItem[]
  totalAnnualVisits: number
  hasChronicConditions: boolean
  requiresSpecialistCare: boolean
  emergencyRiskLevel: 'low' | 'medium' | 'high'
}

// Condition-specific treatment mappings
const conditionTreatments: Record<string, {
  treatments: Partial<TreatmentItem>[]
  medications?: Partial<MedicationItem>[]
  preventive?: Partial<TreatmentItem>[]
}> = {
  'Type 2 Diabetes': {
    treatments: [
      {
        name: 'Endocrinologist Visit',
        category: 'specialist_visit',
        frequency: 4,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Hemoglobin A1C Test',
        category: 'diagnostic_lab',
        frequency: 4,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Diabetic Eye Exam',
        category: 'specialist_visit',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: true,
        isPreventive: true,
      },
      {
        name: 'Diabetic Foot Exam',
        category: 'specialist_visit',
        frequency: 2,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Lipid Panel',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
    ],
    medications: [
      {
        name: 'Metformin',
        genericAvailable: true,
        dosagePerMonth: 60,
        isSpecialty: false,
      },
    ],
  },
  'Hypertension': {
    treatments: [
      {
        name: 'Cardiologist Visit',
        category: 'specialist_visit',
        frequency: 2,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Blood Pressure Monitoring',
        category: 'office_visit',
        frequency: 4,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'EKG',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Kidney Function Test',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
    ],
    medications: [
      {
        name: 'Lisinopril',
        genericAvailable: true,
        dosagePerMonth: 30,
        isSpecialty: false,
      },
    ],
  },
  'Asthma': {
    treatments: [
      {
        name: 'Pulmonologist Visit',
        category: 'specialist_visit',
        frequency: 2,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Spirometry Test',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Chest X-Ray',
        category: 'diagnostic_imaging',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
    ],
    medications: [
      {
        name: 'Albuterol Inhaler',
        genericAvailable: true,
        dosagePerMonth: 1,
        isSpecialty: false,
      },
      {
        name: 'Advair Diskus',
        genericAvailable: false,
        dosagePerMonth: 1,
        isSpecialty: true,
      },
    ],
  },
  'Depression': {
    treatments: [
      {
        name: 'Psychiatrist Visit',
        category: 'therapy_mental',
        frequency: 12,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Therapy Session',
        category: 'therapy_mental',
        frequency: 24,
        urgency: 'routine',
        requiresSpecialist: true,
      },
    ],
    medications: [
      {
        name: 'Sertraline (Zoloft)',
        genericAvailable: true,
        dosagePerMonth: 30,
        isSpecialty: false,
      },
    ],
  },
  'High Cholesterol': {
    treatments: [
      {
        name: 'Lipid Panel',
        category: 'diagnostic_lab',
        frequency: 2,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Liver Function Test',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
    ],
    medications: [
      {
        name: 'Atorvastatin (Lipitor)',
        genericAvailable: true,
        dosagePerMonth: 30,
        isSpecialty: false,
      },
    ],
  },
  'Pregnancy': {
    treatments: [
      {
        name: 'Prenatal Visit',
        category: 'maternity_care',
        frequency: 14,
        urgency: 'routine',
        requiresSpecialist: true,
      },
      {
        name: 'Ultrasound',
        category: 'diagnostic_imaging',
        frequency: 3,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Glucose Screening',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Group B Strep Test',
        category: 'diagnostic_lab',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: false,
      },
      {
        name: 'Delivery',
        category: 'maternity_care',
        frequency: 1,
        urgency: 'routine',
        requiresSpecialist: true,
        notes: 'Vaginal or Cesarean based on medical necessity',
      },
    ],
    medications: [
      {
        name: 'Prenatal Vitamins',
        genericAvailable: true,
        dosagePerMonth: 30,
        isSpecialty: false,
      },
    ],
  },
}

// Age-based preventive care
const preventiveCareByAge: Record<string, Partial<TreatmentItem>[]> = {
  'child': [ // 0-18
    {
      name: 'Annual Wellness Visit',
      category: 'preventive_care',
      frequency: 1,
      isPreventive: true,
    },
    {
      name: 'Immunizations',
      category: 'preventive_care',
      frequency: 2,
      isPreventive: true,
    },
    {
      name: 'Dental Cleaning',
      category: 'dental_care',
      frequency: 2,
      isPreventive: true,
    },
  ],
  'adult': [ // 18-50
    {
      name: 'Annual Physical',
      category: 'preventive_care',
      frequency: 1,
      isPreventive: true,
    },
    {
      name: 'Dental Cleaning',
      category: 'dental_care',
      frequency: 2,
      isPreventive: true,
    },
    {
      name: 'Eye Exam',
      category: 'vision_care',
      frequency: 0.5, // Every 2 years
      isPreventive: true,
    },
  ],
  'middle_age': [ // 50-65
    {
      name: 'Annual Physical',
      category: 'preventive_care',
      frequency: 1,
      isPreventive: true,
    },
    {
      name: 'Colonoscopy',
      category: 'procedure_minor',
      frequency: 0.1, // Every 10 years
      isPreventive: true,
    },
    {
      name: 'Mammogram',
      category: 'diagnostic_imaging',
      frequency: 1,
      isPreventive: true,
      notes: 'For females',
    },
    {
      name: 'Bone Density Test',
      category: 'diagnostic_imaging',
      frequency: 0.5,
      isPreventive: true,
      notes: 'For females',
    },
  ],
  'senior': [ // 65+
    {
      name: 'Medicare Wellness Visit',
      category: 'preventive_care',
      frequency: 1,
      isPreventive: true,
    },
    {
      name: 'Flu Vaccine',
      category: 'preventive_care',
      frequency: 1,
      isPreventive: true,
    },
    {
      name: 'Pneumonia Vaccine',
      category: 'preventive_care',
      frequency: 0.2, // Every 5 years
      isPreventive: true,
    },
    {
      name: 'Shingles Vaccine',
      category: 'preventive_care',
      frequency: 0.1, // Once
      isPreventive: true,
    },
  ],
}

export class TreatmentPlanGenerator {
  generateTreatmentPlan(member: Member): TreatmentPlan {
    const treatments: TreatmentItem[] = []
    const medications: MedicationItem[] = []
    const preventiveCare: TreatmentItem[] = []
    
    // Add condition-specific treatments
    member.conditions.forEach(condition => {
      const conditionPlan = conditionTreatments[condition]
      if (conditionPlan) {
        // Add treatments
        conditionPlan.treatments.forEach(treatment => {
          treatments.push({
            id: `${condition}_${treatment.name}`.replace(/\s+/g, '_').toLowerCase(),
            reason: `Management of ${condition}`,
            relatedCondition: condition,
            urgency: 'routine',
            requiresSpecialist: false,
            isPreventive: false,
            ...treatment,
          } as TreatmentItem)
        })
        
        // Add medications
        if (conditionPlan.medications) {
          conditionPlan.medications.forEach(med => {
            medications.push({
              id: `${condition}_${med.name}`.replace(/\s+/g, '_').toLowerCase(),
              relatedCondition: condition,
              ...med,
            } as MedicationItem)
          })
        }
        
        // Add condition-specific preventive care
        if (conditionPlan.preventive) {
          conditionPlan.preventive.forEach(prev => {
            preventiveCare.push({
              id: `${condition}_${prev.name}`.replace(/\s+/g, '_').toLowerCase(),
              reason: `Preventive care for ${condition}`,
              relatedCondition: condition,
              urgency: 'routine',
              requiresSpecialist: false,
              isPreventive: true,
              ...prev,
            } as TreatmentItem)
          })
        }
      }
    })
    
    // Add age-based preventive care
    const age = parseInt(member.age) || 0
    const ageGroup = age < 18 ? 'child' : 
                    age < 50 ? 'adult' :
                    age < 65 ? 'middle_age' : 'senior'
    
    const ageCare = preventiveCareByAge[ageGroup] || []
    ageCare.forEach(care => {
      // Skip gender-specific care if not applicable
      if (care.notes?.includes('females') && member.gender !== 'female') {
        return
      }
      
      preventiveCare.push({
        id: `preventive_${care.name}`.replace(/\s+/g, '_').toLowerCase(),
        reason: 'Age-based preventive care',
        urgency: 'routine',
        requiresSpecialist: false,
        isPreventive: true,
        ...care,
      } as TreatmentItem)
    })
    
    // Add pregnancy-specific care if applicable
    if (member.pregnancyStatus?.isPregnant) {
      const pregnancyPlan = conditionTreatments['Pregnancy']
      if (pregnancyPlan) {
        pregnancyPlan.treatments.forEach(treatment => {
          treatments.push({
            id: `pregnancy_${treatment.name}`.replace(/\s+/g, '_').toLowerCase(),
            reason: 'Pregnancy care',
            relatedCondition: 'Pregnancy',
            urgency: 'routine',
            requiresSpecialist: true,
            isPreventive: false,
            ...treatment,
          } as TreatmentItem)
        })
        
        if (pregnancyPlan.medications) {
          pregnancyPlan.medications.forEach(med => {
            medications.push({
              id: `pregnancy_${med.name}`.replace(/\s+/g, '_').toLowerCase(),
              relatedCondition: 'Pregnancy',
              ...med,
            } as MedicationItem)
          })
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
          frequency: service.frequency,
          urgency: 'routine',
          reason: 'User-specified service',
          isPreventive: false,
          requiresSpecialist: false,
        })
      })
    }
    
    // Calculate totals and risk levels
    const totalAnnualVisits = [...treatments, ...preventiveCare]
      .reduce((sum, t) => sum + t.frequency, 0)
    
    const hasChronicConditions = member.conditions.some(c => 
      ['Diabetes', 'Heart Disease', 'COPD', 'Kidney Disease', 'Cancer'].some(chronic => 
        c.includes(chronic)
      )
    )
    
    const requiresSpecialistCare = treatments.some(t => t.requiresSpecialist)
    
    const emergencyRiskLevel = this.calculateEmergencyRisk(member)
    
    return {
      memberId: member.id,
      memberAge: age,
      conditions: member.conditions,
      treatments,
      medications,
      preventiveCare,
      totalAnnualVisits,
      hasChronicConditions,
      requiresSpecialistCare,
      emergencyRiskLevel,
    }
  }
  
  private categorizeService(serviceName: string): TreatmentCategory {
    const normalized = serviceName.toLowerCase()
    
    if (normalized.includes('emergency')) return 'emergency_room'
    if (normalized.includes('urgent')) return 'urgent_care'
    if (normalized.includes('primary') || normalized.includes('pcp')) return 'office_visit'
    if (normalized.includes('specialist')) return 'specialist_visit'
    if (normalized.includes('blood') || normalized.includes('lab')) return 'diagnostic_lab'
    if (normalized.includes('xray') || normalized.includes('ct') || normalized.includes('mri')) return 'diagnostic_imaging'
    if (normalized.includes('surgery')) return 'surgery_outpatient'
    if (normalized.includes('therapy')) return 'therapy_physical'
    if (normalized.includes('mental') || normalized.includes('psych')) return 'therapy_mental'
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
      ['Diabetes', 'Heart Disease', 'COPD', 'Kidney Disease'].some(chronic => 
        c.includes(chronic)
      )
    ).length
    riskScore += chronicCount * 2
    
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