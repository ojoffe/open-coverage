"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, RefreshCw } from "lucide-react"
import type { SBCData } from "@/lib/sbc-schema"
import type { Member } from "@/lib/health-profile-store"

// Types for analysis
export interface AnalysisConfig {
  currentDeductible: number
  currentOutOfPocket: number
  networkType: 'in-network' | 'out-of-network'
}

export interface MemberUsageConfig {
  memberId: string
  memberName: string
  age: number
  primaryCareVisits: number
  specialistVisits: number
  medicationFills: number
  diagnosticTests: number
  otherServices: Array<{
    name: string
    frequency: number
    estimatedCost: number
  }>
  expectedAnnualCost: number
}

export interface MockPricingData {
  serviceName: string
  cost: number
  source: 'policy' | 'market' | 'estimate'
}

export interface PolicyAnalysisResult {
  policyName: string
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  estimatedAnnualCost: number
  memberBreakdowns: Array<{
    memberIndex: number
    memberName: string
    costs: Array<{
      service: string
      frequency: number
      unitCost: number
      totalCost: number
    }>
    memberTotal: number
  }>
  breakdown: {
    totalMedicalCosts: number
    deductibleApplied: number
    coinsuranceApplied: number
    finalMedicalCosts: number
  }
}

interface PolicyAnalysisProps {
  policies: SBCData[]
  healthProfile: Member[]
  onAnalysisComplete?: (results: PolicyAnalysisResult[]) => void
}

// Mock pricing data for testing
const MOCK_PRICING: Record<string, MockPricingData> = {
  'primary care': { serviceName: 'Primary Care Visit', cost: 180, source: 'market' },
  'specialist': { serviceName: 'Specialist Visit', cost: 320, source: 'market' },
  'generic drugs': { serviceName: 'Generic Medication', cost: 15, source: 'policy' },
  'preferred drugs': { serviceName: 'Preferred Brand Medication', cost: 45, source: 'policy' },
  'specialty drugs': { serviceName: 'Specialty Medication', cost: 450, source: 'market' },
  'diagnostic tests': { serviceName: 'Diagnostic Test', cost: 120, source: 'market' },
  'urgent care': { serviceName: 'Urgent Care Visit', cost: 220, source: 'policy' },
  'emergency room': { serviceName: 'Emergency Room Visit', cost: 1800, source: 'market' },
  'physical therapy': { serviceName: 'Physical Therapy Session', cost: 85, source: 'market' },
  'mental health': { serviceName: 'Mental Health Session', cost: 150, source: 'market' },
  'imaging': { serviceName: 'Medical Imaging', cost: 400, source: 'market' },
}

// Predict medication type based on medication name
function predictMedicationType(medication: string): 'generic' | 'preferred' | 'specialty' {
  const med = medication.toLowerCase()
  
  // Specialty medications
  const specialtyKeywords = ['humira', 'enbrel', 'insulin', 'harvoni', 'keytruda', 'herceptin']
  if (specialtyKeywords.some(keyword => med.includes(keyword))) {
    return 'specialty'
  }
  
  // Generic medications  
  const genericKeywords = ['metformin', 'lisinopril', 'amlodipine', 'atorvastatin', 'ibuprofen', 'acetaminophen']
  if (genericKeywords.some(keyword => med.includes(keyword))) {
    return 'generic'
  }
  
  // Default to preferred brand
  return 'preferred'
}

// Calculate age-based healthcare utilization
function calculateAgeBasedUtilization(age: number, conditions: string[], medications: string[]) {
  let basePrimaryCare = 1
  let baseSpecialist = 0
  let baseDiagnostic = 1
  
  // Age-based adjustments
  if (age < 2) {
    basePrimaryCare = 8 // Frequent well-child visits
    baseDiagnostic = 3 // Multiple screenings
  } else if (age < 6) {
    basePrimaryCare = 4 // Quarterly visits
    baseDiagnostic = 2
  } else if (age < 18) {
    basePrimaryCare = 2 // Annual physicals
    baseDiagnostic = 1
  } else if (age < 30) {
    basePrimaryCare = 1 // Many skip regular care
    baseDiagnostic = 1
  } else if (age < 50) {
    basePrimaryCare = 2 // Regular check-ups
    baseDiagnostic = 1
  } else if (age < 65) {
    basePrimaryCare = 3 // More monitoring
    baseDiagnostic = 3 // Cancer screenings
    baseSpecialist = 1 // Likely specialist care
  } else {
    basePrimaryCare = 4 // Frequent monitoring
    baseDiagnostic = 3
    baseSpecialist = 2 // Multiple specialists
  }
  
  // Condition-based adjustments
  const conditionAdjustment = conditions.filter(c => c !== 'NONE').length
  basePrimaryCare += conditionAdjustment
  baseSpecialist += conditionAdjustment
  baseDiagnostic += Math.floor(conditionAdjustment / 2)
  
  // Medication fills (12 per year per medication)
  const medicationFills = medications.filter(m => m !== 'NONE').length * 12
  
  return {
    primaryCareVisits: Math.max(basePrimaryCare, 1),
    specialistVisits: baseSpecialist,
    medicationFills,
    diagnosticTests: Math.max(baseDiagnostic, 1)
  }
}

