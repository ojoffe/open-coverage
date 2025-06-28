export interface EnhancedMember {
  // Core identification
  id: string
  name: string
  isPrimary: boolean
  
  // Demographics
  age: number
  dateOfBirth?: string
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  height?: number // in inches
  weight?: number // in pounds
  bmi?: number // calculated
  
  // Health Status
  conditions: Condition[]
  medications: Medication[]
  allergies: Allergy[]
  
  // Care History
  surgeries: Surgery[]
  hospitalizations: Hospitalization[]
  preventiveCare: PreventiveCareRecord[]
  immunizations: Immunization[]
  
  // Current Care Team
  providers: ProviderRelationship[]
  preferredPharmacy?: Pharmacy
  
  // Lifestyle & Risk Factors
  smokingStatus: 'never' | 'former' | 'current' | 'unknown'
  alcoholUse: 'none' | 'moderate' | 'heavy' | 'unknown'
  exerciseFrequency: 'none' | 'occasional' | 'regular' | 'daily'
  occupation?: string
  occupationalRisks?: string[]
  
  // Care Preferences
  carePriorities: CarePriority[]
  maxTravelDistance?: number // in miles
  telemedicinePreference: 'preferred' | 'acceptable' | 'emergency_only' | 'never'
  
  // Future Health Events
  plannedProcedures: PlannedProcedure[]
  pregnancyStatus?: PregnancyInfo
  
  // Projections (calculated)
  expectedVisits: ExpectedVisit[]
  riskScore?: RiskAssessment
}

export interface Condition {
  id: string
  name: string
  icdCode?: string
  severity: 'mild' | 'moderate' | 'severe'
  diagnosisDate?: string
  status: 'active' | 'resolved' | 'managed'
  managingSpecialist?: string
  medications?: string[] // medication IDs
  relatedConditions?: string[] // condition IDs
  notes?: string
}

export interface Medication {
  id: string
  name: string
  genericName?: string
  brandName?: string
  drugClass: string
  dosage: string
  frequency: string
  prescribedFor: string // condition ID
  startDate?: string
  isSpecialty: boolean
  requiresPriorAuth: boolean
  monthlySupply: number
  preferredPharmacy?: 'retail' | 'mail_order' | 'specialty'
  estimatedMonthlyCost?: number
}

export interface Allergy {
  id: string
  allergen: string
  type: 'drug' | 'food' | 'environmental' | 'other'
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  reactions: string[]
  notes?: string
}

export interface Surgery {
  id: string
  procedure: string
  date: string
  facility?: string
  surgeon?: string
  complications?: boolean
  notes?: string
}

export interface Hospitalization {
  id: string
  reason: string
  admissionDate: string
  dischargeDate: string
  facility: string
  lengthOfStay: number
  department: string
  notes?: string
}

export interface PreventiveCareRecord {
  id: string
  type: 'annual_physical' | 'screening' | 'vaccination' | 'dental' | 'vision' | 'other'
  name: string
  lastDate?: string
  nextDueDate?: string
  frequency: string
  provider?: string
  notes?: string
}

export interface Immunization {
  id: string
  vaccine: string
  dateReceived: string
  nextDueDate?: string
  series?: string
  provider?: string
}

export interface ProviderRelationship {
  id: string
  type: 'pcp' | 'specialist' | 'therapist' | 'other'
  specialty?: string
  name: string
  practiceName?: string
  npi?: string
  address?: string
  phone?: string
  lastVisit?: string
  nextScheduledVisit?: string
  yearsWithProvider?: number
  satisfaction: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied'
  acceptsTelemedicine: boolean
  notes?: string
}

export interface Pharmacy {
  name: string
  type: 'retail' | 'mail_order' | 'specialty'
  address?: string
  phone?: string
  preferred: boolean
}

export interface CarePriority {
  priority: 'low_cost' | 'provider_choice' | 'quality_ratings' | 'minimal_travel' | 'comprehensive_coverage'
  importance: 1 | 2 | 3 | 4 | 5 // 1 = least important, 5 = most important
}

export interface PlannedProcedure {
  id: string
  procedure: string
  timeframe: 'next_3_months' | 'next_6_months' | 'next_year' | 'beyond_year'
  isElective: boolean
  preferredFacility?: string
  estimatedCost?: number
  requiresSpecialist: boolean
  specialtyType?: string
  notes?: string
}

export interface PregnancyInfo {
  dueDate: string
  isHighRisk: boolean
  multiples: boolean
  plannedDeliveryType: 'vaginal' | 'cesarean' | 'unknown'
  obgynProvider?: string
  preferredHospital?: string
  complications?: string[]
}

export interface ExpectedVisit {
  serviceType: string
  annualFrequency: number
  provider?: string
  facility?: string
  isPreventive: boolean
  basedOn: 'age' | 'condition' | 'medication' | 'preventive_care' | 'user_input'
}

export interface RiskAssessment {
  overallScore: number // 0-100
  factors: RiskFactor[]
  recommendations: string[]
  lastCalculated: string
}

export interface RiskFactor {
  name: string
  impact: 'low' | 'medium' | 'high'
  category: 'demographic' | 'medical' | 'lifestyle' | 'genetic'
  score: number
  description: string
}

// Migration helper type
export interface LegacyMember {
  id: string
  age: string
  conditions: string[]
  medications: string[]
  allergies?: string[]
  visits?: {
    id: string
    serviceType: string
    frequency: number
  }[]
  otherServices?: {
    id: string
    name: string
    annualFrequency: number
  }[]
}

// Utility types
export type HealthProfileCompletenessScore = {
  overall: number // 0-100
  categories: {
    demographics: number
    conditions: number
    medications: number
    providers: number
    history: number
    preferences: number
  }
}