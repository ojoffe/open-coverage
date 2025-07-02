import { ProcessSBCResponse, SBCAnalysis } from './sbc-schema'
import { Member } from './health-profile-store'
import { calculateHealthcareUtilization } from './utilization-engine'
import { EnhancedTreatmentPlanGenerator } from './enhanced-treatment-plan-generator'
import { retrievePricingForAnalysis } from '@/app/actions/retrieve-pricing'
import { calculatePolicyAnalysis } from '@/app/actions/calculate-analysis'

interface AnalysisProgress {
  stage: 'preparing' | 'generating-plan' | 'retrieving-costs' | 'analyzing' | 'complete'
  message: string
  progress: number
  details?: string[]
}

interface UnifiedAnalysisOptions {
  sbcResults: ProcessSBCResponse
  members: Member[]
  location: string
  onProgress?: (progress: AnalysisProgress) => void
}

interface UnifiedAnalysisResult {
  analysis: any // Policy analysis results
  bestPolicy: {
    id: string
    name: string
    estimatedAnnualCost: number
    grade: string
    keyBenefits: string[]
  }
  insights: {
    condition: string
    insight: string
    impact: 'high' | 'medium' | 'low'
  }[]
  recommendations: string[]
}

export class UnifiedAnalysisService {
  private treatmentPlanGenerator = new EnhancedTreatmentPlanGenerator()

  async analyzeWithHealthProfile({
    sbcResults,
    members,
    location,
    onProgress
  }: UnifiedAnalysisOptions): Promise<UnifiedAnalysisResult> {
    try {
      // Stage 1: Preparation
      this.updateProgress(onProgress, {
        stage: 'preparing',
        message: 'Analyzing your health profile...',
        progress: 10,
        details: [`Found ${members.length} family member(s)`, `Analyzing ${sbcResults.successCount} policies`]
      })

      // Extract successful policies
      const policies = sbcResults.results
        .filter((r): r is { success: true; data: SBCAnalysis; fileName: string } => 
          r.success && r.data !== null
        )
        .map(r => r.data)

      if (policies.length === 0) {
        throw new Error('No valid policies to analyze')
      }

      // Stage 2: Generate treatment plans and utilization predictions
      this.updateProgress(onProgress, {
        stage: 'generating-plan',
        message: 'Creating personalized healthcare utilization plan...',
        progress: 25,
        details: this.getUtilizationDetails(members)
      })

      const memberPlans = members.map(member => {
        if (!member.age) return null
        
        const utilization = calculateHealthcareUtilization(member)
        const treatmentPlan = this.treatmentPlanGenerator.generateEnhancedTreatmentPlan(member)
        
        return {
          member,
          utilization,
          treatmentPlan,
          expectedServices: this.convertUtilizationToServices(utilization, treatmentPlan)
        }
      }).filter(Boolean)

      // Stage 3: Retrieve pricing
      this.updateProgress(onProgress, {
        stage: 'retrieving-costs',
        message: 'Retrieving real-world healthcare costs...',
        progress: 50,
        details: this.getPricingDetails(memberPlans)
      })

      // Prepare analysis config
      const analysisConfig = {
        currentDeductible: 0,
        currentOutOfPocket: 0,
        networkType: 'in-network' as const
      }

      // Convert member plans to health profile format for pricing retrieval
      const healthProfileForPricing = memberPlans.map(plan => {
        if (!plan) return null
        return {
          ...plan.member,
          visits: plan.expectedServices.map(service => ({
            name: service.name,
            frequency: `${service.frequency}/year`
          }))
        }
      }).filter(Boolean)

      const pricingData = await retrievePricingForAnalysis(
        policies,
        healthProfileForPricing,
        analysisConfig
      )

      // Stage 4: Run analysis
      this.updateProgress(onProgress, {
        stage: 'analyzing',
        message: 'Comparing policies based on your specific needs...',
        progress: 75,
        details: this.getAnalysisDetails(members, policies)
      })

      const analysisResult = await calculatePolicyAnalysis(
        policies,
        memberPlans.map(p => p!.member),
        analysisConfig
      )

      // Stage 5: Generate insights and recommendations
      const insights = this.generateHealthInsights(memberPlans, analysisResult)
      const bestPolicy = this.selectBestPolicy(analysisResult, insights)
      const recommendations = this.generateRecommendations(memberPlans, analysisResult, bestPolicy)

      this.updateProgress(onProgress, {
        stage: 'complete',
        message: 'Analysis complete!',
        progress: 100,
        details: [`Best match: ${bestPolicy.name}`, `Potential savings: $${bestPolicy.potentialSavings}/year`]
      })

      return {
        analysis: {
          policies: Array.isArray(analysisResult) ? analysisResult : []
        },
        bestPolicy,
        insights,
        recommendations
      }
    } catch (error) {
      console.error('Unified analysis error:', error)
      throw error
    }
  }

