import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

// DELETE /api/analyses/clear - Clear all analyses
export async function DELETE() {
  try {
    // Get all analysis IDs from the index
    const analysisHistory = await kv.lrange('analyses:index', 0, -1)
    
    // Delete all individual analysis records
    const deletePromises = []
    for (const metadata of analysisHistory) {
      if (typeof metadata === 'object' && metadata && 'id' in metadata) {
        deletePromises.push(kv.del(`analysis:${(metadata as any).id}`))
      }
    }
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises)
    
    // Clear the index
    await kv.del('analyses:index')
    
    return NextResponse.json({ success: true, deleted: analysisHistory.length })
  } catch (error) {
    console.error('Error clearing all analyses:', error)
    return NextResponse.json({ error: 'Failed to clear analyses' }, { status: 500 })
  }
}