import { kv } from '@vercel/kv'
import { NextRequest, NextResponse } from 'next/server'
import type { ProcessSBCResponse } from '@/lib/sbc-schema'

export interface StoredAnalysis {
  id: string
  name: string
  createdAt: string
  results: ProcessSBCResponse
  policyNames: string[]
}

// GET /api/analyses - Get all analyses for a user (using IP as identifier for now)
// GET /api/analyses?id=uuid - Get specific analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')
    
    if (analysisId) {
      // Get specific analysis
      const analysis = await kv.get<StoredAnalysis>(`analysis:${analysisId}`)
      if (!analysis) {
        return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
      }
      return NextResponse.json(analysis)
    } else {
      // Get all analyses metadata from index
      const analysisHistory = await kv.lrange('analyses:index', 0, -1)
      return NextResponse.json(analysisHistory || [])
    }
  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}

// POST /api/analyses - Store new analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, results } = body as { name: string; results: ProcessSBCResponse }
    
    // Generate UUID
    const id = crypto.randomUUID()
    
    // Extract policy names
    const policyNames = results.results
      .filter(r => r.success && r.data)
      .map(r => r.data!.plan_summary.plan_name)
    
    const analysis: StoredAnalysis = {
      id,
      name,
      createdAt: new Date().toISOString(),
      results,
      policyNames
    }
    
    // Store in KV
    await kv.set(`analysis:${id}`, analysis)
    
    // Store in index for quick lookup (store just metadata)
    const metadata = {
      id,
      name,
      createdAt: analysis.createdAt,
      policyCount: policyNames.length,
      policyNames: policyNames.slice(0, 3) // Store first 3 names for display
    }
    
    await kv.lpush('analyses:index', metadata)
    
    return NextResponse.json({ id, success: true })
  } catch (error) {
    console.error('Error storing analysis:', error)
    return NextResponse.json({ error: 'Failed to store analysis' }, { status: 500 })
  }
}

// DELETE /api/analyses?id=uuid - Delete analysis
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analysisId = searchParams.get('id')
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 })
    }
    
    // Delete from KV
    await kv.del(`analysis:${analysisId}`)
    
    // Remove from index (this is more complex, but for now we'll leave it)
    // In production, you might want to periodically clean the index
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting analysis:', error)
    return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 })
  }
}