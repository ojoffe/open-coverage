"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  User, 
  Loader2,
  Heart,
  DollarSign,
  Shield,
  Sparkles,
  TrendingUp,
  Calculator,
  CheckCircle,
  Info,
  Star,
  ArrowDown,
  ChevronDown,
  Award
} from "lucide-react"
import Link from "next/link"
import { useAnalysisStore } from "@/lib/analysis-store"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { EnhancedTreatmentPlanGenerator } from "@/lib/enhanced-treatment-plan-generator"
import { InsuranceCalculator } from "@/lib/insurance-calculator"
import { convertSBCToPolicy } from "@/lib/sbc-to-policy-converter"
import type { ProcessSBCResponse, SBCAnalysis } from "@/lib/sbc-schema"
import { cn } from "@/lib/utils"

const treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()
const insuranceCalculator = new InsuranceCalculator()

export default function SimplifiedAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string
  
  const [analysisResults, setAnalysisResults] = useState<ProcessSBCResponse | null>(null)
  const [analysisName, setAnalysisName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [policyAnalyses, setPolicyAnalyses] = useState<any[]>([])
  const [recommendation, setRecommendation] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  
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
  
  // Get the recommended policy
  const recommendedPolicy = recommendation && policyAnalyses.find(a => a.policyId === recommendation.bestValue)
  const recommendedSBC = recommendation && successfulAnalyses.find(a => a.id === recommendation.bestValue)
  
  // Calculate savings
  const maxCost = Math.max(...policyAnalyses.map(a => a.annual.totalCosts))
  const savings = recommendedPolicy ? maxCost - recommendedPolicy.annual.totalCosts : 0

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
        </div>
      </header>

      <div className="flex-1 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {profileComplete && recommendation && policyAnalyses.length > 0 ? (
            <>
              {/* Hero Recommendation Card */}
              <div className="mb-8">
                <Card className="overflow-hidden border-2 border-green-500 shadow-xl">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Award className="w-8 h-8" />
                      <h1 className="text-2xl font-bold">We Recommend</h1>
                    </div>
                    <p className="text-green-100">Based on your health profile and expected medical needs</p>
                  </div>
                  
                  <CardContent className="p-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h2 className="text-3xl font-bold mb-2">{recommendedSBC?.planName}</h2>
                        <p className="text-gray-600 mb-4">{recommendedSBC?.insuranceCompany}</p>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium">Your Annual Cost</span>
                            <span className="text-2xl font-bold text-green-600">
                              ${recommendedPolicy?.annual.totalCosts.toLocaleString()}
                            </span>
                          </div>
                          
                          {savings > 0 && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <span className="text-sm font-medium">You Save</span>
                              <span className="text-2xl font-bold text-blue-600">
                                ${savings.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Why this plan?</h3>
                        <div className="space-y-2">
                          {treatmentPlan.conditions.slice(0, 3).map(condition => (
                            <div key={condition} className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                              <span className="text-sm">Best coverage for {condition}</span>
                            </div>
                          ))}
                          {treatmentPlan.medications.length > 0 && (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                              <span className="text-sm">Covers all your medications</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                            <span className="text-sm">Lowest total cost for your needs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-3">
                      <Button size="lg" className="flex-1">
                        Choose This Plan
                      </Button>
                      <Button size="lg" variant="outline" onClick={() => setShowDetails(!showDetails)}>
                        <ChevronDown className={cn("w-4 h-4 mr-2 transition-transform", showDetails && "rotate-180")} />
                        {showDetails ? 'Hide' : 'Show'} Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Quick Comparison */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Quick Comparison</h2>
                <div className="grid gap-4">
                  {policyAnalyses.map((analysis) => {
                    const sbc = successfulAnalyses.find(a => a.id === analysis.policyId)
                    const isRecommended = analysis.policyId === recommendation?.bestValue
                    
                    return (
                      <Card key={analysis.policyId} className={cn(
                        "relative overflow-hidden transition-all",
                        isRecommended && "ring-2 ring-green-500"
                      )}>
                        {isRecommended && (
                          <div className="absolute top-0 right-0">
                            <Badge className="rounded-none rounded-bl-lg bg-green-500 text-white">
                              Recommended
                            </Badge>
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">{sbc?.planName}</h3>
                              <p className="text-sm text-gray-600">{sbc?.insuranceCompany}</p>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                ${analysis.annual.totalCosts.toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">per year</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                              <p className="text-xs text-gray-600">Premium</p>
                              <p className="font-medium">${(analysis.annual.premiums / 12).toLocaleString()}/mo</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Medical</p>
                              <p className="font-medium">${analysis.annual.medicalCosts.toLocaleString()}/yr</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Medications</p>
                              <p className="font-medium">${analysis.annual.medicationCosts.toLocaleString()}/yr</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
              
              {/* Detailed Information (Progressive Disclosure) */}
              {showDetails && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Health Profile Impact</CardTitle>
                      <CardDescription>How your specific needs affect costs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Medical Conditions ({treatmentPlan.conditions.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {treatmentPlan.conditions.map(condition => (
                              <Badge key={condition} variant="secondary">{condition}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Expected Annual Healthcare Usage</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <p className="text-2xl font-bold">{treatmentPlan.totalAnnualVisits}</p>
                              <p className="text-xs text-gray-600">Doctor Visits</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <p className="text-2xl font-bold">{treatmentPlan.medications.length}</p>
                              <p className="text-xs text-gray-600">Medications</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <p className="text-2xl font-bold">${(treatmentPlan.totalAnnualCost.total / 1000).toFixed(1)}k</p>
                              <p className="text-xs text-gray-600">Healthcare Costs</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <p className="text-2xl font-bold">{members.length}</p>
                              <p className="text-xs text-gray-600">Family Members</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Coverage Details</CardTitle>
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
                            {['Deductible', 'Out-of-Pocket Max', 'Primary Care', 'Specialist', 'Generic Drugs'].map(service => (
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
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">
                  Complete Your Health Profile First
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  To get personalized recommendations and accurate cost estimates, we need to understand your health needs
                </p>
                <Button size="lg" asChild>
                  <Link href="/health-profile">
                    <User className="w-5 h-5 mr-2" />
                    Complete Health Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}