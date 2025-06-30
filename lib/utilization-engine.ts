import { Member } from "./health-profile-store"
import { ageBasedUtilization } from "./health-profile-utils"

// Condition-based utilization patterns
export const conditionUtilizationPatterns: Record<string, {
  baseVisits: number
  specialistVisits: number
  diagnosticTests: number
  emergencyRisk: number
  medications: number
  relatedConditions?: string[]
}> = {
  "Type 2 Diabetes": {
    baseVisits: 4,
    specialistVisits: 2,
    diagnosticTests: 4, // A1C tests, glucose monitoring
    emergencyRisk: 0.15,
    medications: 2,
    relatedConditions: ["Hypertension", "High Cholesterol", "Kidney Disease"]
  },
  "Hypertension": {
    baseVisits: 3,
    specialistVisits: 1,
    diagnosticTests: 2,
    emergencyRisk: 0.1,
    medications: 1,
    relatedConditions: ["Heart Disease", "Kidney Disease"]
  },
  "Asthma": {
    baseVisits: 2,
    specialistVisits: 1,
    diagnosticTests: 1,
    emergencyRisk: 0.2,
    medications: 2,
    relatedConditions: ["Allergies", "COPD"]
  },
  "Depression": {
    baseVisits: 1,
    specialistVisits: 12, // Monthly therapy
    diagnosticTests: 0,
    emergencyRisk: 0.05,
    medications: 1,
    relatedConditions: ["Anxiety"]
  },
  "Anxiety": {
    baseVisits: 1,
    specialistVisits: 8,
    diagnosticTests: 0,
    emergencyRisk: 0.05,
    medications: 1,
    relatedConditions: ["Depression"]
  },
  "High Cholesterol": {
    baseVisits: 2,
    specialistVisits: 0,
    diagnosticTests: 2, // Lipid panels
    emergencyRisk: 0.05,
    medications: 1,
    relatedConditions: ["Heart Disease", "Hypertension"]
  },
  "Arthritis": {
    baseVisits: 2,
    specialistVisits: 2,
    diagnosticTests: 2, // X-rays, joint fluid tests
    emergencyRisk: 0.02,
    medications: 2,
    relatedConditions: []
  },
  "COPD": {
    baseVisits: 4,
    specialistVisits: 3,
    diagnosticTests: 3, // Spirometry, chest X-rays
    emergencyRisk: 0.3,
    medications: 3,
    relatedConditions: ["Heart Disease", "Asthma"]
  },
  "Heart Disease": {
    baseVisits: 4,
    specialistVisits: 4,
    diagnosticTests: 6, // EKG, stress tests, echo
    emergencyRisk: 0.25,
    medications: 3,
    relatedConditions: ["Hypertension", "High Cholesterol", "Diabetes"]
  },
  "Cancer": {
    baseVisits: 2,
    specialistVisits: 12,
    diagnosticTests: 8,
    emergencyRisk: 0.2,
    medications: 2,
    relatedConditions: []
  },
  "Thyroid Disease": {
    baseVisits: 2,
    specialistVisits: 2,
    diagnosticTests: 3, // TSH tests
    emergencyRisk: 0.02,
    medications: 1,
    relatedConditions: []
  },
  "Kidney Disease": {
    baseVisits: 3,
    specialistVisits: 4,
    diagnosticTests: 6, // Kidney function tests
    emergencyRisk: 0.15,
    medications: 2,
    relatedConditions: ["Hypertension", "Diabetes"]
  },
  "Sleep Apnea": {
    baseVisits: 1,
    specialistVisits: 2,
    diagnosticTests: 1, // Sleep study
    emergencyRisk: 0.05,
    medications: 0,
    relatedConditions: ["Heart Disease", "Hypertension"]
  },
  "Migraines": {
    baseVisits: 2,
    specialistVisits: 2,
    diagnosticTests: 1,
    emergencyRisk: 0.1,
    medications: 2,
    relatedConditions: []
  }
}

// Severity multipliers
export const severityMultipliers = {
  mild: 0.7,
  moderate: 1.0,
  severe: 1.5,
  controlled: 0.8,
  uncontrolled: 1.3
}

