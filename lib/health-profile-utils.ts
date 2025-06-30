import { EnhancedMember, Condition, Medication, ExpectedVisit } from "./health-profile-types"

// Common medical conditions with ICD codes
export const commonConditions = [
  { name: "Type 2 Diabetes", icdCode: "E11", category: "Endocrine" },
  { name: "Hypertension", icdCode: "I10", category: "Cardiovascular" },
  { name: "Asthma", icdCode: "J45", category: "Respiratory" },
  { name: "Depression", icdCode: "F32", category: "Mental Health" },
  { name: "Anxiety", icdCode: "F41", category: "Mental Health" },
  { name: "High Cholesterol", icdCode: "E78", category: "Metabolic" },
  { name: "Arthritis", icdCode: "M19", category: "Musculoskeletal" },
  { name: "COPD", icdCode: "J44", category: "Respiratory" },
  { name: "Heart Disease", icdCode: "I25", category: "Cardiovascular" },
  { name: "Cancer", icdCode: "C80", category: "Oncology" },
  { name: "Thyroid Disease", icdCode: "E07", category: "Endocrine" },
  { name: "Kidney Disease", icdCode: "N18", category: "Renal" },
  { name: "Sleep Apnea", icdCode: "G47.33", category: "Sleep" },
  { name: "Migraines", icdCode: "G43", category: "Neurological" },
  { name: "ADHD", icdCode: "F90", category: "Mental Health" },
  { name: "Autism Spectrum", icdCode: "F84", category: "Developmental" },
  { name: "Epilepsy", icdCode: "G40", category: "Neurological" },
  { name: "Pregnancy", icdCode: "Z33", category: "Maternity" },
]

// Common medications by class
export const commonMedications = {
  diabetes: [
    { name: "Metformin", genericName: "metformin", drugClass: "Biguanides" },
    { name: "Januvia", genericName: "sitagliptin", drugClass: "DPP-4 inhibitors" },
    { name: "Ozempic", genericName: "semaglutide", drugClass: "GLP-1 agonists", isSpecialty: true },
  ],
  hypertension: [
    { name: "Lisinopril", genericName: "lisinopril", drugClass: "ACE inhibitors" },
    { name: "Amlodipine", genericName: "amlodipine", drugClass: "Calcium channel blockers" },
    { name: "Metoprolol", genericName: "metoprolol", drugClass: "Beta blockers" },
  ],
  cholesterol: [
    { name: "Lipitor", genericName: "atorvastatin", drugClass: "Statins" },
    { name: "Crestor", genericName: "rosuvastatin", drugClass: "Statins" },
  ],
  mentalHealth: [
    { name: "Lexapro", genericName: "escitalopram", drugClass: "SSRI" },
    { name: "Wellbutrin", genericName: "bupropion", drugClass: "Atypical antidepressants" },
    { name: "Xanax", genericName: "alprazolam", drugClass: "Benzodiazepines" },
  ],
  asthma: [
    { name: "Albuterol", genericName: "albuterol", drugClass: "Short-acting beta agonists" },
    { name: "Advair", genericName: "fluticasone/salmeterol", drugClass: "Combination inhaler" },
  ],
}

