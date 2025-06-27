"use server"

import { generateObject } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { generateObjectWithAIRetry } from "@/lib/ai-retry"

const costEstimateSchema = z.object({
  averageCost: z.number().describe("Average cost in USD"),
  lowCost: z.number().describe("Low end of cost range in USD"),
  highCost: z.number().describe("High end of cost range in USD"),
  source: z.string().describe("Brief description of data source"),
  notes: z.string().optional().describe("Additional context about the cost")
})

export type CostEstimate = z.infer<typeof costEstimateSchema>

export async function getMedicalCostEstimate(
  serviceType: string,
  description: string,
  networkType: 'in-network' | 'out-of-network' = 'in-network',
  location: string = 'United States'
): Promise<CostEstimate> {
  try {
    const resultObject = await generateObjectWithAIRetry({
      model: anthropic('claude-3-5-sonnet-20240620'),
      schema: costEstimateSchema,
      messages: [
        {
          role: "system",
          content: `You are a healthcare cost research specialist. Your job is to provide accurate, current cost estimates for medical services in the United States.

Guidelines:
- Use recent data from reliable sources (government databases, insurance company data, medical cost websites)
- Consider ${networkType} pricing specifically
- Account for geographical variations within ${location}
- Provide realistic ranges that reflect actual patient costs
- Include relevant context about cost factors

Be conservative and realistic in your estimates. Avoid outliers unless they represent typical costs.`
        },
        {
          role: "user", 
          content: `Find the current average cost for: ${serviceType} - ${description}

Please research and provide:
1. The average cost patients typically pay
2. The low-end cost range
3. The high-end cost range
4. Brief source description
5. Any relevant notes about cost factors

Consider ${networkType} pricing in ${location}. Focus on what patients actually pay out of pocket, considering typical insurance arrangements.`
        }
      ]
    })

    // Check if resultObject exists and has required properties
    if (!resultObject || typeof resultObject.averageCost !== 'number') {
      console.warn('AI response missing required cost data, using fallback')
      const fallbackCosts = getFallbackCosts(serviceType, networkType)
      return {
        averageCost: fallbackCosts.average,
        lowCost: fallbackCosts.low,
        highCost: fallbackCosts.high,
        source: "Fallback estimates - AI response incomplete",
        notes: "Using conservative fallback estimates due to incomplete AI response"
      }
    }

    return {
      averageCost: Math.round(resultObject.averageCost),
      lowCost: Math.round(resultObject.lowCost || resultObject.averageCost * 0.7), 
      highCost: Math.round(resultObject.highCost || resultObject.averageCost * 1.5),
      source: resultObject.source || "AI estimate",
      notes: resultObject.notes
    }
  } catch (error) {
    console.error('Error getting medical cost estimate:', error)
    
    // Fallback estimates based on service type
    const fallbackCosts = getFallbackCosts(serviceType, networkType)
    
    return {
      averageCost: fallbackCosts.average,
      lowCost: fallbackCosts.low,
      highCost: fallbackCosts.high,
      source: "Fallback estimates - API unavailable",
      notes: "Using conservative fallback estimates"
    }
  }
}

function getFallbackCosts(serviceType: string, networkType: 'in-network' | 'out-of-network') {
  const multiplier = networkType === 'out-of-network' ? 2.5 : 1
  
  const baseCosts: Record<string, { average: number; low: number; high: number }> = {
    'primary care': { average: 200, low: 150, high: 300 },
    'specialist': { average: 350, low: 250, high: 500 },
    'urgent care': { average: 180, low: 120, high: 250 },
    'emergency': { average: 1500, low: 800, high: 3000 },
    'diagnostic': { average: 250, low: 100, high: 500 },
    'imaging': { average: 600, low: 300, high: 1200 },
    'generic': { average: 15, low: 5, high: 30 },
    'generic drugs': { average: 15, low: 5, high: 30 },
    'preferred': { average: 85, low: 40, high: 150 },
    'preferred brand drugs': { average: 85, low: 40, high: 150 },
    'brand': { average: 85, low: 40, high: 150 },
    'specialty': { average: 300, low: 150, high: 600 },
    'specialty drugs': { average: 300, low: 150, high: 600 },
    'physical therapy': { average: 120, low: 80, high: 180 },
    'mental health': { average: 150, low: 100, high: 250 }
  }
  
  // Find matching service type
  const serviceKey = Object.keys(baseCosts).find(key => 
    serviceType.toLowerCase().includes(key)
  ) || 'primary care'
  
  const costs = baseCosts[serviceKey]
  
  return {
    average: Math.round(costs.average * multiplier),
    low: Math.round(costs.low * multiplier),
    high: Math.round(costs.high * multiplier)
  }
}

// Batch function for getting multiple cost estimates efficiently
export async function getBatchMedicalCosts(
  requests: Array<{
    serviceType: string
    description: string
    networkType?: 'in-network' | 'out-of-network'
    location?: string
  }>
): Promise<CostEstimate[]> {
  // Process in smaller batches to avoid rate limits
  const BATCH_SIZE = 3
  const results: CostEstimate[] = []
  
  for (let i = 0; i < requests.length; i += BATCH_SIZE) {
    const batch = requests.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(request => 
      getMedicalCostEstimate(
        request.serviceType,
        request.description,
        request.networkType || 'in-network',
        request.location || 'United States'
      )
    )
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    // Small delay between batches to be respectful of API limits
    if (i + BATCH_SIZE < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  return results
}