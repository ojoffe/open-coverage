"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  Calendar,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface CostAnalysisSummaryProps {
  totalMembers: number
  totalConditions: number
  totalTreatments: number
  totalAnnualCost: number
  confidence: 'high' | 'medium' | 'low'
  costBreakdown?: {
    medical: number
    medications: number
    preventive: number
    emergency: number
  }
}

export function CostAnalysisSummary({
  totalMembers,
  totalConditions,
  totalTreatments,
  totalAnnualCost,
  confidence,
  costBreakdown
}: CostAnalysisSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'high': return 'text-green-600 bg-green-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const monthlyEstimate = Math.round(totalAnnualCost / 12)
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Cost Analysis Summary
            </CardTitle>
            <CardDescription>
              Based on your health profile and expected medical needs
            </CardDescription>
          </div>
          <Badge className={cn("flex items-center gap-1", getConfidenceColor(confidence))}>
            {confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-sm text-gray-600">Members</p>
          </div>
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold">{totalConditions}</p>
            <p className="text-sm text-gray-600">Conditions</p>
          </div>
          <div className="text-center">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold">{totalTreatments}</p>
            <p className="text-sm text-gray-600">Services/Year</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold">{formatCurrency(monthlyEstimate)}</p>
            <p className="text-sm text-gray-600">Per Month</p>
          </div>
        </div>
        
        {/* Total Cost Display */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-600 mb-2">Total Estimated Annual Healthcare Costs</p>
          <p className="text-4xl font-bold text-blue-900">{formatCurrency(totalAnnualCost)}</p>
          <p className="text-sm text-blue-600 mt-2">
            Before insurance coverage
          </p>
        </div>
        
        {/* Cost Breakdown */}
        {costBreakdown && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Cost Breakdown by Category</h4>
            {Object.entries(costBreakdown).map(([category, amount]) => {
              const percentage = (amount / totalAnnualCost) * 100
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{category.replace('_', ' ')}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        )}
        
        {/* Confidence Note */}
        {confidence === 'low' && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-800">
              <p className="font-medium">Low Confidence Estimate</p>
              <p className="mt-1">
                Some treatment costs are estimated. Actual costs may vary significantly based on your location and providers.
              </p>
            </div>
          </div>
        )}
        
        {/* What's Next */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">What's Next?</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Compare how different insurance plans would cover these costs</li>
            <li>• See your out-of-pocket expenses with each plan</li>
            <li>• Find the most cost-effective option for your needs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}