  private updateProgress(
    onProgress: ((progress: AnalysisProgress) => void) | undefined,
    progress: AnalysisProgress
  ) {
    if (onProgress) {
      onProgress(progress)
    }
  }

  private getUtilizationDetails(members: Member[]): string[] {
    const details: string[] = []
    
    members.forEach((member, index) => {
      const label = index === 0 ? 'Primary member' : `Member ${index + 1}`
      if (member.conditions && member.conditions.length > 0 && !member.conditions.includes('NONE')) {
        details.push(`${label}: ${member.conditions.filter(c => c !== 'NONE').join(', ')}`)
      }
      if (member.medications && member.medications.length > 0 && !member.medications.includes('NONE')) {
        details.push(`${member.medications.filter(m => m !== 'NONE').length} medication(s) identified`)
      }
    })

    return details
  }

  private getPricingDetails(memberPlans: any[]): string[] {
    const details: string[] = []
    const totalServices = memberPlans.reduce((sum, plan) => sum + plan.expectedServices.length, 0)
    
    details.push(`Retrieving costs for ${totalServices} healthcare services`)
    
    // Add condition-specific details
    const conditions = new Set<string>()
    memberPlans.forEach(plan => {
      if (plan.member.conditions) {
        plan.member.conditions
          .filter((c: string) => c !== 'NONE')
          .forEach((c: string) => conditions.add(c))
      }
    })
    
    if (conditions.size > 0) {
      details.push(`Including specialized care for: ${Array.from(conditions).join(', ')}`)
    }
    
    return details
  }

  private getAnalysisDetails(members: Member[], policies: SBCAnalysis[]): string[] {
    return [
      `Analyzing ${policies.length} policies`,
      `Calculating costs for ${members.length} family member(s)`,
      'Factoring in deductibles and out-of-pocket limits',
      'Comparing network coverage'
    ]
  }

  private convertUtilizationToServices(utilization: any, treatmentPlan: any): any[] {
    const services: any[] = []
    
    // Convert utilization predictions to expected services
    if (utilization?.predictions) {
      utilization.predictions.forEach((prediction: any) => {
        services.push({
          name: prediction.serviceType,
          frequency: prediction.annualVisits,
          category: prediction.basedOn,
          reason: prediction.reason
        })
      })
    }

    // Add medications from treatment plan
    if (treatmentPlan?.medications) {
      treatmentPlan.medications.forEach((med: any) => {
        services.push({
          name: med.name,
          frequency: 12, // Monthly refills
          category: 'medication',
          tier: med.tier
        })
      })
    }

    return services
  }

  private generateHealthInsights(memberPlans: any[], analysisResult: any): any[] {
    const insights: any[] = []
    
    memberPlans.forEach((plan, memberIndex) => {
      if (!plan) return
      
      const member = plan.member
      
      // Condition-based insights
      if (member.conditions && member.conditions.length > 0) {
        member.conditions
          .filter((c: string) => c !== 'NONE')
          .forEach((condition: string) => {
            // Find policies with best coverage for this condition
            const conditionCoverage = this.evaluateConditionCoverage(condition, analysisResult)
            insights.push({
              condition,
              insight: conditionCoverage.insight,
              impact: conditionCoverage.impact
            })
          })
      }

      // Medication insights
      if (member.medications && member.medications.length > 0 && !member.medications.includes('NONE')) {
        insights.push({
          condition: 'Prescription Coverage',
          insight: `${member.medications.length} medication(s) require formulary review`,
          impact: 'high'
        })
      }
    })

    return insights
  }

