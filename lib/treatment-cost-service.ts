// Treatment Cost Intelligence Service
// Retrieves real-world medical treatment costs using AI-powered web search

export interface TreatmentCost {
  treatmentId: string
  name: string
  category: TreatmentCategory
  cptCode?: string
  icdCodes?: string[]
  averageCost: number
  costRange: [number, number]
  regionalMultiplier: number
  lastUpdated: Date
  dataSource: 'webSearch' | 'database' | 'estimate'
  confidence: ConfidenceLevel
  details?: {
    facilityFee?: number
    physicianFee?: number
    anesthesiaFee?: number
    labFee?: number
  }
}

export type TreatmentCategory = 
  | 'office_visit'
  | 'specialist_visit'
  | 'emergency_room'
  | 'urgent_care'
  | 'diagnostic_lab'
  | 'diagnostic_imaging'
  | 'procedure_minor'
  | 'procedure_major'
  | 'surgery_outpatient'
  | 'surgery_inpatient'
  | 'medication_generic'
  | 'medication_brand'
  | 'medication_specialty'
  | 'therapy_physical'
  | 'therapy_mental'
  | 'preventive_care'
  | 'maternity_care'
  | 'dental_care'
  | 'vision_care'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

// Common medical procedures with typical costs (fallback data)
export const commonTreatmentCosts: Record<string, Partial<TreatmentCost>> = {
  // Office Visits
  'primary_care_visit': {
    name: 'Primary Care Visit',
    category: 'office_visit',
    cptCode: '99213',
    averageCost: 150,
    costRange: [100, 250],
  },
  'specialist_visit': {
    name: 'Specialist Visit',
    category: 'specialist_visit',
    cptCode: '99214',
    averageCost: 300,
    costRange: [200, 450],
  },
  
  // Diagnostic Tests
  'blood_test_basic': {
    name: 'Basic Metabolic Panel',
    category: 'diagnostic_lab',
    cptCode: '80047',
    averageCost: 75,
    costRange: [50, 150],
  },
  'blood_test_comprehensive': {
    name: 'Comprehensive Metabolic Panel',
    category: 'diagnostic_lab',
    cptCode: '80053',
    averageCost: 125,
    costRange: [75, 200],
  },
  'hba1c_test': {
    name: 'Hemoglobin A1C Test',
    category: 'diagnostic_lab',
    cptCode: '83036',
    averageCost: 60,
    costRange: [40, 100],
  },
  'lipid_panel': {
    name: 'Lipid Panel',
    category: 'diagnostic_lab',
    cptCode: '80061',
    averageCost: 85,
    costRange: [50, 150],
  },
  'chest_xray': {
    name: 'Chest X-Ray',
    category: 'diagnostic_imaging',
    cptCode: '71045',
    averageCost: 250,
    costRange: [150, 400],
  },
  'ct_scan': {
    name: 'CT Scan',
    category: 'diagnostic_imaging',
    cptCode: '74160',
    averageCost: 1500,
    costRange: [800, 3000],
  },
  'mri': {
    name: 'MRI',
    category: 'diagnostic_imaging',
    cptCode: '70553',
    averageCost: 2500,
    costRange: [1500, 4000],
  },
  
  // Emergency Services
  'emergency_room_visit': {
    name: 'Emergency Room Visit',
    category: 'emergency_room',
    cptCode: '99284',
    averageCost: 2000,
    costRange: [1000, 4000],
  },
  'urgent_care_visit': {
    name: 'Urgent Care Visit',
    category: 'urgent_care',
    cptCode: '99213',
    averageCost: 175,
    costRange: [100, 300],
  },
  
  // Common Procedures
  'colonoscopy': {
    name: 'Colonoscopy',
    category: 'procedure_minor',
    cptCode: '45378',
    averageCost: 3000,
    costRange: [2000, 5000],
  },
  'mammogram': {
    name: 'Mammogram',
    category: 'diagnostic_imaging',
    cptCode: '77067',
    averageCost: 300,
    costRange: [200, 500],
  },
  
  // Maternity
  'prenatal_visit': {
    name: 'Prenatal Visit',
    category: 'maternity_care',
    cptCode: '59400',
    averageCost: 200,
    costRange: [150, 300],
  },
  'delivery_vaginal': {
    name: 'Vaginal Delivery',
    category: 'maternity_care',
    cptCode: '59400',
    averageCost: 12000,
    costRange: [8000, 18000],
  },
  'delivery_cesarean': {
    name: 'Cesarean Delivery',
    category: 'maternity_care',
    cptCode: '59510',
    averageCost: 18000,
    costRange: [12000, 25000],
  },
}

