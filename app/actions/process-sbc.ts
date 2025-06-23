"use server"

import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { sbcSchema, type ProcessingResult, type ProcessSBCResponse } from "@/lib/sbc-schema"
import { extractTextFromPDF } from "@/lib/pdf-utils"

const GEMINI_MODEL = google("gemini-2.0-flash-exp")

async function processSingleSBC(file: File): Promise<ProcessingResult> {
  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Extract text from PDF
    const pdfText = await extractTextFromPDF(buffer)

    if (!pdfText || pdfText.trim().length === 0) {
      return {
        success: false,
        fileName: file.name,
        error: "No text content found in PDF",
      }
    }

    // Use AI SDK to extract structured data
    const { object } = await generateObject({
      model: GEMINI_MODEL,
      schema: sbcSchema,
      prompt: `
        You are an expert at parsing Summary of Benefits and Coverage (SBC) documents for health insurance plans.
        
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
        - If information is unclear or missing, make reasonable inferences based on typical SBC structure

        Here is the SBC document text:

        ${pdfText}
      `,
    })

    return {
      success: true,
      fileName: file.name,
      data: object,
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
  try {
    // Extract files from FormData
    const files: File[] = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file-") && value instanceof File) {
        files.push(value)
      }
    }

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

    return {
      results,
      successCount,
      errorCount,
    }
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
