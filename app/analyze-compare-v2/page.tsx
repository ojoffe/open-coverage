"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  User,
  Heart,
  DollarSign,
  Shield,
  Sparkles,
  ChevronRight,
  Plus,
  X,
  TrendingUp,
  Calculator,
  FileCheck
} from "lucide-react"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { useAnalysisStore } from "@/lib/analysis-store"
import { EnhancedTreatmentPlanGenerator } from "@/lib/enhanced-treatment-plan-generator"
import { InsuranceCalculator, InsurancePolicy } from "@/lib/insurance-calculator"
import { convertSBCToPolicy } from "@/lib/sbc-to-policy-converter"
import { processSBCDocuments } from "@/app/actions/process-sbc"
import { PolicyCostAnalysisDisplay } from "@/components/policy-cost-analysis"
import { PremiumInputModal, PolicyPremium } from "@/components/premium-input-modal"
import { cn } from "@/lib/utils"

const treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()
const insuranceCalculator = new InsuranceCalculator()

interface UploadedFile {
  name: string
  size: number
  type: string
  file: File
}

export default function EnhancedAnalyzeComparePage() {
  const router = useRouter()
  const { members } = useHealthProfileStore()
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingError, setProcessingError] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [policyAnalyses, setPolicyAnalyses] = useState<any[]>([])
  const [recommendation, setRecommendation] = useState<any>(null)
  const [selectedTab, setSelectedTab] = useState("overview")
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [policyPremiums, setPolicyPremiums] = useState<Record<string, PolicyPremium>>({})
  const [pendingAnalyses, setPendingAnalyses] = useState<any[]>([])
  
  // Check health profile completion
  const primaryMember = members[0]
  const profileComplete = primaryMember && 
    primaryMember.age && 
    (primaryMember.conditions.length > 0 || 
     primaryMember.otherServices?.length > 0 ||
     primaryMember.medications.length > 0)
  
  // Generate treatment plan
  const treatmentPlan = useMemo(() => {
    if (!profileComplete) return null
    return treatmentPlanGenerator.generateEnhancedTreatmentPlan(primaryMember)
  }, [primaryMember, profileComplete])
  
  // Calculate costs for uploaded policies
  useEffect(() => {
    if (!treatmentPlan || analyses.length === 0) {
      setPolicyAnalyses([])
      return
    }
    
    // Convert SBC documents to insurance policies and calculate costs
    const policies = analyses.map((analysis, index) => {
      // Ensure analysis has required properties
      if (!analysis.id) {
        analysis.id = `analysis-${index}`
      }
      if (!analysis.planName) {
        analysis.planName = `Policy ${index + 1}`
      }
      return convertSBCToPolicy(analysis)
    })
    const comparison = insuranceCalculator.comparePolicies(
      policies,
      treatmentPlan,
      members.length
    )
    
    setPolicyAnalyses(comparison.analyses)
    setRecommendation(comparison.recommendation)
  }, [treatmentPlan, analyses, members.length])
  
  // Generate analysis name from results
  const generateAnalysisName = (results: any): string => {
    const successfulResults = results.results?.filter((r: any) => r.success && r.data) || []
    if (successfulResults.length === 0) return 'Analysis'
    
    const planNames = successfulResults.map((r: any) => 
      r.data.planName || r.fileName?.replace('.pdf', '') || 'Unknown'
    ).slice(0, 2)
    
    if (planNames.length === 1) {
      return planNames[0]
    } else {
      return `${planNames.join(' vs ')}${successfulResults.length > 2 ? ` +${successfulResults.length - 2}` : ''}`
    }
  }
  
  // Handle file upload
  const handleFileSelect = (files: FileList) => {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }))
    setUploadedFiles(prev => [...prev, ...newFiles])
    setProcessingError(null)
  }
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  // Handle premium submission
  const handlePremiumSubmit = async (premiums: PolicyPremium[]) => {
    // Store premiums
    const premiumMap: Record<string, PolicyPremium> = {}
    premiums.forEach(p => {
      premiumMap[p.policyId] = p
    })
    setPolicyPremiums(premiumMap)
    
    // Create the analysis result with premiums
    const resultWithPremiums = {
      success: true,
      successCount: pendingAnalyses.length,
      analyses: pendingAnalyses,
      results: pendingAnalyses.map((analysis: any) => ({
        success: true,
        data: analysis
      })),
      premiums: premiumMap
    }
    
    // Save analysis and redirect
    const analysisName = generateAnalysisName(resultWithPremiums)
    const { saveAnalysis } = useAnalysisStore.getState()
    const analysisId = await saveAnalysis(analysisName, resultWithPremiums)
    
    // Close modal and redirect
    setShowPremiumModal(false)
    router.push(`/analysis/${analysisId}`)
  }
  
  // Process uploaded documents
  const processDocuments = async () => {
    if (uploadedFiles.length === 0) return
    
    setIsProcessing(true)
    setProcessingError(null)
    
    try {
      const formData = new FormData()
      uploadedFiles.forEach((uploadedFile, index) => {
        formData.append(`file${index}`, uploadedFile.file)
      })
      
      const result = await processSBCDocuments(formData)
      
      if (result.success && result.analyses) {
        setAnalyses(result.analyses)
        setUploadedFiles([]) // Clear uploaded files after successful processing
        
        // Store analyses temporarily and show premium modal
        if (result.successCount > 0) {
          setPendingAnalyses(result.analyses)
          setShowPremiumModal(true)
        }
      } else {
        setProcessingError(result.error || "Failed to process documents")
      }
    } catch (error) {
      setProcessingError("An error occurred while processing your documents")
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Calculate progress
  const getProgress = () => {
    let progress = 0
    if (profileComplete) progress += 50
    if (analyses && analyses.length > 0) progress += 50
    return progress
  }
  
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Analyze & Compare</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header with Progress */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Best Insurance Policy
            </h1>
            <p className="text-gray-600 mb-4">
              We'll analyze your health needs and compare your insurance options to find the best fit
            </p>
            <div className="space-y-2">
              <Progress value={getProgress()} className="h-2" />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{getProgress()}% Complete</span>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Health Profile & Upload */}
            <div className="lg:col-span-1 space-y-6">
              {/* Health Profile Summary */}
              <Card className={cn(
                "transition-all",
                profileComplete ? "border-green-200 bg-green-50/50" : ""
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Health Profile
                    </span>
                    {profileComplete && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </CardTitle>
                  <CardDescription>
                    Your medical history and expected needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profileComplete ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Members</span>
                        <span className="font-medium">{members.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Conditions</span>
                        <span className="font-medium">
                          {members.reduce((sum, m) => sum + m.conditions.length, 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Medications</span>
                        <span className="font-medium">
                          {members.reduce((sum, m) => sum + m.medications.length, 0)}
                        </span>
                      </div>
                      
                      {primaryMember.conditions.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 mb-2">Managing:</p>
                          <div className="flex flex-wrap gap-1">
                            {primaryMember.conditions.slice(0, 3).map(condition => (
                              <Badge key={condition} variant="secondary" className="text-xs">
                                {condition}
                              </Badge>
                            ))}
                            {primaryMember.conditions.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{primaryMember.conditions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={() => router.push('/health-profile')}
                      >
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-3">
                        Complete your health profile to get personalized recommendations
                      </p>
                      <Button 
                        className="w-full"
                        onClick={() => router.push('/health-profile')}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Document Upload */}
              <Card className={cn(
                "transition-all",
                analyses.length > 0 ? "border-green-200 bg-green-50/50" : ""
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Insurance Documents
                    </span>
                    {analyses.length > 0 && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </CardTitle>
                  <CardDescription>
                    Upload your Summary of Benefits (SBC) PDFs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyses.length > 0 ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        {analyses.map((analysis, index) => (
                          <div key={analysis.id} className="flex items-center gap-2 text-sm">
                            <FileCheck className="w-4 h-4 text-green-600" />
                            <span className="flex-1 truncate">{analysis.planName}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          setAnalyses([])
                          setUploadedFiles([])
                        }}
                      >
                        Upload Different Policies
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Drop Zone */}
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          handleFileSelect(e.dataTransfer.files)
                        }}
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <input
                          id="file-input"
                          type="file"
                          multiple
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                        />
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          Drop SBC PDFs here or click to browse
                        </p>
                      </div>
                      
                      {/* Uploaded Files */}
                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                              <FileText className="w-4 h-4 text-gray-500" />
                              <span className="flex-1 truncate">{file.name}</span>
                              <button
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          
                          <Button 
                            className="w-full"
                            onClick={processDocuments}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <>
                                <Calculator className="w-4 h-4 mr-2 animate-pulse" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Analyze Documents
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {processingError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{processingError}</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Right Column: Analysis Results */}
            <div className="lg:col-span-2">
              {!profileComplete || analyses.length === 0 ? (
                <Card className="h-full flex items-center justify-center">
                  <CardContent className="text-center py-16">
                    <div className="max-w-sm mx-auto">
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">
                        Complete Setup to See Recommendations
                      </h3>
                      <p className="text-gray-600 mb-6">
                        We need your health profile and insurance documents to provide personalized analysis
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-left">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            profileComplete ? "bg-green-100" : "bg-gray-100"
                          )}>
                            {profileComplete ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">1</span>
                            )}
                          </div>
                          <span className={cn(
                            "text-sm",
                            profileComplete ? "text-green-600 font-medium" : "text-gray-600"
                          )}>
                            Complete health profile
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-left">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            analyses.length > 0 ? "bg-green-100" : "bg-gray-100"
                          )}>
                            {analyses.length > 0 ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <span className="text-sm font-medium text-gray-600">2</span>
                            )}
                          </div>
                          <span className={cn(
                            "text-sm",
                            analyses.length > 0 ? "text-green-600 font-medium" : "text-gray-600"
                          )}>
                            Upload insurance documents
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Recommendation Card */}
                  {recommendation && policyAnalyses.length > 0 && (
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                          Your Personalized Recommendation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Recommended Policy */}
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Best Overall Choice</p>
                            <p className="text-xl font-bold">
                              {analyses.find(a => a.id === recommendation.bestValue)?.planName}
                            </p>
                          </div>
                          
                          {/* Expected Cost */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Expected Annual Cost</p>
                              <p className="text-2xl font-bold text-blue-600">
                                ${policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.annual.totalCosts.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Potential Savings</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${((policyAnalyses[policyAnalyses.length - 1]?.annual.totalCosts || 0) - 
                                   (policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.annual.totalCosts || 0)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          
                          {/* Why This Works */}
                          <div>
                            <p className="text-sm font-medium mb-2">Why this works for you:</p>
                            <ul className="space-y-1">
                              {treatmentPlan && treatmentPlan.conditions.map(condition => (
                                <li key={condition} className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                  <span>Covers treatments for {condition}</span>
                                </li>
                              ))}
                              {treatmentPlan && treatmentPlan.medications.length > 0 && (
                                <li className="flex items-start gap-2 text-sm">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                  <span>Includes your {treatmentPlan.medications.length} medications</span>
                                </li>
                              )}
                              <li className="flex items-start gap-2 text-sm">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span>
                                  {policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.keyMetrics.riskProtection} financial protection
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Detailed Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Policy Comparison</CardTitle>
                      <CardDescription>
                        Side-by-side analysis based on your health profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="costs">Cost Details</TabsTrigger>
                          <TabsTrigger value="coverage">Coverage</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4 mt-4">
                          {policyAnalyses.map((analysis) => {
                            const policy = analyses.find(a => a.id === analysis.policyId)
                            if (!policy) return null
                            
                            const convertedPolicy = convertSBCToPolicy(policy || {})
                            const isRecommended = analysis.policyId === recommendation?.bestValue
                            
                            return (
                              <PolicyCostAnalysisDisplay
                                key={analysis.policyId}
                                analysis={analysis}
                                policy={convertedPolicy}
                                isRecommended={isRecommended}
                              />
                            )
                          })}
                        </TabsContent>
                        
                        <TabsContent value="costs" className="mt-4">
                          <div className="space-y-4">
                            {/* Cost Comparison Chart */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {policyAnalyses.map((analysis) => {
                                const policy = analyses.find(a => a.id === analysis.policyId)
                                return (
                                  <div key={analysis.policyId} className="text-center p-4 border rounded-lg">
                                    <h4 className="font-medium text-sm mb-2">{policy?.planName}</h4>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-xs text-gray-600">Premium</p>
                                        <p className="font-semibold">${(analysis.annual.premiums / 12).toLocaleString()}/mo</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600">Medical</p>
                                        <p className="font-semibold">${analysis.annual.medicalCosts.toLocaleString()}/yr</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-gray-600">Medications</p>
                                        <p className="font-semibold">${analysis.annual.medicationCosts.toLocaleString()}/yr</p>
                                      </div>
                                      <div className="pt-2 border-t">
                                        <p className="text-xs text-gray-600">Total Annual</p>
                                        <p className="text-lg font-bold text-blue-600">
                                          ${analysis.annual.totalCosts.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            
                            {/* Your Specific Costs */}
                            {treatmentPlan && (
                              <Alert>
                                <DollarSign className="h-4 w-4" />
                                <AlertTitle>Cost Breakdown for Your Conditions</AlertTitle>
                                <AlertDescription>
                                  <div className="mt-2 space-y-1">
                                    {treatmentPlan.conditions.map(condition => (
                                      <div key={condition} className="flex items-center justify-between text-sm">
                                        <span>{condition} treatments:</span>
                                        <span className="font-medium">
                                          ~${(treatmentPlan.totalAnnualCost.treatments / treatmentPlan.conditions.length).toLocaleString()}/yr
                                        </span>
                                      </div>
                                    ))}
                                    {treatmentPlan.medications.length > 0 && (
                                      <div className="flex items-center justify-between text-sm pt-1 border-t">
                                        <span>Medications ({treatmentPlan.medications.length}):</span>
                                        <span className="font-medium">
                                          ~${treatmentPlan.totalAnnualCost.medications.toLocaleString()}/yr
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="coverage" className="mt-4">
                          <div className="space-y-4">
                            {/* Coverage Comparison Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2">Service</th>
                                    {analyses.map(policy => (
                                      <th key={policy.id} className="text-center py-2 px-2">
                                        {policy.planName}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b">
                                    <td className="py-2">Deductible</td>
                                    {analyses.map(policy => {
                                      const deductible = policy.medicalEvents?.find(e => 
                                        e.serviceName.toLowerCase().includes('deductible')
                                      )
                                      return (
                                        <td key={policy.id} className="text-center py-2">
                                          ${deductible?.inNetworkCost || 'N/A'}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2">Primary Care</td>
                                    {analyses.map(policy => {
                                      const service = policy.medicalEvents?.find(e => 
                                        e.serviceName.toLowerCase().includes('primary')
                                      )
                                      return (
                                        <td key={policy.id} className="text-center py-2">
                                          {service?.inNetworkCost || 'N/A'}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2">Specialist</td>
                                    {analyses.map(policy => {
                                      const service = policy.medicalEvents?.find(e => 
                                        e.serviceName.toLowerCase().includes('specialist')
                                      )
                                      return (
                                        <td key={policy.id} className="text-center py-2">
                                          {service?.inNetworkCost || 'N/A'}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                  <tr className="border-b">
                                    <td className="py-2">Generic Drugs</td>
                                    {analyses.map(policy => {
                                      const service = policy.medicalEvents?.find(e => 
                                        e.serviceName.toLowerCase().includes('generic')
                                      )
                                      return (
                                        <td key={policy.id} className="text-center py-2">
                                          {service?.inNetworkCost || 'N/A'}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Important Coverage Notes */}
                            {treatmentPlan && treatmentPlan.recommendations.length > 0 && (
                              <Alert>
                                <Shield className="h-4 w-4" />
                                <AlertTitle>Coverage Considerations</AlertTitle>
                                <AlertDescription>
                                  <ul className="mt-2 space-y-1">
                                    {treatmentPlan.recommendations.slice(0, 3).map((rec, i) => (
                                      <li key={i} className="text-sm">• {rec}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Input Modal */}
      {showPremiumModal && pendingAnalyses.length > 0 && (
        <PremiumInputModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
          policies={pendingAnalyses.map(a => ({
            id: a.id || a.planName.toLowerCase().replace(/\s+/g, '-'),
            name: a.planName
          }))}
          onSubmit={handlePremiumSubmit}
          familySize={members.length}
        />
      )}
    </SidebarInset>
  )
}