// Age-condition interaction factors
export const ageConditionFactors = {
  pediatric: { // 0-18
    multiplier: 1.2,
    conditions: {
      "Asthma": 1.5,
      "ADHD": 2.0,
      "Autism Spectrum": 3.0,
      "Type 1 Diabetes": 1.8
    }
  },
  youngAdult: { // 18-30
    multiplier: 0.8,
    conditions: {
      "Depression": 1.3,
      "Anxiety": 1.3,
      "Migraines": 1.2
    }
  },
  adult: { // 30-50
    multiplier: 1.0,
    conditions: {
      "Hypertension": 1.1,
      "Type 2 Diabetes": 1.2
    }
  },
  senior: { // 50+
    multiplier: 1.3,
    conditions: {
      "Heart Disease": 1.5,
      "Arthritis": 1.4,
      "Cancer": 1.6,
      "COPD": 1.5
    }
  }
}

// Service type mapping for insurance categories
export const serviceTypeMapping = {
  primaryCare: "Primary care visit to treat an injury or illness",
  specialist: "Specialist visit",
  preventive: "Preventive care/screening/immunization",
  diagnostic: "Diagnostic test (x-ray, blood work)",
  imaging: "Imaging (CT/PET scans, MRIs)",
  emergency: "Emergency room care",
  urgentCare: "Urgent care",
  mentalHealth: "Outpatient mental health/behavioral health/substance abuse services",
  therapy: "Rehabilitation services",
  generic: "Generic drugs",
  brandDrugs: "Preferred brand drugs",
  specialtyDrugs: "Specialty drugs"
}

export interface UtilizationPrediction {
  serviceType: string
  annualVisits: number
  severity: "low" | "medium" | "high"
  reason: string
  basedOn: "age" | "condition" | "medication" | "lifestyle" | "preventive"
}

export interface RiskFactor {
  name: string
  category: "demographic" | "medical" | "lifestyle" | "social"
  impact: "low" | "medium" | "high"
  score: number
  description: string
}

export interface RiskAssessment {
  overallScore: number // 0-100
  riskLevel: "low" | "moderate" | "high" | "critical"
  factors: RiskFactor[]
  recommendations: string[]
}

export interface HealthcareUtilization {
  predictions: UtilizationPrediction[]
  totalVisits: number
  emergencyRisk: number
  costCategory: "low" | "moderate" | "high" | "very_high"
  primaryConditions: string[]
  recommendations: string[]
  riskAssessment?: RiskAssessment
}

