"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  User, 
  Loader2,
  Heart,
  DollarSign,
  Shield,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  Star
} from "lucide-react"
import Link from "next/link"
import { useAnalysisStore } from "@/lib/analysis-store"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { EnhancedTreatmentPlanGenerator } from "@/lib/enhanced-treatment-plan-generator"
import { InsuranceCalculator } from "@/lib/insurance-calculator"
import { convertSBCToPolicy, enhanceSBCAnalysis } from "@/lib/sbc-to-policy-converter"
import { PolicyCostAnalysisDisplay } from "@/components/policy-cost-analysis"
import type { ProcessSBCResponse, SBCAnalysis } from "@/lib/sbc-schema"
import { cn } from "@/lib/utils"

const treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()
const insuranceCalculator = new InsuranceCalculator()

export default function EnhancedAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string
  
  const [analysisResults, setAnalysisResults] = useState<ProcessSBCResponse | null>(null)
  const [analysisName, setAnalysisName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("recommendation")
  const [policyAnalyses, setPolicyAnalyses] = useState<any[]>([])
  const [recommendation, setRecommendation] = useState<any>(null)
  
  const { getAnalysis } = useAnalysisStore()
  const { members } = useHealthProfileStore()
  
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
  
  // Load analysis data
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
  
  // Calculate personalized costs when data is available
  useEffect(() => {
    if (!analysisResults || !treatmentPlan) {
      setPolicyAnalyses([])
      return
    }
    
    // Extract successful analyses
    const successfulAnalyses = analysisResults.results
      .filter(r => r.success && r.data)
      .map(r => r.data as SBCAnalysis)
    
    if (successfulAnalyses.length === 0) {
      return
    }
    
    // Extract premium data from analysis results if available
    const premiumData = (analysisResults as any).premiums || {}
    
    // Convert SBC documents to insurance policies and calculate costs
    const policies = successfulAnalyses.map((analysis, index) => {
      // Ensure analysis has an ID and planName
      if (!analysis.planName) {
        analysis.planName = `Policy ${index + 1}`
      }
      const policyId = analysis.id || (analysis.planName ? analysis.planName.toLowerCase().replace(/\s+/g, '-') : `policy-${index}`)
      const premium = premiumData[policyId]
      return convertSBCToPolicy(analysis, premium)
    })
    const comparison = insuranceCalculator.comparePolicies(
      policies,
      treatmentPlan,
      members.length
    )
    
    setPolicyAnalyses(comparison.analyses)
    setRecommendation(comparison.recommendation)
  }, [analysisResults, treatmentPlan, members.length])
  
  if (isLoading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/analyze-compare-v2">Analyze & Compare</BreadcrumbLink>
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
                <BreadcrumbLink href="/analyze-compare-v2">Analyze & Compare</BreadcrumbLink>
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
            <Button onClick={() => router.push("/analyze-compare-v2")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyze & Compare
            </Button>
          </div>
        </div>
      </SidebarInset>
    )
  }
  
  // Extract successful analyses
  const successfulAnalyses = analysisResults.results
    .filter(r => r.success && r.data)
    .map(r => r.data as SBCAnalysis)

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/analyze-compare-v2">Analyze & Compare</BreadcrumbLink>
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
            onClick={() => router.push("/analyze-compare-v2")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/health-profile">
              <User className="w-4 h-4 mr-2" />
              Health Profile
            </Link>
          </Button>
        </div>
      </header>

      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Analysis Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {analysisName || "Policy Analysis"}
            </h1>
            <p className="text-gray-600">
              Comparing {successfulAnalyses.length} insurance {successfulAnalyses.length === 1 ? 'policy' : 'policies'}
              {profileComplete && treatmentPlan && ` based on your health profile`}
            </p>
          </div>
          
          {/* Health Profile Summary Card */}
          {profileComplete && treatmentPlan && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-blue-600" />
                  Your Health Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Family Members</p>
                    <p className="text-xl font-bold">{members.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medical Conditions</p>
                    <p className="text-xl font-bold">{treatmentPlan.conditions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medications</p>
                    <p className="text-xl font-bold">{treatmentPlan.medications.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expected Annual Visits</p>
                    <p className="text-xl font-bold">{treatmentPlan.totalAnnualVisits}</p>
                  </div>
                </div>
                
                {treatmentPlan.conditions.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Managing:</p>
                    <div className="flex flex-wrap gap-2">
                      {treatmentPlan.conditions.map(condition => (
                        <Badge key={condition} variant="secondary">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Main Content Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="recommendation">
                <Sparkles className="w-4 h-4 mr-2" />
                Recommendation
              </TabsTrigger>
              <TabsTrigger value="comparison">
                <TrendingUp className="w-4 h-4 mr-2" />
                Comparison
              </TabsTrigger>
              <TabsTrigger value="costs">
                <DollarSign className="w-4 h-4 mr-2" />
                Cost Details
              </TabsTrigger>
              <TabsTrigger value="coverage">
                <Shield className="w-4 h-4 mr-2" />
                Coverage
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommendation" className="mt-6">
              {profileComplete && recommendation && policyAnalyses.length > 0 ? (
                <div className="space-y-6">
                  {/* AI Recommendation */}
                  <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-green-600" />
                        Our Recommendation for You
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Best Overall Choice</p>
                          <p className="text-2xl font-bold">
                            {successfulAnalyses.find(a => a.id === recommendation.bestValue)?.planName}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Your Expected Annual Cost</p>
                            <p className="text-3xl font-bold text-green-600">
                              ${policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.annual.totalCosts.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">You Could Save</p>
                            <p className="text-3xl font-bold text-blue-600">
                              ${((policyAnalyses[policyAnalyses.length - 1]?.annual.totalCosts || 0) - 
                                 (policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.annual.totalCosts || 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertTitle>Why this plan?</AlertTitle>
                          <AlertDescription>
                            {recommendation.summary}
                          </AlertDescription>
                        </Alert>
                        
                        <div className="pt-4">
                          <h4 className="font-medium mb-3">Key Benefits for Your Situation:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {treatmentPlan.conditions.map(condition => (
                              <div key={condition} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">{condition} Coverage</p>
                                  <p className="text-xs text-gray-600">
                                    Includes specialist visits and treatments
                                  </p>
                                </div>
                              </div>
                            ))}
                            {treatmentPlan.medications.length > 0 && (
                              <div className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                  <p className="font-medium text-sm">Prescription Coverage</p>
                                  <p className="text-xs text-gray-600">
                                    Covers your {treatmentPlan.medications.length} medications
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Alternative Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">If You Stay Healthy</CardTitle>
                        <CardDescription>Best for minimal medical needs</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">
                          {successfulAnalyses.find(a => a.id === recommendation.bestForHealthyYear)?.planName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Could save up to ${(policyAnalyses.find(a => a.policyId === recommendation.bestValue)?.annual.totalCosts - 
                                             policyAnalyses.find(a => a.policyId === recommendation.bestForHealthyYear)?.scenarios.bestCase.totalCost || 0).toLocaleString()} 
                          {' '}if you have minimal medical expenses
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">For Maximum Protection</CardTitle>
                        <CardDescription>Best for major medical events</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">
                          {successfulAnalyses.find(a => a.id === recommendation.bestForMajorEvent)?.planName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Lowest out-of-pocket maximum provides financial protection
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">
                      Complete Your Health Profile
                    </h3>
                    <p className="text-gray-600 mb-4">
                      To get personalized recommendations, we need to know about your health needs
                    </p>
                    <Button asChild>
                      <Link href="/health-profile">
                        <User className="w-4 h-4 mr-2" />
                        Complete Health Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="comparison" className="mt-6">
              <div className="space-y-6">
                {profileComplete && policyAnalyses.length > 0 ? (
                  policyAnalyses.map((analysis) => {
                    const sbc = successfulAnalyses.find(a => a.id === analysis.policyId)
                    if (!sbc) return null
                    
                    const policy = convertSBCToPolicy(sbc)
                    const isRecommended = analysis.policyId === recommendation?.bestValue
                    
                    return (
                      <PolicyCostAnalysisDisplay
                        key={analysis.policyId}
                        analysis={analysis}
                        policy={policy}
                        isRecommended={isRecommended}
                      />
                    )
                  })
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Policy Information</CardTitle>
                      <CardDescription>Basic policy details from your uploaded documents</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {successfulAnalyses.map((analysis) => {
                          const enhanced = enhanceSBCAnalysis(analysis)
                          return (
                            <div key={analysis.id} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{analysis.planName}</h4>
                                <Badge variant="outline">{enhanced.derivedData.planTier}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">Carrier</p>
                                  <p className="font-medium">{analysis.insuranceCompany}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Plan Type</p>
                                  <p className="font-medium">{analysis.planType || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Network</p>
                                  <p className="font-medium">{analysis.network || 'Standard'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Coverage Period</p>
                                  <p className="font-medium">{analysis.coveragePeriod || 'Annual'}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="costs" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown</CardTitle>
                  <CardDescription>
                    {profileComplete ? 'Personalized costs based on your health profile' : 'General cost information from policies'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profileComplete && policyAnalyses.length > 0 ? (
                    <div className="space-y-6">
                      {/* Cost Comparison Chart */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {policyAnalyses.map((analysis) => {
                          const policy = successfulAnalyses.find(a => a.id === analysis.policyId)
                          return (
                            <div key={analysis.policyId} className="text-center p-4 border rounded-lg">
                              <h4 className="font-medium text-sm mb-3">{policy?.planName}</h4>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs text-gray-600">Monthly Premium</p>
                                  <p className="font-semibold">${(analysis.annual.premiums / 12).toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Medical Services</p>
                                  <p className="font-semibold">${analysis.annual.medicalCosts.toLocaleString()}/yr</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Medications</p>
                                  <p className="font-semibold">${analysis.annual.medicationCosts.toLocaleString()}/yr</p>
                                </div>
                                <div className="pt-2 border-t">
                                  <p className="text-xs text-gray-600">Total Annual Cost</p>
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
                          <AlertTitle>Your Estimated Healthcare Costs</AlertTitle>
                          <AlertDescription>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>Treatment & Visit Costs:</span>
                                <span className="font-medium">
                                  ${treatmentPlan.totalAnnualCost.treatments.toLocaleString()}/year
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Medication Costs:</span>
                                <span className="font-medium">
                                  ${treatmentPlan.totalAnnualCost.medications.toLocaleString()}/year
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span>Preventive Care:</span>
                                <span className="font-medium">
                                  ${treatmentPlan.totalAnnualCost.preventive.toLocaleString()}/year
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm pt-2 border-t font-medium">
                                <span>Total Healthcare Needs:</span>
                                <span>${treatmentPlan.totalAnnualCost.total.toLocaleString()}/year</span>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Basic cost information from SBC */}
                      {successfulAnalyses.map((analysis) => (
                        <div key={analysis.id} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{analysis.planName}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {analysis.medicalEvents?.slice(0, 8).map((event, idx) => (
                              <div key={idx}>
                                <p className="text-xs text-gray-600">{event.serviceName}</p>
                                <p className="font-medium">{event.inNetworkCost}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="coverage" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Coverage Details</CardTitle>
                  <CardDescription>What's covered by each policy</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Service</th>
                          {successfulAnalyses.map(policy => (
                            <th key={policy.id} className="text-center py-2 px-2 min-w-[120px]">
                              {policy.planName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Common services comparison */}
                        {['Deductible', 'Out-of-Pocket Max', 'Primary Care', 'Specialist', 'Emergency Room', 'Generic Drugs'].map(service => (
                          <tr key={service} className="border-b">
                            <td className="py-2 pr-4">{service}</td>
                            {successfulAnalyses.map(policy => {
                              const event = policy.medicalEvents?.find(e => 
                                e.serviceName.toLowerCase().includes(service.toLowerCase())
                              )
                              return (
                                <td key={policy.id} className="text-center py-2 px-2">
                                  {event?.inNetworkCost || 'N/A'}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {profileComplete && treatmentPlan && treatmentPlan.recommendations.length > 0 && (
                    <Alert className="mt-4">
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Coverage Considerations for You</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-2 space-y-1">
                          {treatmentPlan.recommendations.slice(0, 3).map((rec, i) => (
                            <li key={i} className="text-sm">• {rec}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarInset>
  )
}