"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  AlertCircle, 
  CheckCircle, 
  ChevronRight,
  DollarSign,
  FileText,
  Heart,
  MapPin,
  User,
  Calculator
} from "lucide-react"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { EnhancedTreatmentPlanGenerator, EnhancedTreatmentPlan } from "@/lib/enhanced-treatment-plan-generator"
import { TreatmentCostDisplay } from "@/components/treatment-cost-display"
import { ProfileCompleteness } from "@/components/profile-completeness"
import { cn } from "@/lib/utils"

const treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()

export default function CostAnalysisPage() {
  const router = useRouter()
  const { members } = useHealthProfileStore()
  const [treatmentPlans, setTreatmentPlans] = useState<EnhancedTreatmentPlan[]>([])
  const [totalEstimatedCost, setTotalEstimatedCost] = useState(0)
  const [currentStep, setCurrentStep] = useState<'profile' | 'costs' | 'policies'>('profile')
  const [selectedState, setSelectedState] = useState<string>('CA')
  
  // Check if profile is complete enough for analysis
  const primaryMember = members[0]
  const profileComplete = primaryMember && 
    primaryMember.age && 
    (primaryMember.conditions.length > 0 || 
     primaryMember.otherServices?.length > 0 ||
     primaryMember.medications.length > 0)
  
  // Generate treatment plans for all members
  useEffect(() => {
    if (members.length > 0) {
      const plans = members.map(member => treatmentPlanGenerator.generateEnhancedTreatmentPlan(member))
      setTreatmentPlans(plans)
      
      // Calculate total estimated cost from enhanced plans
      const totalCost = plans.reduce((sum, plan) => sum + plan.totalAnnualCost.total, 0)
      setTotalEstimatedCost(totalCost)
    }
  }, [members])
  
  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!primaryMember) return { overall: 0, categories: {} }
    
    const hasAge = primaryMember.age ? 1 : 0
    const hasConditions = primaryMember.conditions.length > 0 ? 1 : 0
    const hasMedications = primaryMember.medications.length > 0 ? 1 : 0
    const hasServices = primaryMember.otherServices?.length > 0 ? 1 : 0
    const hasLifestyle = primaryMember.smokingStatus ? 1 : 0
    
    const overall = ((hasAge + hasConditions + hasMedications + hasServices + hasLifestyle) / 5) * 100
    
    return {
      overall,
      categories: {
        demographics: hasAge * 100,
        conditions: hasConditions * 100,
        medications: hasMedications * 100,
        providers: 0,
        history: 0,
        preferences: hasServices * 100,
      }
    }
  }
  
  const handleCostCalculated = (cost: number) => {
    setTotalEstimatedCost(prev => prev + cost)
  }
  
  const steps = [
    { id: 'profile', label: 'Health Profile', icon: User },
    { id: 'costs', label: 'Treatment Costs', icon: DollarSign },
    { id: 'policies', label: 'Compare Policies', icon: FileText },
  ]
  
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/health-profile">Health Profile</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Cost Analysis</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      
      <div className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Insurance Cost Analysis
            </h1>
            <p className="text-gray-600">
              Get personalized cost estimates based on your health profile and real treatment costs.
            </p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = currentStep === step.id
                const isComplete = 
                  (step.id === 'profile' && profileComplete) ||
                  (step.id === 'costs' && totalEstimatedCost > 0)
                
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        isActive ? "bg-blue-600 text-white" :
                        isComplete ? "bg-green-600 text-white" :
                        "bg-gray-200 text-gray-400"
                      )}>
                        {isComplete ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={cn(
                        "ml-3 font-medium",
                        isActive ? "text-blue-600" :
                        isComplete ? "text-green-600" :
                        "text-gray-400"
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-300 mx-4" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Main Content */}
          {!profileComplete ? (
            // Profile Incomplete State
            <div className="space-y-6">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800">Complete Your Health Profile</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  To get accurate cost estimates, please complete your health profile with:
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>Your age and basic demographics</li>
                    <li>Any pre-existing medical conditions</li>
                    <li>Current medications you take</li>
                    <li>Expected medical services for next year</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <ProfileCompleteness {...calculateCompleteness()} />
              
              <div className="flex justify-center">
                <Button size="lg" onClick={() => router.push('/health-profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Complete Health Profile
                </Button>
              </div>
            </div>
          ) : (
            // Profile Complete - Show Cost Analysis
            <div className="space-y-6">
              {/* Member Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Health Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Members</p>
                      <p className="text-2xl font-bold">{members.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Conditions</p>
                      <p className="text-2xl font-bold">
                        {members.reduce((sum, m) => sum + m.conditions.length, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Medications</p>
                      <p className="text-2xl font-bold">
                        {members.reduce((sum, m) => sum + m.medications.length, 0)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Conditions List */}
                  {primaryMember.conditions.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Managing:</p>
                      <div className="flex flex-wrap gap-2">
                        {primaryMember.conditions.map(condition => (
                          <Badge key={condition} variant="secondary">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Location Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Your Location
                  </CardTitle>
                  <CardDescription>
                    Medical costs vary significantly by region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="CA">California</option>
                    <option value="NY">New York</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="OH">Ohio</option>
                    <option value="GA">Georgia</option>
                    <option value="NC">North Carolina</option>
                    <option value="MI">Michigan</option>
                  </select>
                </CardContent>
              </Card>
              
              {/* Enhanced Treatment Plan Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Personalized Treatment Plan
                </h2>
                
                {treatmentPlans.map((plan, index) => (
                  <Card key={plan.memberId}>
                    <CardHeader>
                      <CardTitle>
                        Member {index + 1} {plan.memberAge && `(Age ${plan.memberAge})`}
                      </CardTitle>
                      <CardDescription>
                        {plan.hasChronicConditions && <Badge variant="secondary" className="mr-2">Chronic Conditions</Badge>}
                        {plan.requiresSpecialistCare && <Badge variant="secondary" className="mr-2">Specialist Care</Badge>}
                        <Badge variant={
                          plan.emergencyRiskLevel === 'high' ? 'destructive' :
                          plan.emergencyRiskLevel === 'medium' ? 'secondary' : 'outline'
                        }>
                          {plan.emergencyRiskLevel} Emergency Risk
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Cost Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Treatments</p>
                          <p className="text-lg font-semibold">${plan.totalAnnualCost.treatments.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Medications</p>
                          <p className="text-lg font-semibold">${plan.totalAnnualCost.medications.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Preventive</p>
                          <p className="text-lg font-semibold">${plan.totalAnnualCost.preventive.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Annual</p>
                          <p className="text-lg font-semibold text-blue-600">
                            ${plan.totalAnnualCost.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Condition Details */}
                      {plan.treatments.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Treatment Plan</h4>
                          <div className="space-y-2">
                            {plan.conditions.map(condition => {
                              const conditionTreatments = plan.treatments.filter(t => t.relatedCondition === condition)
                              const severity = conditionTreatments[0]?.severity || 'mild'
                              
                              return (
                                <div key={condition} className="text-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium">{condition}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {severity} severity
                                    </Badge>
                                  </div>
                                  <div className="ml-4 text-gray-600">
                                    {conditionTreatments.length} treatments, 
                                    {' '}{conditionTreatments.reduce((sum, t) => sum + t.annualFrequency, 0)} visits/year
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Savings Opportunities */}
                      {plan.savingsOpportunities.length > 0 && (
                        <Alert className="border-green-200 bg-green-50">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Savings Opportunities</AlertTitle>
                          <AlertDescription className="text-green-700">
                            <ul className="mt-2 space-y-1">
                              {plan.savingsOpportunities.slice(0, 3).map((opp, i) => (
                                <li key={i}>
                                  {opp.recommendation} (Save ${opp.potentialSavings.toLocaleString()}/year)
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Recommendations */}
                      {plan.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recommendations</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {plan.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i} className="flex items-start">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Total Cost Summary */}
              {totalEstimatedCost > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 mb-2">
                        Total Estimated Annual Healthcare Costs
                      </p>
                      <p className="text-4xl font-bold text-blue-900">
                        ${totalEstimatedCost.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        For {members.length} family member{members.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="mt-6 flex justify-center">
                      <Button 
                        size="lg"
                        onClick={() => router.push('/compare-policies')}
                      >
                        Compare Insurance Policies
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}