// Calculate healthcare utilization for a member
export function calculateHealthcareUtilization(member: Member): HealthcareUtilization {
  const predictions: UtilizationPrediction[] = []
  let totalEmergencyRisk = 0
  const primaryConditions: string[] = []
  
  // Get age group
  const age = parseInt(member.age) || 0
  const ageGroup = age < 18 ? "pediatric" : 
                   age < 30 ? "youngAdult" :
                   age < 50 ? "adult" : "senior"
  
  // Base utilization from age
  const ageUtilization = Object.entries(ageBasedUtilization).find(([_, group]) => 
    age >= group.ageRange[0] && age <= group.ageRange[1]
  )?.[1]
  
  if (ageUtilization) {
    Object.entries(ageUtilization.expectedVisits).forEach(([service, frequency]) => {
      predictions.push({
        serviceType: service,
        annualVisits: frequency,
        severity: frequency > 4 ? "high" : frequency > 2 ? "medium" : "low",
        reason: `Age-based recommendation for ${age} year old`,
        basedOn: "age"
      })
    })
  }
  
  // Condition-based utilization
  const conditionVisits: Record<string, number> = {}
  
  member.conditions.filter(c => c !== "NONE").forEach(conditionName => {
    const pattern = conditionUtilizationPatterns[conditionName]
    if (pattern) {
      primaryConditions.push(conditionName)
      
      // Apply age-condition interaction
      const ageConditionMultiplier = ageConditionFactors[ageGroup]?.conditions[conditionName] || 1.0
      const ageMultiplier = ageConditionFactors[ageGroup]?.multiplier || 1.0
      
      // Primary care visits
      const primaryVisits = Math.round(pattern.baseVisits * ageConditionMultiplier * ageMultiplier)
      conditionVisits[serviceTypeMapping.primaryCare] = 
        (conditionVisits[serviceTypeMapping.primaryCare] || 0) + primaryVisits
      
      // Specialist visits
      if (pattern.specialistVisits > 0) {
        const specialistType = conditionName.includes("Depression") || conditionName.includes("Anxiety") 
          ? serviceTypeMapping.mentalHealth 
          : serviceTypeMapping.specialist
          
        conditionVisits[specialistType] = 
          (conditionVisits[specialistType] || 0) + 
          Math.round(pattern.specialistVisits * ageConditionMultiplier * ageMultiplier)
      }
      
      // Diagnostic tests
      if (pattern.diagnosticTests > 0) {
        conditionVisits[serviceTypeMapping.diagnostic] = 
          (conditionVisits[serviceTypeMapping.diagnostic] || 0) + 
          Math.round(pattern.diagnosticTests * ageConditionMultiplier)
      }
      
      // Emergency risk
      totalEmergencyRisk += pattern.emergencyRisk * ageMultiplier
    }
  })
  
  // Add condition-based predictions
  const actualConditions = member.conditions.filter(c => c !== "NONE")
  Object.entries(conditionVisits).forEach(([service, visits]) => {
    predictions.push({
      serviceType: service,
      annualVisits: visits,
      severity: visits > 10 ? "high" : visits > 5 ? "medium" : "low",
      reason: `Management of ${actualConditions.join(", ")}`,
      basedOn: "condition"
    })
  })
  
  // Medication management visits
  if (member.medications.length > 0 && !member.medications.includes("NONE")) {
    const medManagementVisits = Math.ceil(member.medications.length / 2) * 2
    predictions.push({
      serviceType: serviceTypeMapping.primaryCare,
      annualVisits: medManagementVisits,
      severity: medManagementVisits > 4 ? "medium" : "low",
      reason: "Medication management and monitoring",
      basedOn: "medication"
    })
  }
  
  // Lifestyle-based adjustments
  if (member.smokingStatus === "current") {
    totalEmergencyRisk += 0.1
    predictions.push({
      serviceType: serviceTypeMapping.preventive,
      annualVisits: 2,
      severity: "medium",
      reason: "Smoking cessation counseling",
      basedOn: "lifestyle"
    })
  }
  
  if (member.alcoholUse === "heavy") {
    totalEmergencyRisk += 0.15
  }
  
  if (member.exerciseFrequency === "none" && age > 30) {
    totalEmergencyRisk += 0.05
  }
  
  // Pregnancy-related visits
  if (member.pregnancyStatus?.isPregnant) {
    predictions.push({
      serviceType: "Delivery and all inpatient services for maternity care",
      annualVisits: 1,
      severity: member.pregnancyStatus.isHighRisk ? "high" : "medium",
      reason: "Pregnancy and delivery",
      basedOn: "condition"
    })
    
    predictions.push({
      serviceType: serviceTypeMapping.specialist,
      annualVisits: member.pregnancyStatus.isHighRisk ? 20 : 14,
      severity: member.pregnancyStatus.isHighRisk ? "high" : "medium",
      reason: "Prenatal care visits",
      basedOn: "condition"
    })
  }
  
  // Emergency visits based on risk
  if (totalEmergencyRisk > 0) {
    const emergencyVisits = Math.round(totalEmergencyRisk * 2)
    if (emergencyVisits > 0) {
      predictions.push({
        serviceType: serviceTypeMapping.emergency,
        annualVisits: emergencyVisits,
        severity: emergencyVisits > 2 ? "high" : "medium",
        reason: "Based on health risk factors",
        basedOn: "condition"
      })
    }
  }
  
  // Calculate total visits
  const totalVisits = predictions.reduce((sum, p) => sum + p.annualVisits, 0)
  
  // Determine cost category
  const costCategory = totalVisits > 50 ? "very_high" :
                      totalVisits > 30 ? "high" :
                      totalVisits > 15 ? "moderate" : "low"
  
  // Generate recommendations
  const recommendations: string[] = []
  
  if (member.conditions.length === 0) {
    recommendations.push("Focus on preventive care to maintain good health")
  }
  
  if (totalEmergencyRisk > 0.2) {
    recommendations.push("Consider a plan with good emergency coverage")
  }
  
  if (member.medications.length > 3) {
    recommendations.push("Look for plans with comprehensive prescription coverage")
  }
  
  if (predictions.some(p => p.serviceType.includes("mental health") && p.annualVisits > 6)) {
    recommendations.push("Ensure mental health services are well-covered")
  }
  
  if (member.conditions.some(c => conditionUtilizationPatterns[c]?.specialistVisits > 4)) {
    recommendations.push("Choose a plan with reasonable specialist copays")
  }
  
  // Calculate risk assessment
  const riskAssessment = calculateRiskScore(member, totalEmergencyRisk, predictions)
  
  return {
    predictions,
    totalVisits,
    emergencyRisk: Math.min(totalEmergencyRisk, 1.0),
    costCategory,
    primaryConditions,
    recommendations,
    riskAssessment
  }
}

