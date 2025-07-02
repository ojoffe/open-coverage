"use client"

import { calculatePolicyAnalysis, type AnalysisConfig, type PolicyAnalysis } from "@/app/actions/calculate-analysis"
import { runEnhancedPolicyAnalysis, type EnhancedPolicyAnalysis } from "@/app/actions/enhanced-analysis"
import { retrievePricingForAnalysis, type PricingRetrievalResult } from "@/app/actions/retrieve-pricing"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useHealthProfileStore } from "@/lib/health-profile-store"
import { getCategoryColor } from "@/lib/medication-categories"
import type { ProcessSBCResponse, SBCData } from "@/lib/sbc-schema"
import { Eye, FileText, MoreHorizontal, Pill, Plus, Search, Star, Trash2, X } from "lucide-react"
import React, { useState } from "react"
import { SmartAnalysisButton } from "./smart-analysis-button"

interface PolicyComparisonProps {
  results: ProcessSBCResponse
}

interface PolicyDetailModalProps {
  policy: SBCData
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface CategorySearchResult {
  category: string
  subcategories: string[]
  relatedServices: Array<{
    serviceName: string
    costs: Array<{
      policyName: string
      inNetwork: string
      outOfNetwork: string
      score: number
    }>
  }>
  policyScores: Array<{
    policyName: string
    score: number
    grade: string
    reasoning: string
  }>
}

interface CategoryAnalysisResult {
  category: string
  description: string
  relatedServices: Array<{
    serviceName: string
    description: string
    estimatedFrequency: string
    relevanceReason: string
    policyPricing: Array<{
      policyName: string
      inNetworkCost: string
      outOfNetworkCost: string
      actualCostAfterDeductible: string
      limitations?: string
    }>
  }>
  suggestedSubcategories: Array<{
    name: string
    description: string
    searchTerm: string
  }>
  policyGrades: Array<{
    policyName: string
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
    reasoning: string
    estimatedCost: string
    coverageHighlights: string[]
    costFactors: string[]
  }>
  overallInsights: string[]
}

interface CategoryAnalysisInput {
  searchTerm: string
  policies: SBCData[]
  networkType: 'in-network' | 'out-of-network'
  currentDeductible: number
  currentOutOfPocket: number
}

interface HealthProfile {
  familySize: number
  annualVisits: {
    primaryCare: number
    specialist: number
    urgentCare: number
    emergencyRoom: number
  }
  prescriptions: {
    generic: number
    brand: number
    specialty: number
  }
  diagnosticTests: number
  imaging: number
}

interface PolicyGrade {
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  score: number
  estimatedAnnualCost: number
  reasoning: string
  color: string
}

// Default health profile for family of 2
const DEFAULT_HEALTH_PROFILE: HealthProfile = {
  familySize: 2,
  annualVisits: {
    primaryCare: 4, // 2 visits per person
    specialist: 2, // 1 per person
    urgentCare: 1,
    emergencyRoom: 0
  },
  prescriptions: {
    generic: 1,
    brand: 0,
    specialty: 0
  },
  diagnosticTests: 2, // Basic annual labs
  imaging: 0
}

// Mock function for category analysis
async function analyzeCareCategory(input: CategoryAnalysisInput): Promise<CategoryAnalysisResult> {
  // This is a mock implementation for testing
  return {
    category: input.searchTerm,
    description: `Analysis of ${input.searchTerm} coverage across your policies.`,
    relatedServices: [],
    suggestedSubcategories: [],
    policyGrades: input.policies.map(policy => ({
      policyName: policy.plan_summary.plan_name,
      grade: 'C' as const,
      reasoning: 'Analysis temporarily unavailable',
      estimatedCost: 'Contact provider',
      coverageHighlights: ['Review policy documents'],
      costFactors: ['Unable to analyze']
    })),
    overallInsights: ['Analysis temporarily unavailable - please try again or contact your insurance provider']
  }
}

// Predefined medical categories and their subcategories
const MEDICAL_CATEGORIES = {
  "Imaging": ["CT Scan", "MRI", "X-Ray", "Ultrasound", "PET Scan", "Mammography"],
  "Emergency Care": ["Emergency Room Visit", "Emergency Surgery", "Ambulance", "Urgent Care"],
  "Primary Care": ["Routine Visit", "Physical Exam", "Sick Visit", "Preventive Care"],
  "Specialist Care": ["Cardiology", "Dermatology", "Orthopedics", "Neurology", "Oncology"],
  "Mental Health": ["Therapy Session", "Psychiatrist Visit", "Inpatient Mental Health", "Substance Abuse Treatment"],
  "Surgery": ["Outpatient Surgery", "Inpatient Surgery", "Anesthesia", "Surgeon Fees"],
  "Prescriptions": ["Generic Drugs", "Brand Name Drugs", "Specialty Drugs", "Preferred Drugs"],
  "Diagnostic Tests": ["Blood Work", "Lab Tests", "Biopsy", "Pathology"],
  "Maternity": ["Prenatal Care", "Delivery", "Postpartum Care", "Newborn Care"],
  "Rehabilitation": ["Physical Therapy", "Occupational Therapy", "Speech Therapy", "Chiropractic Care"]
}

function PolicyDetailModal({ policy, open, onOpenChange }: PolicyDetailModalProps) {
  const servicesNotCovered = policy.services_you_may_need.filter(service => 
    service.what_you_will_pay.network_provider.toLowerCase().includes('not covered') ||
    service.what_you_will_pay.network_provider.toLowerCase().includes('no coverage')
  )

  const commonServices = policy.services_you_may_need.filter(service => 
    ['primary care', 'specialist', 'emergency', 'urgent care', 'diagnostic', 'generic drugs'].some(type =>
      service.name.toLowerCase().includes(type)
    )
  )

  const otherServices = policy.services_you_may_need.filter(service => 
    !commonServices.includes(service) && !servicesNotCovered.includes(service)
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{policy.plan_summary.plan_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* What You'll Pay for Common Services */}
          <section>
            <h3 className="font-semibold text-lg mb-3">What You'll Pay for Common Services</h3>
            <div className="space-y-2">
              {commonServices.map((service, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">In-Network: </span>
                    {service.what_you_will_pay.network_provider}
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">Out-of-Network: </span>
                    {service.what_you_will_pay.out_of_network_provider}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Services This Plan Does Not Cover */}
          {servicesNotCovered.length > 0 && (
            <section>
              <h3 className="font-semibold text-lg mb-3">Services This Plan Does Not Cover</h3>
              <div className="space-y-2">
                {servicesNotCovered.map((service, index) => (
                  <div key={index} className="flex items-center gap-2 py-1">
                    <Badge variant="destructive" className="text-xs">Not Covered</Badge>
                    <span className="text-sm">{service.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Other Covered Services */}
          <section>
            <h3 className="font-semibold text-lg mb-3">Other Covered Services</h3>
            <div className="space-y-2">
              {otherServices.map((service, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-sm">
                    <span className="text-green-600 font-medium">In-Network: </span>
                    {service.what_you_will_pay.network_provider}
                  </div>
                  <div className="text-sm">
                    <span className="text-red-600 font-medium">Out-of-Network: </span>
                    {service.what_you_will_pay.out_of_network_provider}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function extractCostNumber(costString: string): number {
  const lowerCost = costString.toLowerCase()
  
  // Not covered = very high cost
  if (lowerCost.includes('not covered') || lowerCost.includes('no coverage')) return 10000
  
  // Free/no charge = 0
  if (lowerCost.includes('no charge') || lowerCost.includes('free')) return 0
  
  // Extract dollar amount
  const match = costString.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ''));
  }
  
  // Percentage copay - estimate based on average service cost
  if (lowerCost.includes('%')) {
    const percentMatch = costString.match(/(\d+)%/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      return (percent / 100) * 300; // Assume $300 average service cost
    }
  }
  
  return 200; // Default estimate for unclear pricing
}

function calculatePolicyGrade(policy: SBCData, healthProfile: HealthProfile = DEFAULT_HEALTH_PROFILE): PolicyGrade {
  let totalAnnualCost = 0
  
  // Monthly premium (estimated - not in SBC, use $400/month average for family)
  const estimatedMonthlyPremium = 400
  totalAnnualCost += estimatedMonthlyPremium * 12
  
  // Deductible impact
  const deductible = policy.important_questions.overall_deductible.in_network.individual
  const familyDeductible = policy.important_questions.overall_deductible.in_network.family
  const relevantDeductible = healthProfile.familySize > 1 ? familyDeductible : deductible
  
  // Calculate expected medical costs
  let expectedMedicalCosts = 0
  
  // Primary care visits
  const primaryCareService = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes('primary care')
  )
  if (primaryCareService) {
    const costPerVisit = extractCostNumber(primaryCareService.what_you_will_pay.network_provider)
    expectedMedicalCosts += costPerVisit * healthProfile.annualVisits.primaryCare
  }
  
  // Specialist visits
  const specialistService = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes('specialist')
  )
  if (specialistService) {
    const costPerVisit = extractCostNumber(specialistService.what_you_will_pay.network_provider)
    expectedMedicalCosts += costPerVisit * healthProfile.annualVisits.specialist
  }
  
  // Generic prescriptions
  const genericService = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes('generic')
  )
  if (genericService) {
    const costPerFill = extractCostNumber(genericService.what_you_will_pay.network_provider)
    expectedMedicalCosts += costPerFill * healthProfile.prescriptions.generic * 12 // Monthly fills
  }
  
  // Diagnostic tests
  const diagnosticService = policy.services_you_may_need.find(s => 
    s.name.toLowerCase().includes('diagnostic')
  )
  if (diagnosticService) {
    const costPerTest = extractCostNumber(diagnosticService.what_you_will_pay.network_provider)
    expectedMedicalCosts += costPerTest * healthProfile.diagnosticTests
  }
  
  // Apply deductible
  const deductiblePayment = Math.min(expectedMedicalCosts, relevantDeductible)
  totalAnnualCost += deductiblePayment
  
  // After deductible costs (simplified - assume coinsurance continues)
  const afterDeductibleCosts = Math.max(0, expectedMedicalCosts - relevantDeductible) * 0.2 // 20% coinsurance estimate
  totalAnnualCost += afterDeductibleCosts
  
  // Cap at out-of-pocket maximum
  const outOfPocketMax = healthProfile.familySize > 1 
    ? policy.important_questions.out_of_pocket_limit_for_plan.in_network.family
    : policy.important_questions.out_of_pocket_limit_for_plan.in_network.individual
  
  const medicalOutOfPocket = Math.min(deductiblePayment + afterDeductibleCosts, outOfPocketMax)
  totalAnnualCost = estimatedMonthlyPremium * 12 + medicalOutOfPocket
  
  // Grade based on total annual cost
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
  let color = ''
  let reasoning = ''
  
  if (totalAnnualCost <= 8000) {
    grade = 'A'
    color = 'bg-green-500'
    reasoning = 'Excellent value with low out-of-pocket costs'
  } else if (totalAnnualCost <= 12000) {
    grade = 'B'
    color = 'bg-blue-500'
    reasoning = 'Good value for typical healthcare needs'
  } else if (totalAnnualCost <= 16000) {
    grade = 'C'
    color = 'bg-yellow-500'
    reasoning = 'Average costs, manageable for most families'
  } else if (totalAnnualCost <= 20000) {
    grade = 'D'
    color = 'bg-orange-500'
    reasoning = 'High costs may strain budget'
  } else {
    grade = 'F'
    color = 'bg-red-500'
    reasoning = 'Very expensive, significant financial burden'
  }
  
  const score = Math.max(0, Math.min(100, 100 - ((totalAnnualCost - 6000) / 200)))
  
  return {
    grade,
    score: Math.round(score),
    estimatedAnnualCost: Math.round(totalAnnualCost),
    reasoning,
    color
  }
}

function AnalysisConfigForm({ 
  onAnalyze,
  healthProfile,
  policies,
  isAnalyzing,
  analysisResults,
  results
}: { 
  onAnalyze: (config: AnalysisConfig, useEnhanced: boolean) => void 
  healthProfile: any[]
  policies: SBCData[]
  isAnalyzing: boolean
  analysisResults?: PolicyAnalysis[]
  results: ProcessSBCResponse
}) {
  const [networkType, setNetworkType] = useState<'in-network' | 'out-of-network'>('in-network')
  const [useEnhancedAnalysis, setUseEnhancedAnalysis] = useState(false)
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'config' | 'pricing' | 'analysis'>('config')
  const [pricingData, setPricingData] = useState<PricingRetrievalResult[]>([])
  const [isRetrievingPricing, setIsRetrievingPricing] = useState(false)
  
  // Editable usage values - initialized from health profile
  const [editableUsage, setEditableUsage] = useState<any[]>([])
  
  // Get all unique services from policies for dropdown options
  const availableServices = React.useMemo(() => {
    const servicesSet = new Set<string>()
    policies.forEach(policy => {
      policy.services_you_may_need.forEach(service => {
        servicesSet.add(service.name)
      })
    })
    return Array.from(servicesSet).sort()
  }, [policies])
  

  const handleRetrievePricing = async () => {
    const config: AnalysisConfig = {
      currentDeductible: 0,
      currentOutOfPocket: 0,
      networkType
    }
    
    setIsRetrievingPricing(true)
    try {
      // Use edited usage values if available, otherwise use original health profile
      let effectiveHealthProfile = healthProfile
      if (editableUsage.length > 0) {
        effectiveHealthProfile = healthProfile.map((member, index) => {
          const editedMember = editableUsage[index]
          if (editedMember?.editable) {
            // Create synthetic visits based on edited values
            const syntheticVisits = []
            if (editedMember.editable.primaryCareVisits > 0) {
              syntheticVisits.push({ name: 'Primary Care Visit', frequency: `${editedMember.editable.primaryCareVisits}/year` })
            }
            if (editedMember.editable.specialistVisits > 0) {
              syntheticVisits.push({ name: 'Specialist Visit', frequency: `${editedMember.editable.specialistVisits}/year` })
            }
            if (editedMember.editable.diagnosticTests > 0) {
              syntheticVisits.push({ name: 'Diagnostic Test', frequency: `${editedMember.editable.diagnosticTests}/year` })
            }
            if (editedMember.editable.medicationFills > 0) {
              syntheticVisits.push({ name: 'Medication Fill', frequency: `${editedMember.editable.medicationFills}/year` })
            }
            
            // Add other services
            editedMember.otherServices.forEach((service: any) => {
              syntheticVisits.push({ name: service.name, frequency: `${service.frequency}/year` })
            })
            
            return {
              ...member,
              visits: [...member.visits, ...syntheticVisits]
            }
          }
          return member
        })
      }
      
      const pricing = await retrievePricingForAnalysis(policies, effectiveHealthProfile, config)
      setPricingData(pricing)
      setCurrentStep('pricing')
    } catch (error) {
      console.error('Failed to retrieve pricing:', error)
      alert('Failed to retrieve pricing. Please try again.')
    } finally {
      setIsRetrievingPricing(false)
    }
  }


  const handleRunAnalysis = () => {
    const config: AnalysisConfig = {
      currentDeductible: 0,
      currentOutOfPocket: 0,
      networkType
    }
    onAnalyze(config, useEnhancedAnalysis)
    setCurrentStep('analysis')
  }

  const handleBackToConfig = () => {
    setCurrentStep('config')
    setPricingData([])
  }

  // Calculate what will be analyzed for each member based on age and health profile
  const calculateExpectedUsage = () => {
    return healthProfile.map((member, index) => {
      const age = member.age || 25 // Default to adult if age not specified
      
      // Age-based healthcare utilization patterns
      let basePrimaryCareVisits = 2 // Default adult baseline
      let baseDiagnosticTests = 1 // Default adult baseline
      
      // Adjust based on age groups following medical best practices
      if (age < 2) {
        // Infants (0-2): Frequent well-child visits, immunizations
        basePrimaryCareVisits = 8 // Monthly for first year, then quarterly
        baseDiagnosticTests = 3 // Multiple screenings, hearing, vision, development
      } else if (age < 6) {
        // Early childhood (2-6): Regular well-child visits, school prep
        basePrimaryCareVisits = 4 // Quarterly visits
        baseDiagnosticTests = 2 // Annual screenings plus additional as needed
      } else if (age < 13) {
        // School age (6-13): Annual physicals, sports physicals
        basePrimaryCareVisits = 2 // Annual well-child + sick visits
        baseDiagnosticTests = 1 // Annual screenings
      } else if (age < 18) {
        // Adolescent (13-18): Sports physicals, mental health, puberty care
        basePrimaryCareVisits = 2 // Annual physical + additional care
        baseDiagnosticTests = 1 // Annual screenings
      } else if (age < 30) {
        // Young adult (18-30): Basic preventive care
        basePrimaryCareVisits = 1 // Many young adults skip annual visits
        baseDiagnosticTests = 1 // Basic annual screening
      } else if (age < 40) {
        // Adult (30-40): Preventive care becomes more important
        basePrimaryCareVisits = 2 // Annual physical + occasional sick visits
        baseDiagnosticTests = 1 // Annual screenings
      } else if (age < 50) {
        // Middle age (40-50): Increased screening, early chronic disease detection
        basePrimaryCareVisits = 2 // Annual physical + follow-ups
        baseDiagnosticTests = 2 // More comprehensive screenings
      } else if (age < 65) {
        // Pre-senior (50-65): Cancer screenings, cardiovascular monitoring
        basePrimaryCareVisits = 3 // More frequent monitoring
        baseDiagnosticTests = 3 // Colonoscopy, mammograms, etc.
      } else if (age < 75) {
        // Senior (65-75): Regular monitoring, Medicare wellness visits
        basePrimaryCareVisits = 4 // Quarterly check-ins
        baseDiagnosticTests = 3 // Regular screenings and monitoring
      } else {
        // Elderly (75+): Frequent monitoring, fall prevention, chronic disease management
        basePrimaryCareVisits = 6 // More frequent visits for safety and health
        baseDiagnosticTests = 4 // Comprehensive monitoring
      }
      
      // Add condition-based visits on top of age-appropriate baseline
      const primaryCareVisits = basePrimaryCareVisits + member.conditions.length
      
      // Specialist visits: age-adjusted baseline plus condition-driven needs
      let specialistVisits = member.conditions.length
      if (age >= 50) {
        specialistVisits += 1 // Likely to see at least one specialist annually (cardio, eye, etc.)
      }
      if (age >= 65) {
        specialistVisits += 1 // Additional specialists for senior care
      }
      
      const medicationFills = member.medications.length * 12
      const diagnosticTests = baseDiagnosticTests + Math.floor(member.conditions.length / 2)
      
      return {
        memberIndex: index,
        primaryCareVisits,
        specialistVisits,
        medicationFills,
        diagnosticTests,
        plannedVisits: member.visits,
        conditions: member.conditions,
        medications: member.medications
      }
    })
  }

  const expectedUsage = healthProfile.length > 0 ? calculateExpectedUsage() : []
  
  // Initialize editable usage when health profile changes
  React.useEffect(() => {
    if (healthProfile.length > 0 && editableUsage.length === 0) {
      const initialUsage = calculateExpectedUsage()
      setEditableUsage(initialUsage.map((member, index) => ({
        ...member,
        editable: {
          primaryCareVisits: member.primaryCareVisits,
          specialistVisits: member.specialistVisits,
          medicationFills: member.medicationFills,
          diagnosticTests: member.diagnosticTests
        },
        otherServices: healthProfile[index]?.otherServices || []
      })))
    }
  }, [healthProfile])
  
  // Update a specific member's usage
  const updateMemberUsage = (memberIndex: number, field: string, value: number) => {
    setEditableUsage(prev => prev.map((member, index) => 
      index === memberIndex 
        ? { ...member, editable: { ...member.editable, [field]: Math.max(0, value) } }
        : member
    ))
  }
  
  // Add other service to a member
  const addOtherService = (memberIndex: number, serviceName: string, frequency: number) => {
    if (!serviceName.trim() || frequency <= 0) return
    
    setEditableUsage(prev => prev.map((member, index) => {
      if (index === memberIndex) {
        // Check if service already exists
        const existingService = member.otherServices.find((s: any) => s.name === serviceName)
        if (existingService) return member
        
        return {
          ...member,
          otherServices: [...member.otherServices, { name: serviceName, frequency }]
        }
      }
      return member
    }))
  }
  
  // Remove other service from a member
  const removeOtherService = (memberIndex: number, serviceName: string) => {
    setEditableUsage(prev => prev.map((member, index) => 
      index === memberIndex 
        ? { ...member, otherServices: member.otherServices.filter((s: any) => s.name !== serviceName) }
        : member
    ))
  }
  
  // Update other service frequency
  const updateOtherServiceFrequency = (memberIndex: number, serviceName: string, frequency: number) => {
    setEditableUsage(prev => prev.map((member, index) => 
      index === memberIndex 
        ? {
            ...member,
            otherServices: member.otherServices.map((s: any) => 
              s.name === serviceName ? { ...s, frequency: Math.max(0, frequency) } : s
            )
          }
        : member
    ))
  }
  
  // Reset to health profile defaults
  const resetToDefaults = () => {
    const initialUsage = calculateExpectedUsage()
    setEditableUsage(initialUsage.map((member, index) => ({
      ...member,
      editable: {
        primaryCareVisits: member.primaryCareVisits,
        specialistVisits: member.specialistVisits,
        medicationFills: member.medicationFills,
        diagnosticTests: member.diagnosticTests
      },
      otherServices: healthProfile[index]?.otherServices || []
    })))
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-blue-900">Cost Analysis Steps</h3>
              <div className="flex gap-2">
                <Badge variant={currentStep === 'config' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                  {currentStep === 'config' ? '→' : '✓'} 1. Configure
                </Badge>
                <Badge variant={currentStep === 'pricing' ? 'default' : currentStep === 'analysis' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
                  {currentStep === 'pricing' ? '→' : currentStep === 'analysis' ? '✓' : ''} 2. Review Pricing
                </Badge>
                <Badge variant={currentStep === 'analysis' ? 'default' : 'outline'} className="text-sm px-3 py-1">
                  {currentStep === 'analysis' ? '→' : ''} 3. Results
                </Badge>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-2">
              {currentStep === 'pricing' && (
                <>
                  <Button variant="outline" onClick={handleBackToConfig}>
                    ← Back to Configure
                  </Button>
                  <Button onClick={handleRunAnalysis} disabled={isAnalyzing} className="bg-green-600 hover:bg-green-700">
                    {isAnalyzing ? 'Running Analysis...' : 'Run Analysis →'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentStep === 'config' && 'Step 1: Configure Analysis'}
            {currentStep === 'pricing' && 'Step 2: Review Retrieved Pricing'}
            {currentStep === 'analysis' && 'Step 3: Analysis Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 'config' && (
            <>
              {/* Network Type Selection */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Network Type</h4>
                    <p className="text-xs text-gray-600">Choose whether to analyze costs for in-network or out-of-network providers</p>
                  </div>
                  <Select value={networkType} onValueChange={(value: 'in-network' | 'out-of-network') => setNetworkType(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-network">In-Network</SelectItem>
                      <SelectItem value="out-of-network">Out-of-Network</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Configuration inputs */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <Button 
                onClick={handleRetrievePricing} 
                className="px-8"
                disabled={isRetrievingPricing || healthProfile.length === 0}
              >
                {isRetrievingPricing ? 'Retrieving Pricing...' : 'Retrieve Pricing'}
              </Button>
            </div>
          </div>

          {/* Editable usage configuration */}
          {healthProfile.length > 0 && editableUsage.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Configure Healthcare Usage for Analysis:</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetToDefaults}
                  className="text-xs"
                >
                  Reset to Profile Defaults
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {editableUsage.map((member, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-gray-50">
                    <div className="font-medium text-sm mb-3">
                      {healthProfile[index]?.name || (index === 0 ? 'Primary Member' : `Member ${index + 1}`)}
                      {healthProfile[index]?.age && (
                        <span className="text-xs text-gray-600 ml-2">(Age {healthProfile[index].age})</span>
                      )}
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div>
                        <Label htmlFor={`primary-${index}`} className="text-xs font-medium">Primary Care Visits/year</Label>
                        <Input
                          id={`primary-${index}`}
                          type="number"
                          min="0"
                          max="50"
                          value={member.editable.primaryCareVisits}
                          onChange={(e) => updateMemberUsage(index, 'primaryCareVisits', parseInt(e.target.value) || 0)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`specialist-${index}`} className="text-xs font-medium">Specialist Visits/year</Label>
                        <Input
                          id={`specialist-${index}`}
                          type="number"
                          min="0"
                          max="50"
                          value={member.editable.specialistVisits}
                          onChange={(e) => updateMemberUsage(index, 'specialistVisits', parseInt(e.target.value) || 0)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`medication-${index}`} className="text-xs font-medium">Medication Fills/year</Label>
                        <Input
                          id={`medication-${index}`}
                          type="number"
                          min="0"
                          max="500"
                          value={member.editable.medicationFills}
                          onChange={(e) => updateMemberUsage(index, 'medicationFills', parseInt(e.target.value) || 0)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`diagnostic-${index}`} className="text-xs font-medium">Diagnostic Tests/year</Label>
                        <Input
                          id={`diagnostic-${index}`}
                          type="number"
                          min="0"
                          max="50"
                          value={member.editable.diagnosticTests}
                          onChange={(e) => updateMemberUsage(index, 'diagnosticTests', parseInt(e.target.value) || 0)}
                          className="h-7 text-xs mt-1"
                        />
                      </div>
                      
                      {/* Other Services Section */}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-medium">Other Services</Label>
                        </div>
                        
                        {/* Existing other services */}
                        {member.otherServices.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {member.otherServices.map((service: any, serviceIndex: number) => (
                              <div key={serviceIndex} className="flex items-center gap-2 p-2 bg-white rounded border">
                                <div className="flex-1 text-xs font-medium truncate">
                                  {service.name}
                                </div>
                                <Input
                                  type="number"
                                  min="0"
                                  max="365"
                                  value={service.frequency}
                                  onChange={(e) => updateOtherServiceFrequency(index, service.name, parseInt(e.target.value) || 0)}
                                  className="h-6 w-16 text-xs"
                                />
                                <span className="text-xs text-gray-500">/yr</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOtherService(index, service.name)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add new service */}
                        <AddOtherServiceForm
                          memberIndex={index}
                          availableServices={availableServices}
                          existingServices={member.otherServices.map((s: any) => s.name)}
                          onAdd={addOtherService}
                        />
                      </div>
                      
                      {/* Show health profile context */}
                      {(member.conditions.length > 0 || member.medications.length > 0 || member.plannedVisits.length > 0) && (
                        <div className="border-t pt-2 mt-2">
                          <div className="text-gray-600 mb-2 font-medium">From Health Profile:</div>
                          
                          {member.conditions.length > 0 && (
                            <div className="mb-2">
                              <div className="text-gray-600 mb-1">Conditions:</div>
                              <div className="flex flex-wrap gap-1">
                                {member.conditions.map((condition: string, condIndex: number) => (
                                  <Badge key={condIndex} variant="outline" className="text-xs">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {member.medications.length > 0 && (
                            <div className="mb-2">
                              <div className="text-gray-600 mb-1">Medications:</div>
                              <div className="flex flex-wrap gap-1">
                                {member.medications.map((med: string, medIndex: number) => (
                                  <Badge key={medIndex} variant="outline" className="text-xs">
                                    {med}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {member.plannedVisits.length > 0 && (
                            <div>
                              <div className="text-gray-600 mb-1">Planned Visits:</div>
                              {member.plannedVisits.map((visit: any, visitIndex: number) => (
                                <div key={visitIndex} className="flex justify-between ml-2 text-xs">
                                  <span>{visit.name}:</span>
                                  <span className="font-medium">{visit.frequency}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <div className="font-medium text-blue-900 mb-1">How This Works:</div>
                  <div className="text-blue-800 space-y-1">
                    <div>• <strong>Default values:</strong> Based on age, conditions, and medications from your health profile</div>
                    <div>• <strong>Customize as needed:</strong> Adjust numbers based on your expected healthcare usage</div>
                    <div>• <strong>Cost calculation:</strong> Uses these numbers with policy rates + deductibles/coinsurance</div>
                    <div>• <strong>Tip:</strong> Include routine care, condition management, and any planned procedures</div>
                  </div>
                </div>
              </div>
            </div>
          )}

              {healthProfile.length === 0 && (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 mb-3">
                    Set up your health profile to see personalized cost analysis.
                  </p>
                  <Button asChild variant="outline">
                    <a href="/health-profile">Set Up Health Profile</a>
                  </Button>
                </div>
              )}
            </>
          )}

          {currentStep === 'pricing' && (
            <>
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  <strong>✓ Pricing Retrieved Successfully!</strong> Review the costs below, then click "Run Analysis" at the top to continue.
                </p>
              </div>
              
              {pricingData.map((policyPricing, policyIndex) => (
                <div key={policyIndex} className="mb-8">
                  <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2">
                      {policies[policyIndex].plan_summary.plan_name}
                    </h4>
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Cost Sources:</span> {policyPricing.policyBasedServices} from policy, {policyPricing.marketBasedServices} from research, {policyPricing.percentageBasedServices} calculated
                    </div>
                  </div>
                  
                  {/* Simple member-by-member breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(pricingData[policyIndex].services.map(s => s.memberIndex))).map(memberIndex => {
                      const memberServices = pricingData[policyIndex].services.filter(s => s.memberIndex === memberIndex)
                      const memberTotal = memberServices.reduce((sum, service) => sum + (service.recommendedCost * service.frequency), 0)
                      
                      return (
                        <Card key={memberIndex} className="border-2">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                              {memberIndex === 0 ? 'Primary Member' : `Member ${memberIndex + 1}`}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 pt-0">
                            {memberServices.map((service, serviceIndex) => {
                              const serviceName = service.serviceName
                                .replace('primary care', 'Primary Care')
                                .replace('specialist', 'Specialist')
                                .replace('generic drugs', 'Medications')
                                .replace('diagnostic tests', 'Diagnostic Tests')
                              
                              return (
                                <div key={serviceIndex} className="flex justify-between items-center py-1">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{serviceName}</div>
                                    <div className="text-xs text-gray-600">
                                      {service.frequency}× per year at ${service.recommendedCost} each = ${(service.recommendedCost * service.frequency).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            
                            <div className="border-t pt-2 mt-3 bg-blue-50 -mx-6 px-6 py-3 rounded-b-lg">
                              <div className="flex justify-between items-center font-bold text-blue-900">
                                <span>Annual Total:</span>
                                <span className="text-lg">${memberTotal.toLocaleString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
              
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-blue-800 mb-3">
                  <strong>Ready to continue?</strong> These cost estimates will be used to calculate your total projected expenses including deductibles and insurance coverage.
                </p>
                <p className="text-sm text-blue-600">
                  Click "Run Analysis" at the top to see your final cost projections and policy grades.
                </p>
              </div>
            </>
          )}

          {currentStep === 'analysis' && (
            <>
              {analysisResults && analysisResults.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium mb-2">✅ Analysis Complete!</p>
                    <p className="text-green-700 text-sm">
                      Your personalized cost analysis has been calculated based on your health profile and the pricing data we retrieved.
                    </p>
                    <div className="mt-3">
                      <Badge variant={networkType === 'in-network' ? 'default' : 'secondary'} className="text-sm">
                        {networkType === 'in-network' ? '🏥 In-Network' : '🌐 Out-of-Network'} Provider Costs
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {analysisResults.map((analysis, index) => {
                      // Find the corresponding policy from the policies array
                      const policy = policies[index]
                      if (!policy) return null
                      
                      return (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="bg-gray-50">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{policy.plan_summary.plan_name}</CardTitle>
                              <div className="flex items-center gap-3">
                                <div className={`rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold ${
                                  analysis.grade === 'A' ? 'bg-green-500 text-white' :
                                  analysis.grade === 'B' ? 'bg-blue-500 text-white' :
                                  analysis.grade === 'C' ? 'bg-yellow-500 text-white' :
                                  analysis.grade === 'D' ? 'bg-orange-500 text-white' :
                                  'bg-red-500 text-white'
                                }`}>
                                  {analysis.grade}
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-green-600">
                                    ${analysis.estimatedAnnualCost.toLocaleString()}
                                  </div>
                                  <div className="text-sm text-gray-600">Estimated Annual Cost</div>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-2">
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {analysis.memberBreakdowns.map((member, memberIndex) => (
                                  <div key={memberIndex} className="bg-gray-50 rounded-lg p-4">
                                    <h4 className="font-medium mb-3">
                                      {healthProfile[memberIndex]?.name || `Member ${memberIndex + 1}`}
                                    </h4>
                                    
                                    {/* Show medication tier costs if member has medications */}
                                    {member.medications.count > 0 && member.medicationDetails && member.medicationDetails.length > 0 && (
                                      <div className="mb-3 p-3 bg-purple-100 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Pill className="w-4 h-4 text-purple-700" />
                                          <span className="text-sm font-medium text-purple-900">Medication Coverage</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          {(() => {
                                            const genericService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('generic'))
                                            const brandService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('brand') && !s.name.toLowerCase().includes('non-preferred'))
                                            const nonPreferredService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('non-preferred'))
                                            const specialtyService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('specialty'))
                                            
                                            return (
                                              <>
                                                {genericService && (
                                                  <div className="flex justify-between">
                                                    <span className="text-purple-700">Generic:</span>
                                                    <span className="font-medium text-purple-900">
                                                      {networkType === 'in-network' 
                                                        ? genericService.what_you_will_pay.network_provider 
                                                        : genericService.what_you_will_pay.out_of_network_provider}
                                                    </span>
                                                  </div>
                                                )}
                                                {brandService && (
                                                  <div className="flex justify-between">
                                                    <span className="text-purple-700">Preferred:</span>
                                                    <span className="font-medium text-purple-900">
                                                      {networkType === 'in-network' 
                                                        ? brandService.what_you_will_pay.network_provider 
                                                        : brandService.what_you_will_pay.out_of_network_provider}
                                                    </span>
                                                  </div>
                                                )}
                                                {nonPreferredService && (
                                                  <div className="flex justify-between">
                                                    <span className="text-purple-700">Non-Pref:</span>
                                                    <span className="font-medium text-purple-900">
                                                      {networkType === 'in-network' 
                                                        ? nonPreferredService.what_you_will_pay.network_provider 
                                                        : nonPreferredService.what_you_will_pay.out_of_network_provider}
                                                    </span>
                                                  </div>
                                                )}
                                                {specialtyService && (
                                                  <div className="flex justify-between">
                                                    <span className="text-purple-700">Specialty:</span>
                                                    <span className="font-medium text-purple-900">
                                                      {networkType === 'in-network' 
                                                        ? specialtyService.what_you_will_pay.network_provider 
                                                        : specialtyService.what_you_will_pay.out_of_network_provider}
                                                    </span>
                                                  </div>
                                                )}
                                              </>
                                            )
                                          })()}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="space-y-2">
                                      {member.primaryCareVisits.count > 0 && (
                                        <div className="flex justify-between text-sm">
                                          <span>Primary Care ({member.primaryCareVisits.count}× per year)</span>
                                          <span className="font-medium">${member.primaryCareVisits.total}</span>
                                        </div>
                                      )}
                                      {member.specialistVisits.count > 0 && (
                                        <div className="flex justify-between text-sm">
                                          <span>Specialist ({member.specialistVisits.count}× per year)</span>
                                          <span className="font-medium">${member.specialistVisits.total}</span>
                                        </div>
                                      )}
                                      {member.medications.count > 0 && (
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-sm font-medium">
                                            <span>Medications ({member.medications.count} fills per year)</span>
                                            <span>${member.medications.total}</span>
                                          </div>
                                          {member.medicationDetails && member.medicationDetails.length > 0 && (
                                            <div className="ml-4 space-y-2 mt-2">
                                              {member.medicationDetails.map((med: any, medIndex: number) => (
                                                <div key={medIndex} className="flex items-center justify-between">
                                                  <div className="flex items-center gap-2">
                                                    <Pill className="w-3 h-3 text-gray-400" />
                                                    <span className="text-xs text-gray-700">{med.name}</span>
                                                    <Badge 
                                                      className={`text-xs px-1.5 py-0 h-5 ${getCategoryColor(med.category)}`}
                                                    >
                                                      {med.categoryDisplay}
                                                    </Badge>
                                                  </div>
                                                  <span className="text-xs font-medium">${med.annualCost}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {member.diagnosticTests.count > 0 && (
                                        <div className="flex justify-between text-sm">
                                          <span>Diagnostic Tests ({member.diagnosticTests.count}× per year)</span>
                                          <span className="font-medium">${member.diagnosticTests.total}</span>
                                        </div>
                                      )}
                                      {member.plannedVisits.map((visit, visitIndex) => (
                                        <div key={visitIndex} className="flex justify-between text-sm">
                                          <span>{visit.name} ({visit.frequency}× per year)</span>
                                          <span className="font-medium">${visit.total}</span>
                                        </div>
                                      ))}
                                      <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-medium">
                                          <span>Member Total:</span>
                                          <span>${member.memberTotal}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t pt-4">
                                <h4 className="font-medium mb-3">Cost Breakdown</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>Total Medical Costs:</span>
                                      <span>${analysis.breakdown.totalMedicalCosts.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Deductible Applied:</span>
                                      <span>-${analysis.breakdown.deductibleApplied.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Coinsurance (20%):</span>
                                      <span>${analysis.breakdown.coinsuranceApplied.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>Annual Premiums:</span>
                                      <span>${analysis.breakdown.premiums.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Final Medical Costs:</span>
                                      <span>${analysis.breakdown.finalMedicalCosts.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between font-bold border-t pt-1">
                                      <span>Total Annual Cost:</span>
                                      <span className="text-green-600">${analysis.estimatedAnnualCost.toLocaleString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setCurrentStep('config')}>
                      ← Back to Configuration
                    </Button>
                  </div>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-700">Running personalized analysis...</span>
                  </div>
                  <p className="text-gray-600 text-sm">This may take a few moments while we calculate your costs.</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No analysis results available. Please run the analysis first.</p>
                  <Button variant="outline" onClick={() => setCurrentStep('config')} className="mt-4">
                    ← Back to Configuration
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  )
}

function PolicyComparisonTable({ 
  policiesWithResults,
  analysisResults,
  networkType = 'in-network'
}: { 
  policiesWithResults: Array<{ policy: SBCData, result: any }>
  analysisResults?: PolicyAnalysis[]
  networkType?: 'in-network' | 'out-of-network'
}) {
  const [selectedModal, setSelectedModal] = useState<SBCData | null>(null)

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white'
      case 'B': return 'bg-blue-500 text-white'
      case 'C': return 'bg-yellow-500 text-white'
      case 'D': return 'bg-orange-500 text-white'
      case 'F': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4 font-semibold text-gray-900 w-40">Policy</th>
              {policiesWithResults.map(({ policy, result }, index) => (
                <th key={index} className="text-left p-4 font-medium text-gray-900 min-w-64">
                  <div className="space-y-2 relative">
                    <div className="flex flex-row xl:flex-col items-start  gap-1">
                      <div className="text-sm font-semibold line-clamp-1 max-w-48" title={policy.plan_summary.plan_name}>{policy.plan_summary.plan_name}</div>
                      <Badge variant="outline" className="hidden xl:flex w-fit text-xs">{policy.plan_summary.issuer_name} &bull; {policy.plan_summary.plan_type}</Badge>
                    </div>
                    {/* <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="w-fit text-xs">{policy.plan_summary.coverage_for}</Badge>
                    </div> */}
                    <div className="absolute right-0 -top-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs h-7">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem 
                            onClick={() => setSelectedModal(policy)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {result.pdfUrl && (
                            <DropdownMenuItem 
                              onClick={() => window.open(result.pdfUrl, '_blank')}
                              className="text-xs"
                            >
                              <FileText className="h-3 w-3 mr-2" />
                              View PDF
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">Individual Deductible</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm font-medium">${policy.important_questions.overall_deductible.in_network.individual.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">Family Deductible</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm font-medium">${policy.important_questions.overall_deductible.in_network.family.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">Individual Out-of-Pocket Max</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm font-medium">${policy.important_questions.out_of_pocket_limit_for_plan.in_network.individual.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">Family Out-of-Pocket Max</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm font-medium">${policy.important_questions.out_of_pocket_limit_for_plan.in_network.family.toLocaleString()}</td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">In-Network Provider Savings</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm">
                  {policy.important_questions.network_provider_savings.lower_costs ? "Yes" : "No"}
                </td>
              ))}
            </tr>
            <tr className="border-t">
              <td className="p-2 text-sm font-medium text-gray-700 bg-gray-50">Referral Required for Specialist</td>
              {policiesWithResults.map(({ policy }, index) => (
                <td key={index} className="p-4 text-sm">
                  {policy.important_questions.need_referral_for_specialist_care.required ? "Yes" : "No"}
                </td>
              ))}
            </tr>
            
            {/* Analysis Section */}
            {analysisResults && analysisResults.length > 0 && (
              <>
                <tr className="border-t-2 border-gray-300">
                  <td className="p-2 font-semibold text-gray-900 bg-blue-50 text-lg" colSpan={policiesWithResults.length + 1}>
                    <div>
                      <div className="flex items-center gap-3">
                        <span>Personalized Analysis</span>
                        <Badge variant={networkType === 'in-network' ? 'default' : 'secondary'} className="text-xs font-normal">
                          {networkType === 'in-network' ? 'In-Network' : 'Out-of-Network'}
                        </Badge>
                      </div>
                      <div className="text-sm font-normal text-gray-600 mt-1">
                        Out-of-pocket costs only • Premium costs not included
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium text-gray-700 bg-gray-50">Relative Grade</td>
                  {policiesWithResults.map(({ policy }, index) => {
                    const analysis = analysisResults.find(a => a.policyName === policy.plan_summary.plan_name)
                    return (
                      <td key={index} className="p-2">
                        {analysis ? (
                          <Badge className={`text-lg font-bold px-3 py-1 ${getGradeColor(analysis.grade)}`}>
                            {analysis.grade}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-t">
                  <td className="p-2 font-medium text-gray-700 bg-gray-50">Estimated Annual Out-of-Pocket</td>
                  {policiesWithResults.map(({ policy }, index) => {
                    const analysis = analysisResults.find(a => a.policyName === policy.plan_summary.plan_name)
                    return (
                      <td key={index} className="p-4">
                        {analysis ? (
                          <span className="text-lg font-bold text-green-600">
                            ${analysis.breakdown.finalMedicalCosts.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-t">
                  <td className="p-4 font-medium text-gray-700 bg-gray-50">Out-of-Pocket Cost Breakdown</td>
                  {policiesWithResults.map(({ policy }, index) => {
                    const analysis = analysisResults.find(a => a.policyName === policy.plan_summary.plan_name)
                    return (
                      <td key={index} className="p-4">
                        {analysis ? (
                          <div className="text-xs space-y-3">
                            {/* Member-by-member breakdown */}
                            {analysis.memberBreakdowns.map((member, memberIndex) => (
                              <div key={memberIndex} className="border rounded p-2 bg-gray-50">
                                <div className="font-semibold text-gray-800 mb-1">
                                  {memberIndex === 0 ? 'Primary Member' : `Member ${memberIndex + 1}`}
                                </div>
                                
                                {/* Show medication tier costs if member has medications */}
                                {member.medications.count > 0 && member.medicationDetails && member.medicationDetails.length > 0 && (
                                  <div className="mb-2 p-2 bg-purple-50 rounded text-xs">
                                    <div className="font-medium text-purple-900 mb-1">Medication Tier Costs:</div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-purple-800">
                                      {(() => {
                                        const genericService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('generic'))
                                        const brandService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('brand') && !s.name.toLowerCase().includes('non-preferred'))
                                        const nonPreferredService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('non-preferred'))
                                        const specialtyService = policy.services_you_may_need.find(s => s.name.toLowerCase().includes('specialty'))
                                        
                                        return (
                                          <>
                                            {genericService && <div>Generic: {networkType === 'in-network' ? genericService.what_you_will_pay.network_provider : genericService.what_you_will_pay.out_of_network_provider}</div>}
                                            {brandService && <div>Brand: {networkType === 'in-network' ? brandService.what_you_will_pay.network_provider : brandService.what_you_will_pay.out_of_network_provider}</div>}
                                            {nonPreferredService && <div>Non-Pref: {networkType === 'in-network' ? nonPreferredService.what_you_will_pay.network_provider : nonPreferredService.what_you_will_pay.out_of_network_provider}</div>}
                                            {specialtyService && <div>Specialty: {networkType === 'in-network' ? specialtyService.what_you_will_pay.network_provider : specialtyService.what_you_will_pay.out_of_network_provider}</div>}
                                          </>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="space-y-1">
                                  {member.primaryCareVisits.count > 0 && (
                                    <div className="flex justify-between">
                                      <span>Primary Care ({member.primaryCareVisits.count}× ${member.primaryCareVisits.costPerVisit})</span>
                                      <span className="font-medium">${member.primaryCareVisits.total.toLocaleString()}</span>
                                    </div>
                                  )}
                                  
                                  {member.specialistVisits.count > 0 && (
                                    <div className="flex justify-between">
                                      <span>Specialist ({member.specialistVisits.count}× ${member.specialistVisits.costPerVisit})</span>
                                      <span className="font-medium">${member.specialistVisits.total.toLocaleString()}</span>
                                    </div>
                                  )}
                                  
                                  {member.medications.count > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between font-medium">
                                        <span>Medications ({member.medications.count} fills)</span>
                                        <span>${member.medications.total.toLocaleString()}</span>
                                      </div>
                                      {member.medicationDetails && member.medicationDetails.length > 0 && (
                                        <div className="ml-2 space-y-1 text-xs">
                                          {member.medicationDetails.map((med: any, medIndex: number) => (
                                            <div key={medIndex} className="flex items-center justify-between">
                                              <div className="flex items-center gap-1">
                                                <span className="text-gray-600">•</span>
                                                <span>{med.name}</span>
                                                <Badge className={`text-xs px-1 py-0 h-4 ${getCategoryColor(med.category)}`}>
                                                  {med.categoryDisplay}
                                                </Badge>
                                              </div>
                                              <span>${med.annualCost}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {member.diagnosticTests.count > 0 && (
                                    <div className="flex justify-between">
                                      <span>Diagnostic Tests ({member.diagnosticTests.count}× ${member.diagnosticTests.costPerTest})</span>
                                      <span className="font-medium">${member.diagnosticTests.total.toLocaleString()}</span>
                                    </div>
                                  )}
                                  
                                  {member.plannedVisits.map((visit, visitIndex) => (
                                    <div key={visitIndex} className="flex justify-between">
                                      <span>{visit.name} ({visit.frequency}× ${visit.costPerVisit})</span>
                                      <span className="font-medium">${visit.total.toLocaleString()}</span>
                                    </div>
                                  ))}
                                  
                                  <div className="border-t pt-1 mt-1 flex justify-between font-semibold">
                                    <span>Member Total:</span>
                                    <span>${member.memberTotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Overall calculation summary */}
                            <div className="border-t pt-2 space-y-1">
                              <div className="flex justify-between">
                                <span>Total Medical Costs:</span>
                                <span className="font-medium">${analysis.breakdown.totalMedicalCosts.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Deductible Applied:</span>
                                <span className="font-medium">-${analysis.breakdown.deductibleApplied.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Coinsurance (20%):</span>
                                <span className="font-medium">${analysis.breakdown.coinsuranceApplied.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between font-bold border-t pt-1">
                                <span>Total Out-of-Pocket:</span>
                                <span>${analysis.breakdown.finalMedicalCosts.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {selectedModal && (
        <PolicyDetailModal 
          policy={selectedModal} 
          open={!!selectedModal} 
          onOpenChange={() => setSelectedModal(null)} 
        />
      )}
    </>
  )
}

function CategorySearch({ 
  policies, 
  networkType 
}: { 
  policies: SBCData[]
  networkType: 'in-network' | 'out-of-network'
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<CategoryAnalysisResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [currentDeductible, setCurrentDeductible] = useState(0)
  const [currentOutOfPocket, setCurrentOutOfPocket] = useState(0)
  const [selectedService, setSelectedService] = useState<string | null>(null)

  // Get grade color styling matching personalized analysis
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-500 text-white'
      case 'B': return 'bg-blue-500 text-white'
      case 'C': return 'bg-yellow-500 text-white'
      case 'D': return 'bg-orange-500 text-white'
      case 'F': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setIsSearching(true)
    setSelectedService(null)
    
    try {
      const analysisInput: CategoryAnalysisInput = {
        searchTerm: searchTerm.trim(),
        policies,
        networkType,
        currentDeductible,
        currentOutOfPocket
      }
      
      const result = await analyzeCareCategory(analysisInput)
      setSearchResults(result)
    } catch (error) {
      console.error('Category analysis failed:', error)
      // Set fallback results
      setSearchResults({
        category: searchTerm,
        description: `Analysis of ${searchTerm} coverage.`,
        relatedServices: [],
        suggestedSubcategories: [],
        policyGrades: policies.map(policy => ({
          policyName: policy.plan_summary.plan_name,
          grade: 'C' as const,
          reasoning: 'Analysis temporarily unavailable',
          estimatedCost: 'Contact provider',
          coverageHighlights: ['Review policy documents'],
          costFactors: ['Unable to analyze']
        })),
        overallInsights: ['Analysis temporarily unavailable - please try again or contact your insurance provider']
      })
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResults(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Search Care Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Financial Context Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="current-deductible" className="text-sm font-medium">Current Deductible Spent</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="current-deductible"
                type="number"
                min="0"
                value={currentDeductible}
                onChange={(e) => setCurrentDeductible(parseInt(e.target.value) || 0)}
                className="pl-8"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="current-out-of-pocket" className="text-sm font-medium">Current Out-of-Pocket Spent</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="current-out-of-pocket"
                type="number"
                min="0"
                value={currentOutOfPocket}
                onChange={(e) => setCurrentOutOfPocket(parseInt(e.target.value) || 0)}
                className="pl-8"
                placeholder="0"
              />
            </div>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search for care type (e.g., mental health, emergency care, physical therapy)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isSearching && handleSearch()}
            />
          </div>
          <Button 
            onClick={handleSearch} 
            disabled={!searchTerm.trim() || isSearching}
            className="min-w-[100px]"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
          {searchResults && (
            <Button variant="outline" onClick={clearSearch}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quick Category Buttons */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(MEDICAL_CATEGORIES).slice(0, 6).map(category => (
            <Button
              key={category}
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm(category)
                handleSearch()
              }}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Search Results */}
        {searchResults && (
          <div className="space-y-6 mt-6">
            <div className="border-t pt-4">
              <div className="mb-4">
                <h3 className="font-semibold text-lg mb-2">{searchResults.category}</h3>
                <p className="text-gray-600 text-sm">{searchResults.description}</p>
              </div>
              
              {/* Suggested Subcategories */}
              {searchResults.suggestedSubcategories && searchResults.suggestedSubcategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-base text-gray-900 mb-3">Explore Related Areas:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {searchResults.suggestedSubcategories.map((subcategory, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-3 text-left flex-col items-start"
                        onClick={() => {
                          setSearchTerm(subcategory.searchTerm)
                          handleSearch()
                        }}
                      >
                        <div className="font-medium text-sm mb-1">{subcategory.name}</div>
                        <div className="text-xs text-gray-600">{subcategory.description}</div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Policy Grades Overview */}
              <div className="mb-6">
                <h4 className="font-medium text-base text-gray-900 mb-3">Policy Grades for {searchResults.category}:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.policyGrades
                    .sort((a, b) => a.grade.localeCompare(b.grade))
                    .map(policyGrade => (
                    <div key={policyGrade.policyName} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 pr-4">
                          <div className="font-medium text-sm mb-1 truncate">{policyGrade.policyName}</div>
                          <div className="text-xs text-gray-600 mb-2">{policyGrade.reasoning}</div>
                          <div className="text-sm font-medium text-green-600">{policyGrade.estimatedCost}</div>
                        </div>
                        <Badge className={`text-lg font-bold px-3 py-1 ${getGradeColor(policyGrade.grade)}`}>
                          {policyGrade.grade}
                        </Badge>
                      </div>
                      
                      {/* Coverage Highlights */}
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-700">Coverage Highlights:</div>
                        {policyGrade.coverageHighlights.map((highlight, index) => (
                          <div key={index} className="text-xs text-gray-600 flex items-start">
                            <span className="text-green-500 mr-1">•</span>
                            {highlight}
                          </div>
                        ))}
                      </div>
                      
                      {/* Cost Factors */}
                      {policyGrade.costFactors.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <div className="text-xs font-medium text-gray-700 mb-1">Cost Factors:</div>
                          <div className="flex flex-wrap gap-1">
                            {policyGrade.costFactors.map((factor, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Services */}
              <div className="mb-6">
                <h4 className="font-medium text-base text-gray-900 mb-3">Related Services ({searchResults.relatedServices.length}):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.relatedServices.map((service, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      onClick={() => setSelectedService(selectedService === service.serviceName ? null : service.serviceName)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{service.serviceName}</div>
                          <div className="text-xs text-gray-600 mb-1">{service.description}</div>
                          <div className="text-xs text-gray-500">
                            Frequency: {service.estimatedFrequency}
                          </div>
                        </div>
                        <div className="text-blue-600 text-xs font-medium">
                          {selectedService === service.serviceName ? 'Hide Details' : 'View Details'}
                        </div>
                      </div>
                      
                      {selectedService === service.serviceName && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-700 mb-3">
                            <strong>Why it's relevant:</strong> {service.relevanceReason}
                          </div>
                          
                          {/* Pricing Details */}
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-800">Cost by Policy:</div>
                            {service.policyPricing.map((pricing, priceIndex) => (
                              <div key={priceIndex} className="bg-gray-50 rounded p-2">
                                <div className="font-medium text-xs text-gray-800 mb-1">{pricing.policyName}</div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-gray-600">In-Network: </span>
                                    <span className="font-medium">{pricing.inNetworkCost}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Out-of-Network: </span>
                                    <span className="font-medium">{pricing.outOfNetworkCost}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-green-600 font-medium">Your Cost: </span>
                                    <span className="font-bold text-green-600">{pricing.actualCostAfterDeductible}</span>
                                  </div>
                                  {pricing.limitations && (
                                    <div className="col-span-2 text-gray-500 italic">
                                      Limitations: {pricing.limitations}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {searchResults.relatedServices.length === 0 && (
                  <p className="text-sm text-gray-500">No related services identified for this category.</p>
                )}
              </div>

              {/* Overall Insights */}
              {searchResults.overallInsights.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-base text-blue-900 mb-3">Key Insights:</h4>
                  <div className="space-y-2">
                    {searchResults.overallInsights.map((insight, index) => (
                      <div key={index} className="text-sm text-blue-800 flex items-start">
                        <span className="text-blue-600 mr-2 font-bold">•</span>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Component for adding other services
function AddOtherServiceForm({ 
  memberIndex, 
  availableServices, 
  existingServices, 
  onAdd 
}: {
  memberIndex: number
  availableServices: string[]
  existingServices: string[]
  onAdd: (memberIndex: number, serviceName: string, frequency: number) => void
}) {
  const [selectedService, setSelectedService] = useState('')
  const [frequency, setFrequency] = useState(1)
  const [showForm, setShowForm] = useState(false)
  
  // Filter out already selected services
  const availableOptions = availableServices.filter(service => 
    !existingServices.includes(service)
  )
  
  const handleAdd = () => {
    if (selectedService && frequency > 0) {
      onAdd(memberIndex, selectedService, frequency)
      setSelectedService('')
      setFrequency(1)
      setShowForm(false)
    }
  }
  
  const handleCancel = () => {
    setSelectedService('')
    setFrequency(1)
    setShowForm(false)
  }
  
  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="h-7 text-xs w-full"
        disabled={availableOptions.length === 0}
      >
        <Plus className="h-3 w-3 mr-1" />
        {availableOptions.length === 0 ? 'All services added' : 'Add Service'}
      </Button>
    )
  }
  
  return (
    <div className="space-y-2 p-2 bg-blue-50 rounded border">
      <div>
        <Label className="text-xs font-medium">Service</Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="h-7 text-xs mt-1">
            <SelectValue placeholder="Select service..." />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map(service => (
              <SelectItem key={service} value={service} className="text-xs">
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-xs font-medium">Frequency/year</Label>
          <Input
            type="number"
            min="1"
            max="365"
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
            className="h-7 text-xs mt-1"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!selectedService}
          className="h-7 text-xs px-2"
        >
          Add
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="h-7 text-xs px-2"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function PolicyComparison({ results }: PolicyComparisonProps) {
  const [networkType, setNetworkType] = useState<'in-network' | 'out-of-network'>('in-network')
  const [analysisResults, setAnalysisResults] = useState<PolicyAnalysis[] | EnhancedPolicyAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isEnhancedAnalysis, setIsEnhancedAnalysis] = useState(false)
  const [showSmartAnalysis, setShowSmartAnalysis] = useState(true)
  const [unifiedAnalysisResults, setUnifiedAnalysisResults] = useState<any>(null)
  const { members } = useHealthProfileStore()

  const successfulResults = results.results.filter(r => r.success && r.data)
  const successfulPolicies = successfulResults.map(r => r.data!)

  const handleAnalyze = async (config: AnalysisConfig, useEnhanced: boolean) => {
    if (members.length === 0) {
      alert('Please set up your health profile first to run an analysis.')
      return
    }

    setIsAnalyzing(true)
    setIsEnhancedAnalysis(useEnhanced)
    
    try {
      if (useEnhanced) {
        const results = await runEnhancedPolicyAnalysis(successfulPolicies, members, config)
        setAnalysisResults(results)
      } else {
        const results = await calculatePolicyAnalysis(successfulPolicies, members, config)
        setAnalysisResults(results)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUnifiedAnalysisComplete = (results: any) => {
    setUnifiedAnalysisResults(results)
    setAnalysisResults(results.analysis.policies || [])
    setShowSmartAnalysis(false)
  }

  if (successfulPolicies.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Policies Available</h2>
        <p className="text-gray-600">No policies were successfully processed for comparison.</p>
      </div>
    )
  }

  // Combine policies with their processing results (including PDF URLs)
  const policiesWithResults = successfulResults.map(result => ({
    policy: result.data!,
    result: result
  }))

  return (
    <div className="p-6">
      {/* Smart Analysis Section */}
      {/* {showSmartAnalysis && members.length > 0 && (
        <div className="mb-6">
          <SmartAnalysisButton
            sbcResults={results}
            members={members}
            location="United States" // TODO: Get actual location from user
            onComplete={handleUnifiedAnalysisComplete}
          />
        </div>
      )} */}

      {/* Display unified analysis results */}
      {unifiedAnalysisResults && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-green-600" />
              Best Match: {unifiedAnalysisResults.bestPolicy.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Estimated Annual Cost</div>
                <div className="text-2xl font-bold text-green-600">
                  ${unifiedAnalysisResults.bestPolicy.estimatedAnnualCost.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Grade</div>
                <div className="text-2xl font-bold">
                  <Badge className="text-lg px-3 py-1">{unifiedAnalysisResults.bestPolicy.grade}</Badge>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Potential Savings</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${unifiedAnalysisResults.bestPolicy.potentialSavings.toLocaleString()}/year
                </div>
              </div>
            </div>
            
            {/* Key Insights */}
            {unifiedAnalysisResults.insights.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Key Insights</h4>
                <div className="space-y-1">
                  {unifiedAnalysisResults.insights.map((insight: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full mt-1 ${
                        insight.impact === 'high' ? 'bg-red-500' :
                        insight.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <span className="font-medium">{insight.condition}:</span> {insight.insight}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {unifiedAnalysisResults.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {unifiedAnalysisResults.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary & Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <PolicyComparisonTable 
            policiesWithResults={policiesWithResults} 
            analysisResults={analysisResults}
            networkType={networkType}
          />

          <SmartAnalysisButton
            sbcResults={results}
            members={members}
            location="United States" // TODO: Get actual location from user
            onComplete={handleUnifiedAnalysisComplete}
          />


          {/* <SimplifiedPolicyAnalysis
            policies={successfulPolicies}
            healthProfile={members}
            onAnalysisComplete={(results: PolicyAnalysisResult[]) => {
              setAnalysisResults(results)
            }}
          /> */}
          
          {/* Policy Analysis Component */}
          {/* <PolicyAnalysisComponent
            policies={successfulPolicies}
            healthProfile={members}
            onAnalysisComplete={(results: PolicyAnalysisResult[]) => {
              // Convert PolicyAnalysisResult[] to PolicyAnalysis[] for compatibility
              const convertedResults = results.map((result: PolicyAnalysisResult) => ({
                policyName: result.policyName,
                grade: result.grade,
                score: result.grade === 'A' ? 90 : result.grade === 'B' ? 80 : result.grade === 'C' ? 70 : result.grade === 'D' ? 60 : 50,
                estimatedAnnualCost: result.estimatedAnnualCost,
                memberBreakdowns: result.memberBreakdowns.map(member => ({
                  memberIndex: member.memberIndex,
                  primaryCareVisits: { 
                    count: member.costs.find(c => c.service === 'Primary Care')?.frequency || 0,
                    costPerVisit: member.costs.find(c => c.service === 'Primary Care')?.unitCost || 0,
                    total: member.costs.find(c => c.service === 'Primary Care')?.totalCost || 0
                  },
                  specialistVisits: {
                    count: member.costs.find(c => c.service === 'Specialist')?.frequency || 0,
                    costPerVisit: member.costs.find(c => c.service === 'Specialist')?.unitCost || 0,
                    total: member.costs.find(c => c.service === 'Specialist')?.totalCost || 0
                  },
                  medications: {
                    count: member.costs.find(c => c.service === 'Medications')?.frequency || 0,
                    costPerFill: member.costs.find(c => c.service === 'Medications')?.unitCost || 0,
                    total: member.costs.find(c => c.service === 'Medications')?.totalCost || 0
                  },
                  diagnosticTests: {
                    count: member.costs.find(c => c.service === 'Diagnostic Tests')?.frequency || 0,
                    costPerTest: member.costs.find(c => c.service === 'Diagnostic Tests')?.unitCost || 0,
                    total: member.costs.find(c => c.service === 'Diagnostic Tests')?.totalCost || 0
                  },
                  plannedVisits: member.costs.filter(c => !['Primary Care', 'Specialist', 'Medications', 'Diagnostic Tests'].includes(c.service)).map(cost => ({
                    name: cost.service,
                    frequency: cost.frequency,
                    costPerVisit: cost.unitCost,
                    total: cost.totalCost
                  })),
                  memberTotal: member.memberTotal
                })),
                breakdown: {
                  ...result.breakdown,
                  premiums: 0, // Not included in our analysis
                  outOfPocketMax: 0 // Will be calculated elsewhere
                }
              }))
              setAnalysisResults(convertedResults)
            }}
          /> */}
        </TabsContent>
        
        <TabsContent value="categories" className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Category Analysis</h2>
              <Select value={networkType} onValueChange={(value: 'in-network' | 'out-of-network') => setNetworkType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-network">In-Network</SelectItem>
                  <SelectItem value="out-of-network">Out-of-Network</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <CategorySearch policies={successfulPolicies} networkType={networkType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}