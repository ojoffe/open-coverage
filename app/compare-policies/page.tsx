"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Calculator,
  Filter,
  ArrowUpDown,
  DollarSign,
  Shield,
  Sparkles,
  User,
  Info
} from "lucide-react"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { EnhancedTreatmentPlanGenerator } from "@/lib/enhanced-treatment-plan-generator"
import { InsuranceCalculator } from "@/lib/insurance-calculator"
import { samplePolicies } from "@/lib/sample-insurance-policies"
import { PolicyCostAnalysisDisplay } from "@/components/policy-cost-analysis"

const treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()
const insuranceCalculator = new InsuranceCalculator()

type SortOption = 'total-cost' | 'premium' | 'deductible' | 'oop-max' | 'protection'

export default function ComparePoliciesPage() {
  const router = useRouter()
  const { members } = useHealthProfileStore()
  const [analyses, setAnalyses] = useState<any[]>([])
  const [recommendation, setRecommendation] = useState<any>(null)
  const [sortBy, setSortBy] = useState<SortOption>('total-cost')
  const [filterHSA, setFilterHSA] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Check if profile is complete
  const primaryMember = members[0]
  const profileComplete = primaryMember && 
    primaryMember.age && 
    (primaryMember.conditions.length > 0 || 
     primaryMember.otherServices?.length > 0 ||
     primaryMember.medications.length > 0)
  
  useEffect(() => {
    if (profileComplete) {
      // Generate treatment plan and calculate costs for all policies
      const treatmentPlan = treatmentPlanGenerator.generateEnhancedTreatmentPlan(primaryMember)
      const comparison = insuranceCalculator.comparePolicies(
        samplePolicies,
        treatmentPlan,
        members.length
      )
      
      setAnalyses(comparison.analyses)
      setRecommendation(comparison.recommendation)
      setLoading(false)
    }
  }, [members, primaryMember, profileComplete])
  
  // Sort and filter analyses
  const getSortedAnalyses = () => {
    let filtered = [...analyses]
    
    // Apply filters
    if (filterHSA) {
      filtered = filtered.filter(a => {
        const policy = samplePolicies.find(p => p.id === a.policyId)
        return policy?.benefits?.hsaEligible
      })
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const policyA = samplePolicies.find(p => p.id === a.policyId)!
      const policyB = samplePolicies.find(p => p.id === b.policyId)!
      
      switch (sortBy) {
        case 'total-cost':
          return a.annual.totalCosts - b.annual.totalCosts
        case 'premium':
          return a.annual.premiums - b.annual.premiums
        case 'deductible':
          return policyA.deductible.individual - policyB.deductible.individual
        case 'oop-max':
          return policyA.outOfPocketMax.individual - policyB.outOfPocketMax.individual
        case 'protection':
          const protectionOrder = { high: 0, medium: 1, low: 2 }
          return protectionOrder[a.keyMetrics.riskProtection] - protectionOrder[b.keyMetrics.riskProtection]
        default:
          return 0
      }
    })
  }
  
  if (!profileComplete) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/cost-analysis">Cost Analysis</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Compare Policies</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 p-8">
          <div className="max-w-2xl mx-auto">
            <Alert>
              <User className="h-4 w-4" />
              <AlertTitle>Complete Your Health Profile First</AlertTitle>
              <AlertDescription>
                To compare insurance policies, we need your health information to calculate accurate costs.
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => router.push('/health-profile')}>
                Complete Health Profile
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    )
  }
  
  if (loading) {
    return (
      <SidebarInset>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Calculator className="w-12 h-12 mx-auto mb-4 animate-pulse" />
            <p>Calculating policy costs...</p>
          </div>
        </div>
      </SidebarInset>
    )
  }
  
  const sortedAnalyses = getSortedAnalyses()
  
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/cost-analysis">Cost Analysis</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Compare Policies</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Compare Insurance Policies
            </h1>
            <p className="text-gray-600">
              Based on your health profile and expected medical needs
            </p>
          </div>
          
          {/* Recommendation Summary */}
          {recommendation && (
            <Alert className="mb-6 border-blue-200 bg-blue-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">AI Recommendation</AlertTitle>
              <AlertDescription className="text-blue-800">
                {recommendation.summary}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Filters and Sorting */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-1.5 border rounded-md text-sm"
                  >
                    <option value="total-cost">Total Annual Cost</option>
                    <option value="premium">Monthly Premium</option>
                    <option value="deductible">Deductible</option>
                    <option value="oop-max">Out-of-Pocket Max</option>
                    <option value="protection">Risk Protection</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filterHSA}
                      onChange={(e) => setFilterHSA(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    HSA Eligible Only
                  </label>
                </div>
                
                <div className="ml-auto text-sm text-gray-600">
                  Showing {sortedAnalyses.length} of {samplePolicies.length} plans
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Lowest Total Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${sortedAnalyses[0]?.annual.totalCosts.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  {samplePolicies.find(p => p.id === sortedAnalyses[0]?.policyId)?.name}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Best Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  ${samplePolicies.find(p => p.id === recommendation?.bestForMajorEvent)?.outOfPocketMax.individual.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">
                  Max out-of-pocket
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Potential Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  ${((sortedAnalyses[sortedAnalyses.length - 1]?.annual.totalCosts || 0) - 
                     (sortedAnalyses[0]?.annual.totalCosts || 0)).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  vs. most expensive option
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Policy Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedAnalyses.map((analysis) => {
              const policy = samplePolicies.find(p => p.id === analysis.policyId)!
              const isRecommended = analysis.policyId === recommendation.bestValue
              
              return (
                <PolicyCostAnalysisDisplay
                  key={analysis.policyId}
                  analysis={analysis}
                  policy={policy}
                  isRecommended={isRecommended}
                  onSelect={() => {
                    // Handle policy selection
                    console.log('Selected policy:', policy.id)
                  }}
                />
              )
            })}
          </div>
          
          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Understanding Your Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Premium vs. Deductible Trade-off</h4>
                  <p className="text-gray-600">
                    Lower premium plans typically have higher deductibles. If you're healthy and 
                    rarely need medical care, a high-deductible plan might save you money.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Out-of-Pocket Maximum</h4>
                  <p className="text-gray-600">
                    This is your financial safety net. Once you hit this amount, insurance covers 
                    100% of covered services for the rest of the year.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">HSA Benefits</h4>
                  <p className="text-gray-600">
                    Health Savings Accounts offer triple tax benefits: deductible contributions, 
                    tax-free growth, and tax-free withdrawals for medical expenses.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Network Considerations</h4>
                  <p className="text-gray-600">
                    Make sure your doctors are in-network. Out-of-network care can be significantly 
                    more expensive or not covered at all with some plans.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}