// Calculate comprehensive risk score
export function calculateRiskScore(
  member: Member, 
  emergencyRisk: number,
  predictions: UtilizationPrediction[]
): RiskAssessment {
  const factors: RiskFactor[] = []
  let totalScore = 0
  
  // Age risk
  const age = parseInt(member.age) || 0
  if (age > 65) {
    factors.push({
      name: "Advanced Age",
      category: "demographic",
      impact: age > 75 ? "high" : "medium",
      score: age > 75 ? 20 : 10,
      description: `Age ${age} increases health complexity`
    })
    totalScore += age > 75 ? 20 : 10
  } else if (age < 5) {
    factors.push({
      name: "Pediatric Age",
      category: "demographic",
      impact: "medium",
      score: 10,
      description: "Young children require frequent care"
    })
    totalScore += 10
  }
  
  // Chronic condition risk
  const chronicConditions = member.conditions.filter(c => 
    ["Diabetes", "Heart Disease", "COPD", "Kidney Disease", "Cancer"].some(chronic => 
      c.includes(chronic)
    )
  )
  
  if (chronicConditions.length > 0) {
    const conditionScore = Math.min(chronicConditions.length * 15, 45)
    factors.push({
      name: "Chronic Conditions",
      category: "medical",
      impact: chronicConditions.length > 2 ? "high" : "medium",
      score: conditionScore,
      description: `${chronicConditions.length} chronic condition(s) requiring ongoing management`
    })
    totalScore += conditionScore
  }
  
  // Multiple conditions (comorbidity)
  if (member.conditions.length > 3) {
    factors.push({
      name: "Multiple Conditions",
      category: "medical",
      impact: "high",
      score: 15,
      description: "Complex care coordination needed for multiple conditions"
    })
    totalScore += 15
  }
  
  // Medication complexity
  if (member.medications.length > 5) {
    factors.push({
      name: "Polypharmacy",
      category: "medical",
      impact: "medium",
      score: 10,
      description: "Multiple medications increase interaction risks"
    })
    totalScore += 10
  }
  
  // Lifestyle risks
  if (member.smokingStatus === "current") {
    factors.push({
      name: "Current Smoker",
      category: "lifestyle",
      impact: "high",
      score: 15,
      description: "Smoking significantly increases health risks"
    })
    totalScore += 15
  }
  
  if (member.alcoholUse === "heavy") {
    factors.push({
      name: "Heavy Alcohol Use",
      category: "lifestyle",
      impact: "high",
      score: 12,
      description: "Heavy alcohol use impacts multiple organ systems"
    })
    totalScore += 12
  }
  
  if (member.exerciseFrequency === "none" && age > 30) {
    factors.push({
      name: "Sedentary Lifestyle",
      category: "lifestyle",
      impact: "medium",
      score: 8,
      description: "Lack of exercise increases chronic disease risk"
    })
    totalScore += 8
  }
  
  // BMI risk
  if (member.bmi) {
    if (member.bmi > 30) {
      factors.push({
        name: "Obesity",
        category: "medical",
        impact: member.bmi > 35 ? "high" : "medium",
        score: member.bmi > 35 ? 15 : 10,
        description: `BMI of ${member.bmi} increases health complications`
      })
      totalScore += member.bmi > 35 ? 15 : 10
    } else if (member.bmi < 18.5) {
      factors.push({
        name: "Underweight",
        category: "medical",
        impact: "medium",
        score: 8,
        description: "Low BMI may indicate nutritional concerns"
      })
      totalScore += 8
    }
  }
  
  // Emergency risk
  if (emergencyRisk > 0.2) {
    factors.push({
      name: "High Emergency Risk",
      category: "medical",
      impact: "high",
      score: 20,
      description: "Elevated risk of emergency department visits"
    })
    totalScore += 20
  }
  
  // Pregnancy risk
  if (member.pregnancyStatus?.isPregnant) {
    if (member.pregnancyStatus.isHighRisk) {
      factors.push({
        name: "High-Risk Pregnancy",
        category: "medical",
        impact: "high",
        score: 25,
        description: "Requires specialized maternal care"
      })
      totalScore += 25
    } else {
      factors.push({
        name: "Pregnancy",
        category: "medical",
        impact: "medium",
        score: 10,
        description: "Normal pregnancy care needed"
      })
      totalScore += 10
    }
  }
  
  // Mental health considerations
  const mentalHealthConditions = member.conditions.filter(c => 
    ["Depression", "Anxiety", "ADHD", "Bipolar"].some(mh => c.includes(mh))
  )
  
  if (mentalHealthConditions.length > 0) {
    factors.push({
      name: "Mental Health Conditions",
      category: "medical",
      impact: mentalHealthConditions.length > 1 ? "high" : "medium",
      score: mentalHealthConditions.length > 1 ? 15 : 10,
      description: "Requires integrated mental health care"
    })
    totalScore += mentalHealthConditions.length > 1 ? 15 : 10
  }
  
  // Cap total score at 100
  const overallScore = Math.min(totalScore, 100)
  
  // Determine risk level
  const riskLevel = overallScore >= 70 ? "critical" :
                   overallScore >= 50 ? "high" :
                   overallScore >= 30 ? "moderate" : "low"
  
  // Generate risk-based recommendations
  const riskRecommendations: string[] = []
  
  if (riskLevel === "critical" || riskLevel === "high") {
    riskRecommendations.push("Consider comprehensive PPO or low-deductible plans")
    riskRecommendations.push("Ensure out-of-pocket maximums are affordable")
  }
  
  if (factors.some(f => f.name === "Chronic Conditions")) {
    riskRecommendations.push("Verify all specialists are in-network")
    riskRecommendations.push("Check prescription formularies for your medications")
  }
  
  if (factors.some(f => f.category === "lifestyle")) {
    riskRecommendations.push("Look for plans with wellness programs")
    riskRecommendations.push("Consider preventive care benefits")
  }
  
  if (emergencyRisk > 0.15) {
    riskRecommendations.push("Prioritize plans with reasonable ER copays")
  }
  
  return {
    overallScore,
    riskLevel,
    factors: factors.sort((a, b) => b.score - a.score),
    recommendations: riskRecommendations
  }
}

