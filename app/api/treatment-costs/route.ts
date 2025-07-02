import { NextRequest, NextResponse } from 'next/server'
import { TreatmentCostService, CostSearchQuery } from '@/lib/treatment-cost-service'

export const runtime = 'edge'

const costService = new TreatmentCostService(false) // Disable web search to use fallback estimates

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { treatments, location } = body as {
      treatments: Array<{
        name: string
        frequency: number
        urgency?: 'emergency' | 'urgent' | 'routine'
      }>
      location?: {
        zipCode?: string
        state?: string
        city?: string
      }
    }
    
    if (!treatments || !Array.isArray(treatments)) {
      return NextResponse.json(
        { error: 'Invalid request: treatments array required' },
        { status: 400 }
      )
    }
    
    // Get cost estimates for all treatments
    const costs = await costService.getTreatmentPlanCosts(treatments, location)
    
    // Calculate totals with reasonable caps
    const rawTotalCost = costs.reduce((sum, cost) => sum + cost.annualCost, 0)
    const totalAnnualCost = Math.min(rawTotalCost, 1000000) // Cap total at $1M
    
    if (rawTotalCost > 1000000) {
      console.warn(`Total cost exceeded cap: ${rawTotalCost} > 1000000`)
    }
    
    const averageConfidence = costs.reduce((sum, cost) => {
      const score = cost.confidence === 'high' ? 1 : cost.confidence === 'medium' ? 0.5 : 0.25
      return sum + score
    }, 0) / costs.length
    
    return NextResponse.json({
      costs,
      summary: {
        totalAnnualCost,
        averageConfidence: averageConfidence > 0.75 ? 'high' : averageConfidence > 0.5 ? 'medium' : 'low',
        location: location?.state || 'National Average',
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Treatment cost API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve treatment costs' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const treatment = searchParams.get('treatment')
    const state = searchParams.get('state')
    const urgency = searchParams.get('urgency') as 'emergency' | 'urgent' | 'routine' | null
    
    if (!treatment) {
      return NextResponse.json(
        { error: 'Treatment parameter required' },
        { status: 400 }
      )
    }
    
    const query: CostSearchQuery = {
      treatment,
      location: state ? { state } : undefined,
      urgency: urgency || 'routine',
      year: new Date().getFullYear()
    }
    
    const cost = await costService.getTreatmentCost(query)
    
    return NextResponse.json({
      cost,
      query
    })
  } catch (error) {
    console.error('Treatment cost API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve treatment cost' },
      { status: 500 }
    )
  }
}