// Regional cost multipliers by state
export const regionalMultipliers: Record<string, number> = {
  'AL': 0.85, 'AK': 1.35, 'AZ': 0.95, 'AR': 0.85, 'CA': 1.25,
  'CO': 1.05, 'CT': 1.15, 'DE': 1.00, 'FL': 0.95, 'GA': 0.90,
  'HI': 1.30, 'ID': 0.90, 'IL': 1.05, 'IN': 0.90, 'IA': 0.85,
  'KS': 0.85, 'KY': 0.85, 'LA': 0.90, 'ME': 0.95, 'MD': 1.10,
  'MA': 1.20, 'MI': 0.95, 'MN': 1.00, 'MS': 0.80, 'MO': 0.85,
  'MT': 0.90, 'NE': 0.85, 'NV': 1.00, 'NH': 1.05, 'NJ': 1.15,
  'NM': 0.90, 'NY': 1.25, 'NC': 0.90, 'ND': 0.90, 'OH': 0.90,
  'OK': 0.85, 'OR': 1.00, 'PA': 1.00, 'RI': 1.10, 'SC': 0.90,
  'SD': 0.85, 'TN': 0.85, 'TX': 0.95, 'UT': 0.95, 'VT': 1.00,
  'VA': 0.95, 'WA': 1.10, 'WV': 0.85, 'WI': 0.95, 'WY': 0.95,
  'DC': 1.20
}

export interface CostSearchQuery {
  treatment: string
  location?: {
    zipCode?: string
    state?: string
    city?: string
  }
  year?: number
  providerType?: 'hospital' | 'clinic' | 'specialist'
  urgency?: 'emergency' | 'urgent' | 'routine'
}

export interface CostSearchResult {
  cost: TreatmentCost
  sources: string[]
  searchDate: Date
  cacheExpiry: Date
}

// Service class for retrieving treatment costs
export class TreatmentCostService {
  private cache: Map<string, CostSearchResult> = new Map()
  private cacheExpiry = 7 * 24 * 60 * 60 * 1000 // 7 days
  
  constructor(private webSearchEnabled: boolean = true) {}
  
  async getTreatmentCost(
    query: CostSearchQuery
  ): Promise<TreatmentCost> {
    const cacheKey = this.getCacheKey(query)
    const cached = this.cache.get(cacheKey)
    
    if (cached && cached.cacheExpiry > new Date()) {
      return cached.cost
    }
    
    // If web search is enabled, try to get real costs
    if (this.webSearchEnabled) {
      try {
        const webResult = await this.searchWebForCost(query)
        if (webResult) {
          this.cache.set(cacheKey, {
            cost: webResult,
            sources: ['web_search'],
            searchDate: new Date(),
            cacheExpiry: new Date(Date.now() + this.cacheExpiry)
          })
          return webResult
        }
      } catch (error) {
        console.error('Web search failed:', error)
      }
    }
    
    // Fallback to database estimate
    return this.estimateCost(query)
  }
  
  private async searchWebForCost(
    query: CostSearchQuery
  ): Promise<TreatmentCost | null> {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/search-treatment-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treatment: query.treatment,
          location: query.location || { state: 'US' },
          year: query.year,
          providerType: query.providerType,
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        console.error('Web search failed with status:', response.status)
        return null
      }
      
      const data = await response.json()
      
      if (data.success && data.result) {
        const { result, location } = data
        const state = query.location?.state || 'US'
        
        return {
          treatmentId: `web_${query.treatment}_${state}_${Date.now()}`,
          name: query.treatment,
          category: this.categorizeService(query.treatment),
          averageCost: result.averageCost,
          costRange: result.costRange,
          regionalMultiplier: regionalMultipliers[state] || 1.0,
          lastUpdated: new Date(),
          dataSource: 'webSearch',
          confidence: result.confidence,
          details: result.details,
        }
      }
      
