import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const runtime = 'edge'

interface TreatmentCostSearchRequest {
  treatment: string
  location: {
    city?: string
    state: string
    zipCode?: string
  }
  year?: number
  providerType?: 'hospital' | 'clinic' | 'specialist'
}

interface SearchResult {
  averageCost: number
  costRange: [number, number]
  confidence: 'high' | 'medium' | 'low'
  sources: string[]
  details?: {
    facilityFee?: number
    physicianFee?: number
    notes?: string
  }
}

const SEARCH_PROMPT_TEMPLATE = `You are a medical cost research assistant. Search for the current average cost of the following medical treatment/service:

Treatment: {treatment}
Location: {location}
Year: {year}
Provider Type: {providerType}

Please search for and provide:
1. The average cost for this treatment in the specified location
2. The typical cost range (low to high)
3. Any breakdown of costs (facility fees, physician fees, etc.)
4. Confidence level in the data (high/medium/low)
5. Sources of the information

Important guidelines:
- Focus on costs for UNINSURED patients (cash prices)
- If location-specific data isn't available, use state or national averages
- Consider the provider type when estimating costs
- For procedures, include all associated fees
- Be realistic about confidence levels

Return the information in a structured format.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TreatmentCostSearchRequest
    
    if (!body.treatment || !body.location?.state) {
      return NextResponse.json(
        { error: 'Treatment and location.state are required' },
        { status: 400 }
      )
    }
    
    // Construct location string
    const locationStr = [
      body.location.city,
      body.location.state,
      body.location.zipCode
    ].filter(Boolean).join(', ')
    
    // Skip AI search and go directly to fallback estimation
    // This avoids making expensive AI calls that may fail or timeout
    const fallbackResult = estimateCost(body.treatment, body.location.state)
    
    return NextResponse.json({
      success: true,
      treatment: body.treatment,
      location: locationStr,
      result: fallbackResult,
      searchDate: new Date().toISOString(),
      note: 'Using estimated costs based on typical medical pricing'
    })
  } catch (error) {
    console.error('Search treatment cost error:', error)
    
    // Return a safe fallback response even on error
    return NextResponse.json({
      success: true,
      treatment: request.nextUrl.searchParams.get('treatment') || 'Unknown',
      location: 'US',
      result: {
        averageCost: 200,
        costRange: [100, 400] as [number, number],
        confidence: 'low' as const,
        sources: ['Fallback estimate'],
        details: {}
      },
      searchDate: new Date().toISOString(),
      note: 'Using default fallback costs'
    })
  }
}

function parseAIResponse(text: string, treatment: string): SearchResult {
  // Default values
  let averageCost = 0
  let costRange: [number, number] = [0, 0]
  let confidence: 'high' | 'medium' | 'low' = 'low'
  const sources: string[] = []
  const details: any = {}
  
  try {
    // Extract average cost
    const avgMatch = text.match(/average\s*(?:cost|price)[\s:]*\$?([\d,]+)/i)
    if (avgMatch) {
      averageCost = parseInt(avgMatch[1].replace(/,/g, ''))
    }
    
    // Extract cost range
    const rangeMatch = text.match(/(?:range|between)[\s:]*\$?([\d,]+)\s*(?:to|-)\s*\$?([\d,]+)/i)
    if (rangeMatch) {
      costRange = [
        parseInt(rangeMatch[1].replace(/,/g, '')),
        parseInt(rangeMatch[2].replace(/,/g, ''))
      ]
    } else if (averageCost > 0) {
      // Estimate range if not found
      costRange = [
        Math.round(averageCost * 0.7),
        Math.round(averageCost * 1.3)
      ]
    }
    
    // Extract confidence
    if (text.match(/high\s*confidence|very\s*reliable|accurate\s*data/i)) {
      confidence = 'high'
    } else if (text.match(/medium\s*confidence|somewhat\s*reliable|approximate/i)) {
      confidence = 'medium'
    }
    
    // Extract facility fee if mentioned
    const facilityMatch = text.match(/facility\s*fee[\s:]*\$?([\d,]+)/i)
    if (facilityMatch) {
      details.facilityFee = parseInt(facilityMatch[1].replace(/,/g, ''))
    }
    
    // Extract physician fee if mentioned
    const physicianMatch = text.match(/physician\s*fee[\s:]*\$?([\d,]+)/i)
    if (physicianMatch) {
      details.physicianFee = parseInt(physicianMatch[1].replace(/,/g, ''))
    }
    
    // Extract sources
    const sourceMatches = text.match(/(?:source|according to|data from)[\s:]*([^.]+)/gi)
    if (sourceMatches) {
      sourceMatches.forEach(match => {
        const source = match.replace(/(?:source|according to|data from)[\s:]*/i, '').trim()
        if (source) sources.push(source)
      })
    }
    
    // If no average cost found, try to extract any dollar amount
    if (averageCost === 0) {
      const anyPriceMatch = text.match(/\$?([\d,]+)(?:\s*dollars)?/i)
      if (anyPriceMatch) {
        averageCost = parseInt(anyPriceMatch[1].replace(/,/g, ''))
        costRange = [
          Math.round(averageCost * 0.7),
          Math.round(averageCost * 1.3)
        ]
      }
    }
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError)
  }
  
  // Fallback if parsing failed
  if (averageCost === 0) {
    const fallback = estimateCostSimple(treatment)
    averageCost = fallback.averageCost
    costRange = fallback.costRange
    confidence = 'low'
  }
  
  return {
    averageCost,
    costRange,
    confidence,
    sources: sources.length > 0 ? sources : ['Estimated based on typical medical costs'],
    details: Object.keys(details).length > 0 ? details : undefined
  }
}

function estimateCost(treatment: string, state: string): SearchResult {
  const baseEstimate = estimateCostSimple(treatment)
  
  // Apply state multiplier
  const stateMultipliers: Record<string, number> = {
    'CA': 1.25, 'NY': 1.25, 'MA': 1.20, 'CT': 1.15, 'NJ': 1.15,
    'TX': 0.95, 'FL': 0.95, 'GA': 0.90, 'NC': 0.90, 'OH': 0.90,
    'MS': 0.80, 'AL': 0.85, 'KY': 0.85, 'WV': 0.85, 'AR': 0.85
  }
  
  const multiplier = stateMultipliers[state] || 1.0
  
  return {
    averageCost: Math.round(baseEstimate.averageCost * multiplier),
    costRange: [
      Math.round(baseEstimate.costRange[0] * multiplier),
      Math.round(baseEstimate.costRange[1] * multiplier)
    ] as [number, number],
    confidence: 'low',
    sources: ['Estimated based on national averages and regional cost variations'],
    details: {
      notes: `Costs adjusted for ${state} regional pricing`
    }
  }
}

function estimateCostSimple(treatment: string): { averageCost: number; costRange: [number, number] } {
  const normalized = treatment.toLowerCase()
  
  // Common treatments and their typical costs
  const estimates: Record<string, { avg: number; range: [number, number] }> = {
    'primary care': { avg: 150, range: [100, 250] },
    'specialist': { avg: 300, range: [200, 450] },
    'emergency': { avg: 2000, range: [1000, 4000] },
    'urgent care': { avg: 175, range: [100, 300] },
    'blood test': { avg: 100, range: [50, 200] },
    'x-ray': { avg: 250, range: [150, 400] },
    'mri': { avg: 2500, range: [1500, 4000] },
    'ct scan': { avg: 1500, range: [800, 3000] },
    'ultrasound': { avg: 400, range: [200, 700] },
    'mammogram': { avg: 300, range: [200, 500] },
    'colonoscopy': { avg: 3000, range: [2000, 5000] },
    'physical therapy': { avg: 150, range: [75, 250] },
    'psychiatrist': { avg: 300, range: [200, 400] },
    'therapy session': { avg: 150, range: [100, 250] },
    'prenatal': { avg: 200, range: [150, 300] },
    'delivery': { avg: 15000, range: [10000, 20000] },
    'surgery': { avg: 20000, range: [10000, 40000] }
  }
  
  // Find best match
  for (const [key, value] of Object.entries(estimates)) {
    if (normalized.includes(key)) {
      return { averageCost: value.avg, costRange: value.range }
    }
  }
  
  // Default estimate
  return { averageCost: 200, costRange: [100, 400] }
}