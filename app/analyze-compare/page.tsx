"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { FileText, Plus, Loader2, CheckCircle, Heart, ArrowRight } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User } from "lucide-react"
import Link from "next/link"
import { processSBCDocuments } from "@/app/actions/process-sbc"
import type { ProcessSBCResponse } from "@/lib/sbc-schema"
import PolicyComparison from "@/components/policy-comparison"
import { useAnalysisStore } from "@/lib/analysis-store"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { useAnalysisHistoryStore } from "@/lib/analysis-history-store"

interface UploadedFile {
  name: string
  size: number
  type: string
  file: File
}

interface UploadBoxProps {
  id: string
  file: UploadedFile | null
  onFileSelect: (files: FileList) => void
  disabled?: boolean
}

function UploadBox({ id, file, onFileSelect, disabled = false }: UploadBoxProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (!disabled) {
      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        onFileSelect(droppedFiles)
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        onFileSelect(selectedFiles)
      }
    }
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-3 transition-all duration-200 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        isDragOver && !disabled
          ? "border-blue-400 bg-blue-50"
          : file
            ? "border-green-400 bg-green-50"
            : "border-gray-300 hover:border-gray-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id={id}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept=".pdf"
        multiple
        onChange={handleFileInput}
        disabled={disabled}
      />

      <div className="flex items-center space-x-3">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
            file ? "bg-green-100" : isDragOver && !disabled ? "bg-blue-100" : "bg-gray-100"
          }`}
        >
          {file ? (
            <FileText className="w-3 h-3 text-red-600" />
          ) : (
            <FileText className={`w-3 h-3 ${isDragOver && !disabled ? "text-blue-600" : "text-gray-400"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {file ? (
            <p className="text-sm text-gray-900 truncate">{file.name}</p>
          ) : (
            <p className="text-sm text-gray-900">Upload SBC Document</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface AddMoreBoxProps {
  onAddMore: () => void
  disabled?: boolean
}

function AddMoreBox({ onAddMore, disabled = false }: AddMoreBoxProps) {
  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-3 transition-colors ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-gray-400"
      }`}
      onClick={disabled ? undefined : onAddMore}
    >
      <div className="flex items-center space-x-3">
        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Plus className="w-3 h-3 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900">Add More</p>
        </div>
      </div>
    </div>
  )
}

interface LoadingScreenProps {
  progress: number
}

function LoadingScreen({ progress }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xs overflow-hidden rounded-lg bg-white p-8 text-center shadow-lg">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Analyzing Policies</h2>
        {/* <p className="mb-4 text-gray-600">Processing your SBC documents...</p> */}
        <p className="mb-4 text-sm text-gray-500">This typically takes around a minute</p>

        <div className="h-2 w-full overflow-hidden rounded bg-gray-200">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm text-gray-500">{Math.round(progress)}% complete</p>
      </div>
    </div>
  )
}

function AnalyzeCompareContent() {
  const [boxes, setBoxes] = useState<string[]>(["box-1", "box-2", "box-3", "box-4"])
  const [files, setFiles] = useState<Record<string, UploadedFile | null>>({
    "box-1": null,
    "box-2": null,
    "box-3": null,
    "box-4": null,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisResults, setAnalysisResults] = useState<ProcessSBCResponse | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const { saveAnalysis, getAnalysis } = useAnalysisStore()
  const { members } = useHealthProfileStore()
  const { addAnalysis } = useAnalysisHistoryStore()
  
  // Check if health profile is complete
  const hasHealthProfile = members.length > 0 && members[0].age && (
    members[0].conditions.length > 0 || 
    members[0].medications.length > 0 ||
    members[0].otherServices?.length > 0
  )

  const MAX_POLICIES = 8
  const uploadedFilesCount = Object.values(files).filter((file) => file !== null).length
  const canAddMore = boxes.length < MAX_POLICIES
  const canSubmit = uploadedFilesCount > 0

  // Load saved analysis if analysis ID is provided in URL
  useEffect(() => {
    const analysisId = searchParams.get('analysis')
    if (analysisId) {
      // Load from localStorage via the store
      const savedAnalysis = getAnalysis(analysisId)
      if (savedAnalysis) {
        setAnalysisResults(savedAnalysis.results)
        setCurrentAnalysisId(analysisId)
      }
    }
  }, [searchParams, getAnalysis])

  // Generate analysis name from successful results
  const generateAnalysisName = (results: ProcessSBCResponse): string => {
    const successfulResults = results.results.filter(r => r.success && r.data)
    if (successfulResults.length === 0) return 'Analysis'
    
    // Debug the data structure
    console.log('Successful results data structure:', successfulResults[0]?.data)
    
    // Try both planSummary and plan_summary
    const planNames = successfulResults.map(r => {
      const planName = r.data!.planSummary?.planName || 
                      r.data!.plan_summary?.plan_name || 
                      r.fileName.replace('.pdf', '')
      return planName
    }).slice(0, 2) // Take first 2 plan names
    
    if (planNames.length === 1) {
      return planNames[0]
    } else {
      return `${planNames.join(' vs ')}${successfulResults.length > 2 ? ` +${successfulResults.length - 2}` : ''}`
    }
  }

  const handleFileSelect = (boxId: string, fileList: FileList) => {
    const filesArray = Array.from(fileList).filter((file) => file.type === "application/pdf")

    if (filesArray.length === 0) return

    if (filesArray.length === 1) {
      setFiles((prev) => ({
        ...prev,
        [boxId]: {
          name: filesArray[0].name,
          size: filesArray[0].size,
          type: filesArray[0].type,
          file: filesArray[0],
        },
      }))
      return
    }

    const emptyBoxes = boxes.filter((id) => !files[id])
    const currentBoxEmpty = !files[boxId]
    const availableBoxes = currentBoxEmpty ? [boxId, ...emptyBoxes.filter((id) => id !== boxId)] : emptyBoxes
    const newFiles = { ...files }

    filesArray.forEach((file, index) => {
      if (index < availableBoxes.length) {
        newFiles[availableBoxes[index]] = {
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
        }
      }
    })

    setFiles(newFiles)
  }

  const handleAddMore = () => {
    if (canAddMore) {
      const newBoxId = `box-${boxes.length + 1}`
      setBoxes((prev) => [...prev, newBoxId])
      setFiles((prev) => ({
        ...prev,
        [newBoxId]: null,
      }))
    }
  }

  const handleSubmit = async () => {
    setIsAnalyzing(true)
    setProgress(0)

    try {
      // Create FormData with uploaded files
      const formData = new FormData()
      const uploadedFiles = Object.values(files).filter((file): file is UploadedFile => file !== null)

      uploadedFiles.forEach((fileData) => {
        formData.append('files', fileData.file)
      })

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev // Stop at 90% until we get results
          return prev + 2
        })
      }, 1000)

      // Process the files
      const results = await processSBCDocuments(formData)

      // Complete progress
      clearInterval(progressInterval)
      setProgress(100)

      // Show results after a brief delay
      setTimeout(async () => {
        setIsAnalyzing(false)
        setProgress(0)
        setAnalysisResults(results)
        
        // Save analysis automatically if there are successful results
        if (results.successCount > 0) {
          const analysisName = generateAnalysisName(results)
          const analysisId = saveAnalysis(analysisName, results)
          setCurrentAnalysisId(analysisId)
          
          // Save to analysis history
          const successfulPolicies = results.results.filter(r => r.success && r.data)
          const totalCost = successfulPolicies.reduce((sum, r) => {
            if (!r.data) return sum
            // Try both costBreakdown and cost_breakdown
            const monthlyPremium = r.data.costBreakdown?.monthlyPremium || 
                                  r.data.cost_breakdown?.monthly_premium || 
                                  0
            const premium = monthlyPremium * 12
            return sum + premium
          }, 0)
          
          const historyEntry = {
            id: analysisId,
            name: analysisName,
            date: new Date().toISOString(),
            policyNames: successfulPolicies.map(r => {
              const planName = r.data!.planSummary?.planName || 
                              r.data!.plan_summary?.plan_name || 
                              r.fileName
              return planName
            }),
            familySize: members.length,
            totalAnnualCost: totalCost,
            analysisData: results
          }
          
          console.log('Saving analysis to history:', historyEntry)
          addAnalysis(historyEntry)
          
          // Debug check after saving
          setTimeout(() => {
            console.log('LocalStorage after save:')
            console.log('- analysis-storage:', localStorage.getItem('analysis-storage'))
            console.log('- coverage-analysis-history:', localStorage.getItem('coverage-analysis-history'))
          }, 500)
          
          // Redirect to the enhanced analysis page
          router.push(`/analysis/${analysisId}`)
        }
      }, 1000)
    } catch (error) {
      setIsAnalyzing(false)
      setProgress(0)
      console.error("Analysis error:", error)
      alert(`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Compare Policies</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            {analysisResults && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setAnalysisResults(null)
                  setCurrentAnalysisId(null)
                  setFiles({
                    "box-1": null,
                    "box-2": null,
                    "box-3": null,
                    "box-4": null,
                  })
                  setBoxes(["box-1", "box-2", "box-3", "box-4"])
                  // Clear URL params
                  window.history.replaceState({}, '', '/analyze-compare')
                }}
              >
                Start Over
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href="/health-profile">
                <User className="w-4 h-4 mr-2" />
                Health Profile
              </Link>
            </Button>
          </div>
        </header>

        {analysisResults ? (
          <PolicyComparison results={analysisResults} />
        ) : (
          <div className="flex-1 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-12">
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Compare Health Insurance Policies</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Upload your SBC documents to compare coverage options and benefits. You can upload up to {MAX_POLICIES}{" "}
                  policies.
                </p>
              </div>
              
              {/* Health Profile Recommendation Box */}
              {!hasHealthProfile && (
                <Card className="mb-8 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardContent className="p-2">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">Get Personalized Recommendations</h3>
                        <p className="text-gray-600 mb-4">
                          Complete your health profile first to get accurate cost estimates and personalized policy recommendations based on your specific medical needs.
                        </p>
                        <Button asChild>
                          <Link href="/health-profile">
                            <User className="w-4 h-4 mr-2" />
                            Complete Health Profile
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {boxes.map((boxId) => (
                  <UploadBox
                    key={boxId}
                    id={boxId}
                    file={files[boxId]}
                    onFileSelect={(fileList) => handleFileSelect(boxId, fileList)}
                    disabled={isAnalyzing}
                  />
                ))}
                {canAddMore && <AddMoreBox onAddMore={handleAddMore} disabled={isAnalyzing} />}
              </div>

              <div className="text-center space-y-4">
                {canSubmit && (
                  <Button onClick={handleSubmit} size="lg" disabled={isAnalyzing} className="min-w-[200px]">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Analyze Policies
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </SidebarInset>

      {isAnalyzing && <LoadingScreen progress={progress} />}
    </>
  )
}

export default function AnalyzeComparePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzeCompareContent />
    </Suspense>
  )
}