      return null
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('Web search timed out')
      } else {
        console.error('Web search error:', error)
      }
      return null
    }
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
    
    return 'office_visit' // default
  }
  
  private estimateCost(query: CostSearchQuery): TreatmentCost {
    // Find matching treatment in common costs
    const baseKey = this.findMatchingTreatment(query.treatment)
    const baseCost = commonTreatmentCosts[baseKey] || {
      name: query.treatment,
      category: 'office_visit' as TreatmentCategory,
      averageCost: 200,
      costRange: [100, 400] as [number, number],
    }
    
    // Apply regional multiplier
    const state = query.location?.state || 'US'
    const multiplier = regionalMultipliers[state] || 1.0
    
    // Adjust for urgency
    let urgencyMultiplier = 1.0
    if (query.urgency === 'emergency') urgencyMultiplier = 2.5
    else if (query.urgency === 'urgent') urgencyMultiplier = 1.3
    
    const adjustedCost = (baseCost.averageCost || 200) * multiplier * urgencyMultiplier
    const adjustedRange: [number, number] = [
      Math.round((baseCost.costRange?.[0] || 100) * multiplier * urgencyMultiplier),
      Math.round((baseCost.costRange?.[1] || 400) * multiplier * urgencyMultiplier)
    ]
    
    return {
      treatmentId: `${baseKey}_${state}_${Date.now()}`,
      name: baseCost.name || query.treatment,
      category: baseCost.category || 'office_visit',
      cptCode: baseCost.cptCode,
      averageCost: Math.round(adjustedCost),
      costRange: adjustedRange,
      regionalMultiplier: multiplier,
      lastUpdated: new Date(),
      dataSource: 'estimate',
      confidence: 'medium',
    }
  }
  
  private findMatchingTreatment(treatment: string): string {
    const normalized = treatment.toLowerCase()
    
    // Direct match
    if (commonTreatmentCosts[normalized]) {
      return normalized
    }
    
    // Partial match
    for (const key in commonTreatmentCosts) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return key
      }
    }
    
    // Category matching
    if (normalized.includes('primary') || normalized.includes('pcp')) {
      return 'primary_care_visit'
    }
    if (normalized.includes('specialist') || normalized.includes('specialty')) {
      return 'specialist_visit'
    }
    if (normalized.includes('emergency') || normalized.includes('er')) {
      return 'emergency_room_visit'
    }
    if (normalized.includes('blood') || normalized.includes('lab')) {
      return 'blood_test_basic'
    }
    
    return 'primary_care_visit' // default
  }
  
  private getCacheKey(query: CostSearchQuery): string {
    return `${query.treatment}_${query.location?.state || 'US'}_${query.urgency || 'routine'}`
  }
  
  // Get cost estimates for a full treatment plan
  async getTreatmentPlanCosts(
    treatments: Array<{
      name: string
      frequency: number
      urgency?: 'emergency' | 'urgent' | 'routine'
    }>,
    location?: { zipCode?: string; state?: string }
  ): Promise<Array<{ treatment: string; frequency: number; unitCost: number; annualCost: number; confidence: ConfidenceLevel }>> {
    // Process treatments in parallel with a limit to avoid overwhelming the API
    const BATCH_SIZE = 5
    const results = []
    
    for (let i = 0; i < treatments.length; i += BATCH_SIZE) {
      const batch = treatments.slice(i, i + BATCH_SIZE)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (treatment) => {
        try {
          const cost = await this.getTreatmentCost({
            treatment: treatment.name,
            location,
            urgency: treatment.urgency,
            year: new Date().getFullYear()
          })
          
          // Cap frequency to reasonable limits
          const cappedFrequency = Math.min(treatment.frequency, 365)
          const unitCost = Math.min(cost.averageCost, 50000) // Cap unit cost at $50k
          const annualCost = Math.min(unitCost * cappedFrequency, 200000) // Cap annual cost per treatment at $200k
          
          return {
            treatment: treatment.name,
            frequency: cappedFrequency,
            unitCost: unitCost,
            annualCost: annualCost,
            confidence: cost.confidence
          }
        } catch (error) {
          console.error(`Failed to get cost for ${treatment.name}:`, error)
          // Return fallback estimate on error
          const fallbackCost = this.estimateCost({
            treatment: treatment.name,
            location,
            urgency: treatment.urgency,
            year: new Date().getFullYear()
          })
          
          // Cap frequency to reasonable limits
          const cappedFrequency = Math.min(treatment.frequency, 365)
          const unitCost = Math.min(fallbackCost.averageCost, 50000) // Cap unit cost at $50k
          const annualCost = Math.min(unitCost * cappedFrequency, 200000) // Cap annual cost per treatment at $200k
          
          return {
            treatment: treatment.name,
            frequency: cappedFrequency,
            unitCost: unitCost,
            annualCost: annualCost,
            confidence: 'low' as ConfidenceLevel
          }
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }
}