// Age-based health utilization patterns
export const ageBasedUtilization = {
  infant: { // 0-2
    ageRange: [0, 2],
    preventiveCare: ["Well-child visits (6/year)", "Immunizations"],
    commonConditions: ["Ear infections", "Respiratory infections"],
    expectedVisits: {
      "Primary care": 8,
      "Preventive care": 6,
      "Urgent care": 2,
      "Specialist visits": 1,
    }
  },
  toddler: { // 2-6
    ageRange: [2, 6],
    preventiveCare: ["Annual check-up", "Dental visits", "Vision screening"],
    commonConditions: ["Allergies", "Asthma", "ADHD"],
    expectedVisits: {
      "Primary care": 3,
      "Preventive care": 2,
      "Urgent care": 2,
      "Dental": 2,
    }
  },
  child: { // 6-13
    ageRange: [6, 13],
    preventiveCare: ["Annual physical", "Dental cleaning", "Sports physical"],
    commonConditions: ["Asthma", "ADHD", "Anxiety"],
    expectedVisits: {
      "Primary care": 2,
      "Preventive care": 1,
      "Dental": 2,
      "Mental health": 0.5,
    }
  },
  teen: { // 13-18
    ageRange: [13, 18],
    preventiveCare: ["Annual physical", "Sports physical", "Mental health screening"],
    commonConditions: ["Acne", "Depression", "Anxiety", "Sports injuries"],
    expectedVisits: {
      "Primary care": 2,
      "Preventive care": 1,
      "Mental health": 1,
      "Orthopedic": 0.5,
    }
  },
  youngAdult: { // 18-30
    ageRange: [18, 30],
    preventiveCare: ["Annual physical", "Dental cleaning", "STD screening"],
    commonConditions: ["Anxiety", "Depression", "Back pain"],
    expectedVisits: {
      "Primary care": 1.5,
      "Preventive care": 1,
      "Mental health": 1,
      "Urgent care": 1,
    }
  },
  adult: { // 30-40
    ageRange: [30, 40],
    preventiveCare: ["Annual physical", "Cholesterol screening", "Blood pressure check"],
    commonConditions: ["Hypertension", "Diabetes", "Depression"],
    expectedVisits: {
      "Primary care": 2,
      "Preventive care": 1,
      "Specialist visits": 1,
      "Diagnostic tests": 1,
    }
  },
  middleAge: { // 40-50
    ageRange: [40, 50],
    preventiveCare: ["Annual physical", "Mammogram", "Colonoscopy prep"],
    commonConditions: ["Hypertension", "Diabetes", "High cholesterol"],
    expectedVisits: {
      "Primary care": 2.5,
      "Preventive care": 2,
      "Specialist visits": 2,
      "Diagnostic tests": 2,
    }
  },
  olderAdult: { // 50-65
    ageRange: [50, 65],
    preventiveCare: ["Annual physical", "Colonoscopy", "Bone density test"],
    commonConditions: ["Heart disease", "Arthritis", "Diabetes"],
    expectedVisits: {
      "Primary care": 3,
      "Preventive care": 2,
      "Specialist visits": 3,
      "Diagnostic tests": 3,
    }
  },
  senior: { // 65-75
    ageRange: [65, 75],
    preventiveCare: ["Medicare wellness visit", "Vaccinations", "Cancer screenings"],
    commonConditions: ["Heart disease", "Arthritis", "Diabetes", "Cancer"],
    expectedVisits: {
      "Primary care": 4,
      "Preventive care": 3,
      "Specialist visits": 4,
      "Diagnostic tests": 4,
    }
  },
  elderly: { // 75+
    ageRange: [75, 150],
    preventiveCare: ["Fall risk assessment", "Cognitive screening", "Medication review"],
    commonConditions: ["Multiple chronic conditions", "Dementia", "Fall risk"],
    expectedVisits: {
      "Primary care": 6,
      "Specialist visits": 6,
      "Home health care": 2,
      "Diagnostic tests": 5,
    }
  }
}

