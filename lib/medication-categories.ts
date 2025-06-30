// Medication categories and their typical cost tiers
export type MedicationCategory = 
  | 'generic'
  | 'preferred-brand'
  | 'non-preferred-brand'
  | 'specialty'
  | 'preventive'
  | 'maintenance'
  | 'acute'

export interface MedicationCategoryInfo {
  category: MedicationCategory
  displayName: string
  description: string
  typicalTier: number
  averageCopay: {
    generic: number
    preferredBrand: number
    nonPreferredBrand: number
    specialty: number
  }
  color: string
  icon: string
}

export const medicationCategories: Record<MedicationCategory, MedicationCategoryInfo> = {
  generic: {
    category: 'generic',
    displayName: 'Generic',
    description: 'Cost-effective alternatives to brand-name drugs',
    typicalTier: 1,
    averageCopay: { generic: 10, preferredBrand: 0, nonPreferredBrand: 0, specialty: 0 },
    color: 'green',
    icon: '💊'
  },
  'preferred-brand': {
    category: 'preferred-brand',
    displayName: 'Preferred Brand',
    description: 'Brand-name drugs on formulary',
    typicalTier: 2,
    averageCopay: { generic: 0, preferredBrand: 40, nonPreferredBrand: 0, specialty: 0 },
    color: 'blue',
    icon: '💉'
  },
  'non-preferred-brand': {
    category: 'non-preferred-brand',
    displayName: 'Non-Preferred Brand',
    description: 'Brand-name drugs with alternatives available',
    typicalTier: 3,
    averageCopay: { generic: 0, preferredBrand: 0, nonPreferredBrand: 80, specialty: 0 },
    color: 'yellow',
    icon: '🏥'
  },
  specialty: {
    category: 'specialty',
    displayName: 'Specialty',
    description: 'High-cost drugs for complex conditions',
    typicalTier: 4,
    averageCopay: { generic: 0, preferredBrand: 0, nonPreferredBrand: 0, specialty: 250 },
    color: 'red',
    icon: '🧬'
  },
  preventive: {
    category: 'preventive',
    displayName: 'Preventive',
    description: 'Preventive medications often covered at no cost',
    typicalTier: 0,
    averageCopay: { generic: 0, preferredBrand: 0, nonPreferredBrand: 0, specialty: 0 },
    color: 'purple',
    icon: '🛡️'
  },
  maintenance: {
    category: 'maintenance',
    displayName: 'Maintenance',
    description: 'Long-term medications for chronic conditions',
    typicalTier: 2,
    averageCopay: { generic: 15, preferredBrand: 45, nonPreferredBrand: 85, specialty: 0 },
    color: 'indigo',
    icon: '📅'
  },
  acute: {
    category: 'acute',
    displayName: 'Acute',
    description: 'Short-term medications for temporary conditions',
    typicalTier: 1,
    averageCopay: { generic: 10, preferredBrand: 35, nonPreferredBrand: 70, specialty: 0 },
    color: 'orange',
    icon: '⚡'
  }
}

// Common medications mapped to categories
export const commonMedicationMappings: Record<string, MedicationCategory> = {
  // Generic maintenance medications
  'metformin': 'generic',
  'lisinopril': 'generic',
  'atorvastatin': 'generic',
  'amlodipine': 'generic',
  'metoprolol': 'generic',
  'omeprazole': 'generic',
  'levothyroxine': 'generic',
  'albuterol': 'generic',
  'sertraline': 'generic',
  'gabapentin': 'generic',
  
  // Preferred brand medications
  'januvia': 'preferred-brand',
  'eliquis': 'preferred-brand',
  'xarelto': 'preferred-brand',
  'synthroid': 'preferred-brand',
  'advair': 'preferred-brand',
  'symbicort': 'preferred-brand',
  'lantus': 'preferred-brand',
  'humalog': 'preferred-brand',
  
  // Non-preferred brand
  'crestor': 'non-preferred-brand',
  'nexium': 'non-preferred-brand',
  'cymbalta': 'non-preferred-brand',
  'vyvanse': 'non-preferred-brand',
  'lyrica': 'non-preferred-brand',
  
  // Specialty medications
  'humira': 'specialty',
  'enbrel': 'specialty',
  'remicade': 'specialty',
  'ozempic': 'specialty',
  'mounjaro': 'specialty',
  'dupixent': 'specialty',
  'keytruda': 'specialty',
  'stelara': 'specialty',
  'cosentyx': 'specialty',
  
  // Preventive medications
  'aspirin': 'preventive',
  'prenatal vitamins': 'preventive',
  'statins': 'preventive',
  'contraceptives': 'preventive',
  'vaccines': 'preventive',
  
  // Acute medications
  'amoxicillin': 'acute',
  'azithromycin': 'acute',
  'prednisone': 'acute',
  'hydrocodone': 'acute',
  'tramadol': 'acute',
}

export function categorizeMedication(medicationName: string): MedicationCategory {
  const normalized = medicationName.toLowerCase().trim()
  
  // Check direct mapping
  if (commonMedicationMappings[normalized]) {
    return commonMedicationMappings[normalized]
  }
  
  // Check partial matches
  for (const [med, category] of Object.entries(commonMedicationMappings)) {
    if (normalized.includes(med) || med.includes(normalized)) {
      return category
    }
  }
  
  // Default categorization based on keywords
  if (normalized.includes('generic') || normalized.includes('(generic)')) {
    return 'generic'
  }
  
  if (normalized.includes('insulin') || normalized.includes('biologic')) {
    return 'specialty'
  }
  
  if (normalized.includes('vitamin') || normalized.includes('vaccine')) {
    return 'preventive'
  }
  
  // Default to generic if unknown
  return 'generic'
}

export function getMedicationCostEstimate(
  medication: string,
  category: MedicationCategory,
  tier: number = 0
): number {
  const categoryInfo = medicationCategories[category]
  
  // Use tier-based pricing if available
  if (tier > 0) {
    switch (tier) {
      case 1: return 10  // Generic
      case 2: return 40  // Preferred brand
      case 3: return 80  // Non-preferred brand
      case 4: return 250 // Specialty
      default: return 50 // Default
    }
  }
  
  // Otherwise use category average
  const copays = categoryInfo.averageCopay
  return copays.generic || copays.preferredBrand || copays.nonPreferredBrand || copays.specialty || 30
}

export function getCategoryColor(category: MedicationCategory): string {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200'
  }
  
  return colors[medicationCategories[category].color] || 'bg-gray-100 text-gray-800 border-gray-200'
}