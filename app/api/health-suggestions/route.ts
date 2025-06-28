import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { query, type, existingValues = [] } = await req.json()

    if (!query || !type) {
      return NextResponse.json({ suggestions: [] })
    }

    const prompts = {
      conditions: `Given the search query "${query}" for medical conditions, suggest up to 10 relevant medical conditions that match or are related to this query. Focus on common conditions that people might have. Exclude conditions that are already selected: ${existingValues.join(", ")}. Return as JSON array with format: [{"value": "condition_name", "label": "Display Name", "category": "Category", "details": "Brief description or ICD code"}]`,
      
      medications: `Given the search query "${query}" for medications, suggest up to 10 relevant medications (brand names or generic names) that match or are related to this query. Focus on commonly prescribed medications. Exclude medications that are already selected: ${existingValues.join(", ")}. Return as JSON array with format: [{"value": "med_name", "label": "Display Name", "category": "Drug Class", "details": "Generic name, indication, or notes"}]`,
      
      allergies: `Given the search query "${query}" for allergies, suggest up to 10 relevant allergens that match or are related to this query. Include medications, foods, environmental allergens, etc. Exclude allergies that are already selected: ${existingValues.join(", ")}. Return as JSON array with format: [{"value": "allergen_name", "label": "Display Name", "category": "Type", "details": "Common reactions or notes"}]`,
      
      services: `Given the search query "${query}" for medical services, suggest up to 10 relevant medical services or procedures that match or are related to this query. Focus on services covered by health insurance. Exclude services that are already selected: ${existingValues.join(", ")}. Return as JSON array with format: [{"value": "service_name", "label": "Display Name", "category": "Service Type", "details": "Brief description"}]`
    }

    const prompt = prompts[type as keyof typeof prompts]
    if (!prompt) {
      return NextResponse.json({ suggestions: [] })
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
      temperature: 0.3,
      maxTokens: 1000,
    })

    // Parse the response
    try {
      const suggestions = JSON.parse(text)
      return NextResponse.json({ suggestions: Array.isArray(suggestions) ? suggestions : [] })
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return NextResponse.json({ suggestions: [] })
    }
  } catch (error) {
    console.error("Health suggestions API error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}

export const runtime = "edge"