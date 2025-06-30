"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  MapPin,
  RefreshCw,
  CheckCircle,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTreatmentCosts } from "@/lib/hooks/use-treatment-costs"
import { TreatmentPlan } from "@/lib/treatment-plan-generator"
import { useEffect, useState } from "react"

interface TreatmentCostDisplayProps {
  treatmentPlan: TreatmentPlan
  location?: { state?: string; zipCode?: string }
  onCostsCalculated?: (totalCost: number) => void
}

export function TreatmentCostDisplay({ 
  treatmentPlan, 
  location,
  onCostsCalculated 
}: TreatmentCostDisplayProps) {
  const { costs, summary, loading, error, fetchTreatmentCosts } = useTreatmentCosts()
  const [showDetails, setShowDetails] = useState(false)
  
  useEffect(() => {
    // Debounce the API call to prevent too many requests
    const timeoutId = setTimeout(() => {
      // Fetch costs when treatment plan changes
      if (treatmentPlan.treatments.length > 0 || treatmentPlan.preventiveCare.length > 0) {
        const allTreatments = [
          ...treatmentPlan.treatments.map(t => ({
            name: t.name,
            frequency: t.frequency,
            urgency: t.urgency
          })),
          ...treatmentPlan.preventiveCare.map(p => ({
            name: p.name,
            frequency: p.frequency,
            urgency: p.urgency
          }))
        ]
        
        fetchTreatmentCosts(allTreatments, location)
      }
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [treatmentPlan, location, fetchTreatmentCosts])
  
  useEffect(() => {
    if (summary && onCostsCalculated) {
      onCostsCalculated(summary.totalAnnualCost)
    }
  }, [summary, onCostsCalculated])
  
  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="w-4 h-4" />
      case 'medium': return <Info className="w-4 h-4" />
      case 'low': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    )
  }
  
  if (!costs || !summary) {
    return null
  }
  
  // Group costs by category
  const groupedCosts = costs.reduce((acc, cost) => {
    const category = cost.treatment.includes('Visit') || cost.treatment.includes('visit') ? 'Medical Visits' :
                    cost.treatment.includes('Test') || cost.treatment.includes('Panel') ? 'Lab Tests' :
                    cost.treatment.includes('Imaging') || cost.treatment.includes('X-Ray') || cost.treatment.includes('MRI') ? 'Imaging' :
                    cost.treatment.includes('Delivery') || cost.treatment.includes('Prenatal') ? 'Maternity Care' :
                    cost.treatment.includes('Therapy') || cost.treatment.includes('Session') ? 'Therapy' :
                    'Other Services'
    
    if (!acc[category]) acc[category] = []
    acc[category].push(cost)
    return acc
  }, {} as Record<string, typeof costs>)
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Estimated Treatment Costs
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <MapPin className="w-3 h-3" />
              {summary.location} • Updated {new Date(summary.lastUpdated).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTreatmentCosts(
              [...treatmentPlan.treatments, ...treatmentPlan.preventiveCare].map(t => ({
                name: t.name,
                frequency: t.frequency,
                urgency: t.urgency
              })),
              location
            )}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Cost Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Total Estimated Annual Cost</span>
            <Badge className={cn("flex items-center gap-1", getConfidenceColor(summary.averageConfidence))}>
              {getConfidenceIcon(summary.averageConfidence)}
              {summary.averageConfidence} confidence
            </Badge>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {formatCurrency(summary.totalAnnualCost)}
          </div>
          <div className="text-sm text-blue-700 mt-1">
            Based on {costs.length} medical services
          </div>
        </div>
        
        {/* Cost Breakdown Toggle */}
        <Button
          variant="outline"
          className="w-full mb-4"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Detailed Cost Breakdown
        </Button>
        
        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="space-y-4">
            {Object.entries(groupedCosts).map(([category, categoryCosts]) => {
              const categoryTotal = categoryCosts.reduce((sum, cost) => sum + cost.annualCost, 0)
              const categoryPercentage = (categoryTotal / summary.totalAnnualCost) * 100
              
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">{category}</h4>
                    <span className="text-sm font-medium">{formatCurrency(categoryTotal)}</span>
                  </div>
                  <Progress value={categoryPercentage} className="h-2 mb-3" />
                  <div className="space-y-2">
                    {categoryCosts.map((cost, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{cost.treatment}</span>
                          <Badge variant="outline" className="text-xs">
                            {cost.frequency}x/year
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">
                            {formatCurrency(cost.unitCost)} × {cost.frequency} =
                          </span>
                          <span className="font-medium">{formatCurrency(cost.annualCost)}</span>
                          <Badge className={cn("text-xs", getConfidenceColor(cost.confidence))}>
                            {cost.confidence}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {/* Cost Insights */}
        <Alert className="mt-4">
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Cost Insights:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {treatmentPlan.hasChronicConditions && (
                <li>• Chronic conditions typically require ongoing management costs</li>
              )}
              {treatmentPlan.requiresSpecialistCare && (
                <li>• Specialist visits cost 2-3x more than primary care visits</li>
              )}
              {treatmentPlan.emergencyRiskLevel !== 'low' && (
                <li>• Consider emergency room costs in your insurance selection</li>
              )}
              {costs.some(c => c.confidence === 'low') && (
                <li>• Some estimates have low confidence - actual costs may vary significantly</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}