export default function PolicyAnalysis({ policies, healthProfile, onAnalysisComplete }: PolicyAnalysisProps) {
  const [currentStep, setCurrentStep] = useState<'config' | 'pricing' | 'analysis'>('config')
  const [memberConfigs, setMemberConfigs] = useState<MemberUsageConfig[]>([])
  const [analysisConfig, setAnalysisConfig] = useState<AnalysisConfig>({
    currentDeductible: 0,
    currentOutOfPocket: 0,
    networkType: 'in-network'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<PolicyAnalysisResult[]>([])
  const [availableServices] = useState<string[]>(() => {
    // Get unique services from all policies
    const servicesSet = new Set<string>()
    policies.forEach(policy => {
      policy.services_you_may_need.forEach(service => {
        servicesSet.add(service.name)
      })
    })
    return Array.from(servicesSet).sort()
  })

  // Initialize member configurations based on health profile
  useEffect(() => {
    if (healthProfile.length > 0 && memberConfigs.length === 0) {
      const configs = healthProfile.map((member, index) => {
        const age = parseInt(member.age) || 25
        const utilization = calculateAgeBasedUtilization(age, member.conditions, member.medications)
        
        return {
          memberId: member.id,
          memberName: index === 0 ? 'Primary Member' : `Member ${index + 1}`,
          age,
          primaryCareVisits: utilization.primaryCareVisits,
          specialistVisits: utilization.specialistVisits,
          medicationFills: utilization.medicationFills,
          diagnosticTests: utilization.diagnosticTests,
          otherServices: member.otherServices?.map(service => ({
            name: service.name || 'Unknown Service',
            frequency: 1,
            estimatedCost: MOCK_PRICING[service.name?.toLowerCase()] ? 
              MOCK_PRICING[service.name.toLowerCase()].cost : 100
          })) || [],
          expectedAnnualCost: 0
        }
      })
      
      // Calculate expected costs for each member
      configs.forEach(config => {
        const primaryCareCost = config.primaryCareVisits * MOCK_PRICING['primary care'].cost
        const specialistCost = config.specialistVisits * MOCK_PRICING['specialist'].cost
        const diagnosticCost = config.diagnosticTests * MOCK_PRICING['diagnostic tests'].cost
        
        // Calculate medication costs by type
        let medicationCost = 0
        const member = healthProfile.find(m => m.id === config.memberId)
        if (member) {
          member.medications.forEach(medication => {
            if (medication !== 'NONE') {
              const type = predictMedicationType(medication)
              const costPerFill = MOCK_PRICING[`${type} drugs`].cost
              medicationCost += costPerFill * 12 // 12 fills per year
            }
          })
        }
        
        const otherServicesCost = config.otherServices.reduce((sum, service) => 
          sum + (service.frequency * service.estimatedCost), 0)
        
        config.expectedAnnualCost = primaryCareCost + specialistCost + diagnosticCost + medicationCost + otherServicesCost
      })
      
      setMemberConfigs(configs)
    }
  }, [healthProfile, policies])

  const updateMemberConfig = (memberId: string, field: keyof MemberUsageConfig, value: any) => {
    setMemberConfigs(prev => prev.map(config => 
      config.memberId === memberId ? { ...config, [field]: value } : config
    ))
  }

  const addOtherService = (memberId: string, serviceName: string, frequency: number) => {
    if (!serviceName.trim() || frequency <= 0) return
    
    setMemberConfigs(prev => prev.map(config => {
      if (config.memberId === memberId) {
        const estimatedCost = MOCK_PRICING[serviceName.toLowerCase()]?.cost || 100
        const newService = { name: serviceName, frequency, estimatedCost }
        
        // Check if service already exists
        const existingIndex = config.otherServices.findIndex(s => s.name === serviceName)
        if (existingIndex >= 0) {
          const updatedServices = [...config.otherServices]
          updatedServices[existingIndex] = newService
          return { ...config, otherServices: updatedServices }
        } else {
          return { ...config, otherServices: [...config.otherServices, newService] }
        }
      }
      return config
    }))
  }

  const removeOtherService = (memberId: string, serviceName: string) => {
    setMemberConfigs(prev => prev.map(config => 
      config.memberId === memberId 
        ? { ...config, otherServices: config.otherServices.filter(s => s.name !== serviceName) }
        : config
    ))
  }

  const resetToDefaults = () => {
    // Directly recalculate defaults instead of relying on useEffect
    if (healthProfile.length > 0) {
      const configs = healthProfile.map((member, index) => {
        const age = parseInt(member.age) || 25
        const utilization = calculateAgeBasedUtilization(age, member.conditions, member.medications)
        
        return {
          memberId: member.id,
          memberName: index === 0 ? 'Primary Member' : `Member ${index + 1}`,
          age,
          primaryCareVisits: utilization.primaryCareVisits,
          specialistVisits: utilization.specialistVisits,
          medicationFills: utilization.medicationFills,
          diagnosticTests: utilization.diagnosticTests,
          otherServices: member.otherServices?.map(service => ({
            name: service.name || 'Unknown Service',
            frequency: 1,
            estimatedCost: MOCK_PRICING[service.name?.toLowerCase()] ? 
              MOCK_PRICING[service.name.toLowerCase()].cost : 100
          })) || [],
          expectedAnnualCost: 0
        }
      })
      
      // Calculate expected costs for each member
      configs.forEach(config => {
        const primaryCareCost = config.primaryCareVisits * MOCK_PRICING['primary care'].cost
        const specialistCost = config.specialistVisits * MOCK_PRICING['specialist'].cost
        const diagnosticCost = config.diagnosticTests * MOCK_PRICING['diagnostic tests'].cost
        
        // Calculate medication costs by type
        let medicationCost = 0
        const member = healthProfile.find(m => m.id === config.memberId)
        if (member) {
          member.medications.forEach(medication => {
            if (medication !== 'NONE') {
              const type = predictMedicationType(medication)
              const costPerFill = MOCK_PRICING[`${type} drugs`].cost
              medicationCost += costPerFill * 12 // 12 fills per year
            }
          })
        }
        
        const otherServicesCost = config.otherServices.reduce((sum, service) => 
          sum + (service.frequency * service.estimatedCost), 0)
        
        config.expectedAnnualCost = primaryCareCost + specialistCost + diagnosticCost + medicationCost + otherServicesCost
      })
      
      setMemberConfigs(configs)
    }
  }

  const handleRetrievePricing = async () => {
    setIsLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      setCurrentStep('pricing')
    } catch (error) {
      console.error('Failed to retrieve pricing:', error)
      alert('Failed to retrieve pricing. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const runAnalysis = async () => {
    setIsLoading(true)
    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const results: PolicyAnalysisResult[] = policies.map(policy => {
        const memberBreakdowns = memberConfigs.map((config, index) => {
          const costs = [
            {
              service: 'Primary Care',
              frequency: config.primaryCareVisits,
              unitCost: MOCK_PRICING['primary care'].cost,
              totalCost: config.primaryCareVisits * MOCK_PRICING['primary care'].cost
            },
            {
              service: 'Specialist',
              frequency: config.specialistVisits,
              unitCost: MOCK_PRICING['specialist'].cost,
              totalCost: config.specialistVisits * MOCK_PRICING['specialist'].cost
            },
            {
              service: 'Medications',
              frequency: config.medicationFills,
              unitCost: 30, // Average across types
              totalCost: config.medicationFills * 30
            },
            {
              service: 'Diagnostic Tests',
              frequency: config.diagnosticTests,
              unitCost: MOCK_PRICING['diagnostic tests'].cost,
              totalCost: config.diagnosticTests * MOCK_PRICING['diagnostic tests'].cost
            },
            ...config.otherServices.map(service => ({
              service: service.name,
              frequency: service.frequency,
              unitCost: service.estimatedCost,
              totalCost: service.frequency * service.estimatedCost
            }))
          ].filter(cost => cost.totalCost > 0)

          const memberTotal = costs.reduce((sum, cost) => sum + cost.totalCost, 0)

          return {
            memberIndex: index,
            memberName: config.memberName,
            costs,
            memberTotal
          }
        })

        const totalMedicalCosts = memberBreakdowns.reduce((sum, member) => sum + member.memberTotal, 0)
        
        // Apply insurance calculations
        const deductible = healthProfile.length > 1 
          ? policy.important_questions.overall_deductible.family
          : policy.important_questions.overall_deductible.individual
        
        const deductibleApplied = Math.min(totalMedicalCosts, deductible)
        const afterDeductible = Math.max(0, totalMedicalCosts - deductible)
        const coinsuranceApplied = afterDeductible * 0.2 // 20% coinsurance
        
        const outOfPocketMax = healthProfile.length > 1
          ? policy.important_questions.out_of_pocket_limit_for_plan.family
          : policy.important_questions.out_of_pocket_limit_for_plan.individual
        
        const finalMedicalCosts = Math.min(deductibleApplied + coinsuranceApplied, outOfPocketMax)
        const totalAnnualCost = finalMedicalCosts // Only medical costs, no premiums

        // Calculate grade based on out-of-pocket costs (without premiums)
        let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'
        if (totalAnnualCost <= 3000) grade = 'A'      // Low out-of-pocket costs
        else if (totalAnnualCost <= 6000) grade = 'B'  // Moderate out-of-pocket costs
        else if (totalAnnualCost <= 10000) grade = 'C' // Higher out-of-pocket costs
        else if (totalAnnualCost <= 15000) grade = 'D' // High out-of-pocket costs

        return {
          policyName: policy.plan_summary.plan_name,
          grade,
          estimatedAnnualCost: Math.round(totalAnnualCost),
          memberBreakdowns,
          breakdown: {
            totalMedicalCosts: Math.round(totalMedicalCosts),
            deductibleApplied: Math.round(deductibleApplied),
            coinsuranceApplied: Math.round(coinsuranceApplied),
            finalMedicalCosts: Math.round(finalMedicalCosts)
          }
        }
      })

      setAnalysisResults(results)
      setCurrentStep('analysis')
      onAnalysisComplete?.(results)
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (healthProfile.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Please set up your health profile first to run a cost analysis.
          </p>
          <Button asChild variant="outline">
            <a href="/health-profile">Set Up Health Profile</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-blue-900">Personalized Cost Analysis</h3>
              <div className="flex gap-2">
                <Badge variant={currentStep === 'config' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                  {currentStep === 'config' ? '→' : '✓'} 1. Configure Usage
                </Badge>
                <Badge variant={currentStep === 'pricing' ? 'default' : currentStep === 'analysis' ? 'secondary' : 'outline'} className="text-sm px-3 py-1">
                  {currentStep === 'pricing' ? '→' : currentStep === 'analysis' ? '✓' : ''} 2. Review Pricing
                </Badge>
                <Badge variant={currentStep === 'analysis' ? 'default' : 'outline'} className="text-sm px-3 py-1">
                  {currentStep === 'analysis' ? '→' : ''} 3. Results
                </Badge>
              </div>
            </div>
            
            {currentStep === 'pricing' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep('config')}>
                  ← Back to Configure
                </Button>
                <Button onClick={runAnalysis} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Running Analysis...' : 'Run Analysis →'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentStep === 'config' && 'Step 1: Configure Healthcare Usage'}
            {currentStep === 'pricing' && 'Step 2: Review Pricing Data'}
            {currentStep === 'analysis' && 'Step 3: Analysis Results'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Configuration Step */}
          {currentStep === 'config' && (
            <>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Expected Healthcare Usage by Member:</h4>
                <Button variant="outline" size="sm" onClick={resetToDefaults} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset to Defaults
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {memberConfigs.map((config, index) => (
                  <Card key={config.memberId} className="border-2">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-base flex items-center justify-between">
                        {config.memberName}
                        <span className="text-sm font-normal text-gray-600">Age {config.age}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Core Services */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Primary Care Visits/year</Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={config.primaryCareVisits}
                            onChange={(e) => updateMemberConfig(config.memberId, 'primaryCareVisits', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Specialist Visits/year</Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={config.specialistVisits}
                            onChange={(e) => updateMemberConfig(config.memberId, 'specialistVisits', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Medication Fills/year</Label>
                          <Input
                            type="number"
                            min="0"
                            max="500"
                            value={config.medicationFills}
                            onChange={(e) => updateMemberConfig(config.memberId, 'medicationFills', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Diagnostic Tests/year</Label>
                          <Input
                            type="number"
                            min="0"
                            max="50"
                            value={config.diagnosticTests}
                            onChange={(e) => updateMemberConfig(config.memberId, 'diagnosticTests', parseInt(e.target.value) || 0)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      {/* Other Services */}
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium mb-2 block">Additional Services</Label>
                        {config.otherServices.map((service, serviceIndex) => (
                          <div key={serviceIndex} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                            <span className="flex-1 text-sm font-medium">{service.name}</span>
                            <Input
                              type="number"
                              min="0"
                              value={service.frequency}
                              onChange={(e) => {
                                const newServices = [...config.otherServices]
                                newServices[serviceIndex].frequency = parseInt(e.target.value) || 0
                                updateMemberConfig(config.memberId, 'otherServices', newServices)
                              }}
                              className="w-20 h-8 text-sm"
                            />
                            <span className="text-sm text-gray-500">/yr</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOtherService(config.memberId, service.name)}
                              className="h-8 w-8 p-0 text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <AddServiceForm
                          memberId={config.memberId}
                          availableServices={availableServices}
                          existingServices={config.otherServices.map(s => s.name)}
                          onAdd={addOtherService}
                        />
                      </div>

                      {/* Health Context */}
                      {healthProfile[index] && (
                        <div className="border-t pt-4 text-sm">
                          <div className="text-gray-600 font-medium mb-2">From Health Profile:</div>
                          {healthProfile[index].conditions.length > 0 && (
                            <div className="mb-2">
                              <span className="text-gray-600">Conditions: </span>
                              <span className="font-medium">{healthProfile[index].conditions.filter(c => c !== 'NONE').join(', ') || 'None'}</span>
                            </div>
                          )}
                          {healthProfile[index].medications.length > 0 && (
                            <div>
                              <span className="text-gray-600">Medications: </span>
                              <span className="font-medium">{healthProfile[index].medications.filter(m => m !== 'NONE').join(', ') || 'None'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleRetrievePricing} 
                  disabled={isLoading}
                  className="px-8"
                >
                  {isLoading ? 'Retrieving Pricing...' : 'Retrieve Pricing →'}
                </Button>
              </div>
            </>
          )}

          {/* Pricing Step */}
          {currentStep === 'pricing' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  <strong>✓ Pricing Retrieved Successfully!</strong> Review the estimated costs below, then click "Run Analysis" to continue.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memberConfigs.map(config => (
                  <Card key={config.memberId} className="border-2">
                    <CardHeader>
                      <CardTitle className="text-base">{config.memberName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {config.primaryCareVisits > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Primary Care ({config.primaryCareVisits}× ${MOCK_PRICING['primary care'].cost})</span>
                          <span className="font-medium">${(config.primaryCareVisits * MOCK_PRICING['primary care'].cost).toLocaleString()}</span>
                        </div>
                      )}
                      {config.specialistVisits > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Specialist ({config.specialistVisits}× ${MOCK_PRICING['specialist'].cost})</span>
                          <span className="font-medium">${(config.specialistVisits * MOCK_PRICING['specialist'].cost).toLocaleString()}</span>
                        </div>
                      )}
                      {config.medicationFills > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Medications ({config.medicationFills} fills/year)</span>
                          <span className="font-medium">${(config.medicationFills * 30).toLocaleString()}</span>
                        </div>
                      )}
                      {config.diagnosticTests > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Diagnostic Tests ({config.diagnosticTests}× ${MOCK_PRICING['diagnostic tests'].cost})</span>
                          <span className="font-medium">${(config.diagnosticTests * MOCK_PRICING['diagnostic tests'].cost).toLocaleString()}</span>
                        </div>
                      )}
                      {config.otherServices.map(service => (
                        <div key={service.name} className="flex justify-between text-sm">
                          <span>{service.name} ({service.frequency}× ${service.estimatedCost})</span>
                          <span className="font-medium">${(service.frequency * service.estimatedCost).toLocaleString()}</span>
                        </div>
                      ))}
                      
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between font-bold text-blue-900">
                          <span>Annual Total:</span>
                          <span>${config.expectedAnnualCost.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Analysis Results Step */}
          {currentStep === 'analysis' && (
            <>
              {analysisResults.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-green-800 font-medium mb-2">✅ Analysis Complete!</p>
                    <p className="text-green-700 text-sm mb-2">
                      Your personalized cost analysis comparing {policies.length} policies.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                      <p className="text-blue-800 text-sm font-medium">
                        📋 Important: This analysis shows estimated out-of-pocket medical costs only
                      </p>
                      <p className="text-blue-700 text-xs mt-1">
                        Monthly premiums are not included and must be paid separately to your insurance provider
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {analysisResults.map((result, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-gray-50">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{result.policyName}</CardTitle>
                            <div className="flex items-center gap-3">
                              <Badge className={`text-lg font-bold px-3 py-1 ${getGradeColor(result.grade)}`}>
                                {result.grade}
                              </Badge>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  ${result.estimatedAnnualCost.toLocaleString()}
                                </div>
                                <div className="text-sm text-gray-600">Est. Annual Out-of-Pocket</div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Member Breakdowns */}
                            <div>
                              <h4 className="font-medium mb-3">Member Costs</h4>
                              {result.memberBreakdowns.map(member => (
                                <div key={member.memberIndex} className="mb-4 p-3 bg-gray-50 rounded">
                                  <div className="font-medium text-sm mb-2">{member.memberName}</div>
                                  {member.costs.map(cost => (
                                    <div key={cost.service} className="flex justify-between text-sm">
                                      <span>{cost.service}</span>
                                      <span>${cost.totalCost.toLocaleString()}</span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-1 mt-1 flex justify-between font-medium text-sm">
                                    <span>Total:</span>
                                    <span>${member.memberTotal.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Cost Breakdown */}
                            <div>
                              <h4 className="font-medium mb-3">Insurance Calculation</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Total Medical Costs:</span>
                                  <span className="font-medium">${result.breakdown.totalMedicalCosts.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Deductible Applied:</span>
                                  <span className="font-medium text-red-600">-${result.breakdown.deductibleApplied.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Coinsurance (20%):</span>
                                  <span className="font-medium">${result.breakdown.coinsuranceApplied.toLocaleString()}</span>
                                </div>
                                                              <div className="flex justify-between">
                                <span>Your Out-of-Pocket Cost:</span>
                                <span className="font-medium">${result.breakdown.finalMedicalCosts.toLocaleString()}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-bold">
                                <span>Total Annual Out-of-Pocket:</span>
                                <span className="text-green-600">${result.estimatedAnnualCost.toLocaleString()}</span>
                              </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setCurrentStep('config')}>
                      ← Run New Analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No analysis results available.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Component for adding services
function AddServiceForm({ 
  memberId, 
  availableServices, 
  existingServices, 
  onAdd 
}: {
  memberId: string
  availableServices: string[]
  existingServices: string[]
  onAdd: (memberId: string, serviceName: string, frequency: number) => void
}) {
  const [selectedService, setSelectedService] = useState('')
  const [frequency, setFrequency] = useState(1)
  const [showForm, setShowForm] = useState(false)
  
  const availableOptions = availableServices.filter(service => 
    !existingServices.includes(service)
  )
  
  const handleAdd = () => {
    if (selectedService && frequency > 0) {
      onAdd(memberId, selectedService, frequency)
      setSelectedService('')
      setFrequency(1)
      setShowForm(false)
    }
  }
  
  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="w-full text-sm flex items-center gap-2"
        disabled={availableOptions.length === 0}
      >
        <Plus className="h-4 w-4" />
        {availableOptions.length === 0 ? 'All services added' : 'Add Service'}
      </Button>
    )
  }
  
  return (
    <div className="space-y-2 p-3 bg-blue-50 rounded border">
      <div>
        <Label className="text-sm font-medium">Service</Label>
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select service..." />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map(service => (
              <SelectItem key={service} value={service}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="text-sm font-medium">Frequency/year</Label>
          <Input
            type="number"
            min="1"
            max="365"
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={!selectedService}>
          Add
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
          Cancel
        </Button>
      </div>
    </div>
  )
} 