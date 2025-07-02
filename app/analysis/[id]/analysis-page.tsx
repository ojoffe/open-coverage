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
  
  const { getAnalysis } = useAnalysisStore()

  useEffect(() => {
    const loadAnalysis = () => {
      if (!analysisId) {
        setError("No analysis ID provided")
        setIsLoading(false)
        return
      }

      try {
        // Load from localStorage via the store
        const savedAnalysis = getAnalysis(analysisId)
        if (savedAnalysis) {
          setAnalysisResults(savedAnalysis.results)
          setAnalysisName(savedAnalysis.name)
          setIsLoading(false)
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
  }, [analysisId, getAnalysis])

  if (isLoading) {
    return (
      <SidebarInset>
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1 min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Loading...</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
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
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-2 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1 min-w-0">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:block">
                  <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbPage>Error</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-red-600">{error || "Analysis not found"}</p>
            <Button onClick={() => router.push("/analyze-compare")} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back to Analyze & Compare</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </SidebarInset>
    )
  }

  // Truncate name for mobile
  const displayName = analysisName.length > 20 
    ? `${analysisName.substring(0, 20)}...` 
    : analysisName || "Analysis"

  return (
    <SidebarInset>
      <header className="sticky top-0 z-10 flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex-1 min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="/analyze-compare">Analyze & Compare</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate max-w-[150px] sm:max-w-none">
                  {displayName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/analyze-compare")}
            className="hidden sm:flex"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push("/analyze-compare")}
            className="sm:hidden h-8 w-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link href="/health-profile">
              <User className="w-4 h-4 mr-2" />
              Health Profile
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="sm:hidden h-8 w-8 p-0">
            <Link href="/health-profile">
              <User className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </header>

      <PolicyComparison results={analysisResults} />
    </SidebarInset>
  )
}