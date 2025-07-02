import { NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateObject } from "ai"
import { z } from "zod"

// Define the suggestion schema
const suggestionSchema = z.object({
  value: z.string().describe("Unique identifier for the suggestion"),
  label: z.string().describe("Human-readable display name"),
  category: z.string().describe("Category or classification of the suggestion"),
  details: z.string().optional().describe("Additional details, description, or context")
})

// Schema for the complete response
const healthSuggestionsResponseSchema = z.object({
  suggestions: z.array(suggestionSchema).max(10).describe("Array of health suggestions relevant to the search query")
})

export type HealthSuggestion = z.infer<typeof suggestionSchema>
export type HealthSuggestionsResponse = z.infer<typeof healthSuggestionsResponseSchema>

export async function POST(req: Request) {
  try {
    const { query, type, existingValues = [] } = await req.json()

    if (!query || !type) {
      return NextResponse.json({ suggestions: [] })
    }

    // Build context for AI based on search type
    const typePrompts = {
      conditions: {
        system: "You are a medical assistant helping users find relevant medical conditions. Provide accurate, commonly recognized medical conditions that match the search query.",
        context: `Search query: "${query}"
Type: Medical conditions
Exclude already selected: ${existingValues.join(", ")}

Guidelines:
- Focus on common, well-recognized medical conditions
- Use proper medical terminology
- Include ICD-10 codes in details when applicable
- Categorize by body system or condition type
- Prioritize conditions most likely to match the search intent`
      },
      
      medications: {
        system: "You are a pharmacist assistant helping users find relevant medications. Provide accurate medication names (both brand and generic) that match the search query.",
        context: `Search query: "${query}"
Type: Medications
Exclude already selected: ${existingValues.join(", ")}

Guidelines:
- Include both brand names and generic names when relevant
- Categorize by drug class or therapeutic use
- Include generic name and drug class in details
- Note if medication is specialty or high-cost
- Focus on commonly prescribed medications`
      },
      
      allergies: {
        system: "You are a medical assistant helping users identify potential allergens. Provide accurate allergen names that match the search query.",
        context: `Search query: "${query}"
Type: Allergies/Allergens
Exclude already selected: ${existingValues.join(", ")}

Guidelines:
- Include medications, foods, environmental allergens, and other substances
- Categorize by allergen type (medication, food, environmental, etc.)
- Include common reaction types or severity in details
- Focus on clinically relevant allergens
- Use standard allergen terminology`
      },
      
      services: {
        system: "You are a healthcare administrator helping users find relevant medical services. Provide accurate medical service names that match the search query.",
        context: `Search query: "${query}"
Type: Medical services
Exclude already selected: ${existingValues.join(", ")}

Guidelines:
- Focus on services typically covered by health insurance
- Use terminology consistent with insurance benefit categories
- Categorize by service type (primary care, specialty, diagnostic, etc.)
- Include brief descriptions of what the service involves
- Consider both inpatient and outpatient services`
      }
    }

    const promptConfig = typePrompts[type as keyof typeof typePrompts]
    if (!promptConfig) {
      return NextResponse.json({ suggestions: [] })
    }

    const result = await generateObject({
      model: groq("llama-3.3-70b-versatile"),
      schema: healthSuggestionsResponseSchema,
      system: promptConfig.system,
      prompt: promptConfig.context,
      temperature: 0.3,
    })

    return NextResponse.json(result.object)
  } catch (error) {
    console.error("Health suggestions API error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}

export const runtime = "edge"