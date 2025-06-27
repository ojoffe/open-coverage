"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Loader2 } from "lucide-react"
import Link from "next/link"
import PolicyComparison from "@/components/policy-comparison"
import { useAnalysisStore } from "@/lib/analysis-store"
import type { ProcessSBCResponse } from "@/lib/sbc-schema"

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string
  
  const [analysisResults, setAnalysisResults] = useState<ProcessSBCResponse | null>(null)
  const [analysisName, setAnalysisName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { getAnalysis, loadAnalysisFromKV } = useAnalysisStore()

  useEffect(() => {
    const loadAnalysis = async () => {
      if (!analysisId) {
        setError("No analysis ID provided")
        setIsLoading(false)
        return
      }

      try {
        // First check local storage
        const savedAnalysis = getAnalysis(analysisId)
        if (savedAnalysis) {
          setAnalysisResults(savedAnalysis.results)
          setAnalysisName(savedAnalysis.name)
          setIsLoading(false)
          return
        }

        // If not found locally, try loading from KV
        const analysis = await loadAnalysisFromKV(analysisId)
        if (analysis) {
          setAnalysisResults(analysis.results)
          setAnalysisName(analysis.name)
        } else {
          setError("Analysis not found")
        }
      } catch (err) {
        console.error("Failed to load analysis:", err)
        setError("Failed to load analysis")
      } finally {
        setIsLoading(false)
      }
    }

    loadAnalysis()
  }, [analysisId, getAnalysis, loadAnalysisFromKV])

  if (isLoading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Loading...</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" />
            <p className="text-gray-600">Loading analysis...</p>
          </div>
        </div>
      </SidebarInset>
    )
  }

  if (error || !analysisResults) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Error</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || "Analysis not found"}</p>
            <Button onClick={() => router.push("/analyze-compare")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyze & Compare
            </Button>
          </div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>{analysisName || "Analysis"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/analyze-compare")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/health-profile">
              <User className="w-4 h-4 mr-2" />
              Health Profile
            </Link>
          </Button>
        </div>
      </header>

      <PolicyComparison results={analysisResults} />
    </SidebarInset>
  )
}