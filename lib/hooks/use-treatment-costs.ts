import { useState, useCallback } from 'react'
import { TreatmentCost } from '@/lib/treatment-cost-service'

interface TreatmentCostResult {
  treatment: string
  frequency: number
  unitCost: number
  annualCost: number
  confidence: 'high' | 'medium' | 'low'
}

interface TreatmentCostSummary {
  totalAnnualCost: number
  averageConfidence: 'high' | 'medium' | 'low'
  location: string
  lastUpdated: string
}

interface UseTreatmentCostsReturn {
  costs: TreatmentCostResult[] | null
  summary: TreatmentCostSummary | null
  loading: boolean
  error: string | null
  fetchTreatmentCosts: (treatments: Array<{
    name: string
    frequency: number
    urgency?: 'emergency' | 'urgent' | 'routine'
  }>, location?: { state?: string; zipCode?: string }) => Promise<void>
  clearCosts: () => void
}

export function useTreatmentCosts(): UseTreatmentCostsReturn {
  const [costs, setCosts] = useState<TreatmentCostResult[] | null>(null)
  const [summary, setSummary] = useState<TreatmentCostSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const fetchTreatmentCosts = useCallback(async (
    treatments: Array<{
      name: string
      frequency: number
      urgency?: 'emergency' | 'urgent' | 'routine'
    }>,
    location?: { state?: string; zipCode?: string }
  ) => {
    // Don't fetch if no treatments
    if (!treatments || treatments.length === 0) {
      setCosts([])
      setSummary(null)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch('/api/treatment-costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          treatments,
          location
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error('Failed to fetch treatment costs')
      }
      
      const data = await response.json()
      setCosts(data.costs || [])
      setSummary(data.summary || null)
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.name === 'AbortError' 
          ? 'Request timed out. Using estimated costs.'
          : err.message
        : 'An error occurred'
      
      setError(errorMessage)
      
      // Provide fallback data on error
      if (treatments.length > 0) {
        const fallbackCosts = treatments.map(treatment => ({
          treatment: treatment.name,
          frequency: treatment.frequency,
          unitCost: 200, // Default fallback cost
          annualCost: 200 * treatment.frequency,
          confidence: 'low' as const
        }))
        
        const totalAnnualCost = fallbackCosts.reduce((sum, cost) => sum + cost.annualCost, 0)
        
        setCosts(fallbackCosts)
        setSummary({
          totalAnnualCost,
          averageConfidence: 'low',
          location: location?.state || 'National Average',
          lastUpdated: new Date().toISOString()
        })
      } else {
        setCosts(null)
        setSummary(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])
  
  const clearCosts = useCallback(() => {
    setCosts(null)
    setSummary(null)
    setError(null)
  }, [])
  
  return {
    costs,
    summary,
    loading,
    error,
    fetchTreatmentCosts,
    clearCosts
  }
}