// Calculate expected healthcare utilization based on member profile
export function calculateExpectedUtilization(member: EnhancedMember): ExpectedVisit[] {
  const visits: ExpectedVisit[] = []
  
  // Find age group
  const ageGroup = Object.entries(ageBasedUtilization).find(([_, group]) => 
    member.age >= group.ageRange[0] && member.age <= group.ageRange[1]
  )?.[1]
  
  if (ageGroup) {
    // Add base utilization for age
    Object.entries(ageGroup.expectedVisits).forEach(([service, frequency]) => {
      visits.push({
        serviceType: service,
        annualFrequency: frequency,
        isPreventive: service.includes("Preventive") || service.includes("wellness"),
        basedOn: 'age'
      })
    })
  }
  
  // Add condition-based utilization
  member.conditions.forEach(condition => {
    // Add specialist visits for each condition
    const specialistVisits = condition.severity === 'severe' ? 6 : 
                           condition.severity === 'moderate' ? 4 : 2
    
    visits.push({
      serviceType: `Specialist - ${condition.name}`,
      annualFrequency: specialistVisits,
      isPreventive: false,
      basedOn: 'condition'
    })
    
    // Add diagnostic tests
    if (condition.status === 'active') {
      visits.push({
        serviceType: `Lab tests - ${condition.name}`,
        annualFrequency: condition.severity === 'severe' ? 4 : 2,
        isPreventive: false,
        basedOn: 'condition'
      })
    }
  })
  
  // Add medication-based utilization
  const prescriptionFills = member.medications.length * 12 // Monthly fills
  if (prescriptionFills > 0) {
    visits.push({
      serviceType: "Prescription drugs",
      annualFrequency: prescriptionFills,
      isPreventive: false,
      basedOn: 'medication'
    })
  }
  
  // Add pregnancy-related visits if applicable
  if (member.pregnancyStatus) {
    visits.push({
      serviceType: "Prenatal visits",
      annualFrequency: 15,
      isPreventive: true,
      basedOn: 'condition'
    })
    visits.push({
      serviceType: "Ultrasounds",
      annualFrequency: 3,
      isPreventive: false,
      basedOn: 'condition'
    })
  }
  
  // Merge duplicate service types
  const merged = visits.reduce((acc, visit) => {
    const existing = acc.find(v => v.serviceType === visit.serviceType)
    if (existing) {
      existing.annualFrequency += visit.annualFrequency
    } else {
      acc.push(visit)
    }
    return acc
  }, [] as ExpectedVisit[])
  
  return merged
}

// Generate health profile summary for AI context
export function generateHealthProfileSummary(members: EnhancedMember[] | any[]): string {
  if (members.length === 0) return "No health profile configured."
  
  const summary = [`Family of ${members.length}:`]
  
  members.forEach((member, idx) => {
    // Handle both EnhancedMember and simple Member types
    let conditions: string
    let medications: string
    
    if (typeof member.conditions?.[0] === 'string') {
      // Simple Member type
      conditions = member.conditions.filter((c: string) => c !== 'NONE').join(", ")
      medications = member.medications?.filter((m: string) => m !== 'NONE').join(", ") || ''
    } else {
      // EnhancedMember type
      conditions = member.conditions?.map((c: any) => 
        `${c.name}${c.severity ? ` (${c.severity})` : ''}`
      ).join(", ") || ''
      medications = member.medications?.map((m: any) => m.name).join(", ") || ''
    }
    
    summary.push(
      `- Member ${idx + 1}: ${member.age}yo ${member.gender || 'gender not specified'}, ` +
      `${conditions || 'no conditions'}, ` +
      `${medications ? `taking ${medications}` : 'no medications'}`
    )
  })
  
  return summary.join("\n")
}

// Validate and normalize condition input
export function normalizeCondition(input: string): Partial<Condition> | null {
  const normalized = input.trim()
  const match = commonConditions.find(c => 
    c.name.toLowerCase() === normalized.toLowerCase()
  )
  
  if (match) {
    return {
      name: match.name,
      icdCode: match.icdCode,
      severity: 'moderate',
      status: 'active'
    }
  }
  
  return {
    name: normalized,
    severity: 'moderate',
    status: 'active'
  }
}

// Calculate BMI
export function calculateBMI(heightInches: number, weightPounds: number): number {
  if (heightInches <= 0 || weightPounds <= 0) return 0
  return Math.round((weightPounds / (heightInches * heightInches)) * 703 * 10) / 10
}

// Get BMI category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal weight"
  if (bmi < 30) return "Overweight"
  return "Obese"
}