// Preventive care schedule based on age and gender
export function getPreventiveCareSchedule(member: Member): UtilizationPrediction[] {
  const age = parseInt(member.age) || 0
  const gender = member.gender || 'prefer_not_to_say'
  const predictions: UtilizationPrediction[] = []
  
  // Annual physical for everyone
  predictions.push({
    serviceType: serviceTypeMapping.preventive,
    annualVisits: 1,
    severity: "low",
    reason: "Annual physical exam",
    basedOn: "preventive"
  })
  
  // Age and gender-specific screenings
  if (age >= 50) {
    predictions.push({
      serviceType: serviceTypeMapping.preventive,
      annualVisits: 0.2, // Every 5 years
      severity: "low",
      reason: "Colonoscopy screening",
      basedOn: "preventive"
    })
  }
  
  if (gender === 'female' && age >= 40) {
    predictions.push({
      serviceType: serviceTypeMapping.imaging,
      annualVisits: 1,
      severity: "low",
      reason: "Annual mammogram",
      basedOn: "preventive"
    })
  }
  
  if (gender === 'female' && age >= 21) {
    predictions.push({
      serviceType: serviceTypeMapping.preventive,
      annualVisits: 0.33, // Every 3 years
      severity: "low",
      reason: "Cervical cancer screening",
      basedOn: "preventive"
    })
  }
  
  if (age >= 45) {
    predictions.push({
      serviceType: serviceTypeMapping.diagnostic,
      annualVisits: 1,
      severity: "low",
      reason: "Cholesterol screening",
      basedOn: "preventive"
    })
  }
  
  // Dental and vision
  predictions.push({
    serviceType: "Children's dental check-up",
    annualVisits: 2,
    severity: "low",
    reason: "Routine dental cleanings",
    basedOn: "preventive"
  })
  
  if (age >= 40) {
    predictions.push({
      serviceType: "Children's eye exam",
      annualVisits: 1,
      severity: "low",
      reason: "Annual eye exam",
      basedOn: "preventive"
    })
  }
  
  return predictions
}