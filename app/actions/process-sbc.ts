"use server"

import { generateObjectWithAIRetry } from "@/lib/ai-retry"
import { sbcSchema, type ProcessingResult, type ProcessSBCResponse } from "@/lib/sbc-schema"
import { google } from "@ai-sdk/google"
import { put } from '@vercel/blob'
import { kv } from '@vercel/kv'

const GEMINI_MODEL = google("gemini-2.0-flash-exp")

export async function processSingleSBC(file: File): Promise<ProcessingResult> {
  try {
    // Upload PDF to Vercel Blob storage
    const blob = await put(file.name, file, {
      access: 'public',
      addRandomSuffix: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    
    // Convert file to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Use AI SDK to extract structured data directly from PDF
    const result = await generateObjectWithAIRetry({
      model: GEMINI_MODEL,
      schema: sbcSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at parsing Summary of Benefits and Coverage (SBC) documents for health insurance plans.
        
Please extract the following information from this SBC document and structure it according to the provided schema:

1. Plan Summary Information:
   - Plan name
   - Coverage period (start and end dates)
   - Coverage type (individual, family, or individual_and_family)
   - Plan type (HMO, PPO, EPO, POS, etc.)
   - Issuer name and contact information

2. Important Questions Section:
   - Overall deductible amounts (individual and family)
   - Services covered before deductible
   - Specific service deductibles
   - Out-of-pocket limits
   - Services not included in out-of-pocket limit
   - Network provider information
   - Referral requirements

3. Services You May Need:
   - Extract all services from the coverage table
   - Include what you pay for network and out-of-network providers
   - Include limitations, exceptions, and other important information

Important parsing guidelines:
- Convert dollar amounts to numbers (remove $ and commas)
- For "Not applicable" or "N/A" values, use 0 for numbers
- Be precise with service names and match them to common medical event types when possible
- Include all details from the limitations/exceptions column
- If information is unclear or missing, make reasonable inferences based on typical SBC structure`
            },
            {
              type: "file",
              data: base64,
              mimeType: "application/pdf"
            }
          ]
        }
      ]
    })

    console.log("Result", result)

    return {
      success: true,
      fileName: file.name,
      data: result,
      pdfUrl: blob.url,
    }
  } catch (error) {
    console.error(`Error processing ${file.name}:`, error)

    return {
      success: false,
      fileName: file.name,
      error: error instanceof Error ? error.message : "Unknown processing error",
    }
  }
}

export async function processSBCDocuments(formData: FormData): Promise<ProcessSBCResponse> {
  console.log("Processing SBC documents form data", formData)
  
  // Debug logging to understand FormData structure
  for (const [key, value] of formData.entries()) {
    console.log(`FormData entry - Key: "${key}", Value type: ${typeof value}, Is File: ${value instanceof File}`)
    if (value instanceof File) {
      console.log(`  File details - Name: "${value.name}", Size: ${value.size}, Type: "${value.type}"`)
    }
  }
  
  try {
    // Extract files from FormData
    const files: File[] = []
    
    // Handle multiple FormData formats - extract all File instances
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Avoid duplicates by checking name and size
        if (!files.some(f => f.name === value.name && f.size === value.size)) {
          files.push(value)
        }
      }
    }
    
    console.log(`Extracted ${files.length} files:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })))

    if (files.length === 0) {
      throw new Error("No files provided for processing")
    }

    if (files.length > 8) {
      throw new Error("Maximum 8 files allowed for processing")
    }

    // Validate file types
    const invalidFiles = files.filter((file) => file.type !== "application/pdf")
    if (invalidFiles.length > 0) {
      throw new Error(
        `Invalid file types detected: ${invalidFiles.map((f) => f.name).join(", ")}. Only PDF files are allowed.`,
      )
    }

    // Process files in parallel with controlled concurrency
    const BATCH_SIZE = 3 // Process 3 files at a time to avoid overwhelming the API
    const results: ProcessingResult[] = []

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      const batchPromises = batch.map((file) => processSingleSBC(file))
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    // Calculate summary statistics
    const successCount = results.filter((r) => r.success).length
    const errorCount = results.filter((r) => !r.success).length

    const response: ProcessSBCResponse = {
      results,
      successCount,
      errorCount,
    }

    // Auto-save to Redis KV if there are successful results
    if (successCount > 0) {
      try {
        // Generate UUID for the analysis
        const id = crypto.randomUUID()
        
        // Extract policy names for display
        const policyNames = results
          .filter(r => r.success && r.data)
          .map(r => r.data!.plan_summary.plan_name || 'Unnamed Policy')
        
        // Create analysis object
        const analysis = {
          id,
          name: `Analysis ${id}`,
          createdAt: new Date().toISOString(),
          results: response,
          policyNames
        }
        
        // Store in KV
        await kv.set(`analysis:${id}`, analysis)
        
        // Store in index for quick lookup
        const metadata = {
          id,
          name: analysis.name,
          createdAt: analysis.createdAt,
          policyCount: policyNames.length,
          policyNames: policyNames.slice(0, 3)
        }
        
        await kv.lpush('analyses:index', metadata)
        
        console.log(`Analysis auto-saved with ID: ${id}`)
        
        // Add the ID to the response so frontend can access it
        response.analysisId = id
      } catch (error) {
        console.error('Failed to auto-save analysis to KV:', error)
        // Continue without throwing - don't fail the main process
      }
    }

    return response
  } catch (error) {
    console.error("Error in processSBCDocuments:", error)

    // Return error response
    return {
      results: [
        {
          success: false,
          fileName: "System Error",
          error: error instanceof Error ? error.message : "Unknown system error",
        },
      ],
      successCount: 0,
      errorCount: 1,
    }
  }
}