  private evaluateConditionCoverage(condition: string, analysisResult: any): any {
    // Analyze how well each policy covers specific conditions
    const conditionMap: Record<string, any> = {
      'Type 2 Diabetes': {
        insight: 'Diabetes management requires regular specialist visits and supplies',
        impact: 'high' as const,
        keyServices: ['Endocrinologist', 'A1C tests', 'Glucose monitoring']
      },
      'Hypertension': {
        insight: 'Blood pressure management needs consistent primary care',
        impact: 'medium' as const,
        keyServices: ['Primary care', 'Blood pressure monitoring']
      },
      'Asthma': {
        insight: 'Asthma care includes inhalers and potential emergency visits',
        impact: 'medium' as const,
        keyServices: ['Pulmonologist', 'Inhalers', 'Emergency care']
      }
    }

    return conditionMap[condition] || {
      insight: `${condition} requires specialized care coordination`,
      impact: 'medium' as const
    }
  }

  private selectBestPolicy(analysisResult: any, insights: any[]): any {
    // Find the policy with the best overall value
    let bestPolicy = null
    let lowestCost = Infinity
    
    // Handle both array and object with policies property
    const policies = Array.isArray(analysisResult) ? analysisResult : analysisResult.policies || []
    
    policies.forEach((policy: any) => {
      // Calculate total annual cost including medical costs
      const totalCost = policy.estimatedAnnualCost || 
        (policy.breakdown ? policy.breakdown.finalMedicalCosts + (policy.annualPremium || 0) : 0)
      
      if (totalCost < lowestCost) {
        lowestCost = totalCost
        bestPolicy = {
          id: policy.policyId || policy.policyName,
          name: policy.policyName,
          estimatedAnnualCost: totalCost,
          grade: policy.grade,
          keyBenefits: this.extractKeyBenefits(policy),
          potentialSavings: 0
        }
      }
    })

    // Calculate potential savings
    if (bestPolicy && policies.length > 1) {
      const avgCost = policies.reduce((sum: number, p: any) => {
        const total = p.estimatedAnnualCost || 
          (p.breakdown ? p.breakdown.finalMedicalCosts + (p.annualPremium || 0) : 0)
        return sum + total
      }, 0) / policies.length
      
      bestPolicy.potentialSavings = Math.round(avgCost - bestPolicy.estimatedAnnualCost)
    }

    return bestPolicy || {
      id: 'unknown',
      name: 'Unable to determine',
      estimatedAnnualCost: 0,
      grade: 'N/A',
      keyBenefits: [],
      potentialSavings: 0
    }
  }

  private extractKeyBenefits(policy: any): string[] {
    const benefits: string[] = []
    
    if (policy.hasMetDeductible) {
      benefits.push('Low deductible for your usage level')
    }
    
    if (policy.memberCosts.some((m: any) => m.preventiveCost === 0)) {
      benefits.push('Free preventive care')
    }
    
    if (policy.grade === 'A' || policy.grade === 'B') {
      benefits.push('Excellent value for your health profile')
    }
    
    return benefits
  }

  private generateRecommendations(memberPlans: any[], analysisResult: any, bestPolicy: any): string[] {
    const recommendations: string[] = []
    
    // Best policy recommendation
    recommendations.push(`${bestPolicy.name} offers the best value based on your health profile`)
    
    // Condition-specific recommendations
    const hasChronicConditions = memberPlans.some(p => 
      p?.member.conditions?.some((c: string) => c !== 'NONE')
    )
    
    if (hasChronicConditions) {
      recommendations.push('Consider policies with low specialist copays due to chronic conditions')
    }
    
    // Medication recommendations
    const hasMedications = memberPlans.some(p => 
      p?.member.medications?.some((m: string) => m !== 'NONE')
    )
    
    if (hasMedications) {
      recommendations.push('Review formulary coverage for all medications before enrolling')
    }
    
    // High utilization recommendation
    const highUtilization = memberPlans.some(p => 
      p?.utilization?.predictions?.length > 10
    )
    
    if (highUtilization) {
      recommendations.push('Your high healthcare usage suggests choosing a plan with lower out-of-pocket maximums')
    }
    
    return recommendations
  }
}

export const unifiedAnalysisService = new UnifiedAnalysisService()