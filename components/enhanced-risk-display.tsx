"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ShieldAlert,
  Activity,
  TrendingUp,
  Heart,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EnhancedRiskAssessment {
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high'
  riskScore: number
  emergencyRisk: number
  hospitalizationRisk: number
  relatedConditionRisks: { condition: string; risk: number }[]
}

interface EnhancedRiskDisplayProps {
  riskAssessment: EnhancedRiskAssessment
  memberIndex: number
  conditions: string[]
}

export function EnhancedRiskDisplay({ 
  riskAssessment, 
  memberIndex,
  conditions 
}: EnhancedRiskDisplayProps) {
  
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "very_high": return "text-red-600 bg-red-50 border-red-200"
      case "high": return "text-orange-600 bg-orange-50 border-orange-200"
      case "moderate": return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "low": return "text-green-600 bg-green-50 border-green-200"
      default: return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }
  
  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "very_high": return <ShieldAlert className="w-5 h-5" />
      case "high": return <AlertTriangle className="w-5 h-5" />
      case "moderate": return <Info className="w-5 h-5" />
      case "low": return <CheckCircle className="w-5 h-5" />
      default: return <Activity className="w-5 h-5" />
    }
  }
  
  const getProgressColor = (score: number) => {
    if (score >= 20) return "bg-red-500"
    if (score >= 10) return "bg-orange-500"
    if (score >= 5) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getRiskPercentageColor = (percentage: number) => {
    if (percentage >= 30) return "text-red-600"
    if (percentage >= 20) return "text-orange-600"
    if (percentage >= 10) return "text-yellow-600"
    return "text-green-600"
  }
  
  return (
    <div className="space-y-4">
      {/* Overall Risk Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Health Risk Assessment - Member {memberIndex + 1}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Risk Level Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRiskLevelIcon(riskAssessment.riskLevel)}
                <span className="font-medium">Overall Risk Level</span>
              </div>
              <Badge className={cn("uppercase", getRiskLevelColor(riskAssessment.riskLevel))}>
                {riskAssessment.riskLevel.replace('_', ' ')} risk
              </Badge>
            </div>
            
            {/* Risk Score Progress */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Risk Score</span>
                <span className="font-medium">{riskAssessment.riskScore}/30</span>
              </div>
              <Progress 
                value={(riskAssessment.riskScore / 30) * 100} 
                className="h-2"
                indicatorClassName={getProgressColor(riskAssessment.riskScore)}
              />
            </div>

            {/* Emergency and Hospitalization Risks */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Zap className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-600">Emergency Risk</p>
                  <p className={cn("font-semibold", getRiskPercentageColor(riskAssessment.emergencyRisk))}>
                    {riskAssessment.emergencyRisk}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Heart className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-xs text-gray-600">Hospitalization Risk</p>
                  <p className={cn("font-semibold", getRiskPercentageColor(riskAssessment.hospitalizationRisk))}>
                    {riskAssessment.hospitalizationRisk}%
                  </p>
                </div>
              </div>
            </div>

            {/* Current Conditions */}
            {conditions.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Current Conditions</p>
                <div className="flex flex-wrap gap-1">
                  {conditions.map((condition, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related Condition Risks */}
            {riskAssessment.relatedConditionRisks.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Potential Related Conditions</p>
                <div className="space-y-2">
                  {riskAssessment.relatedConditionRisks.slice(0, 3).map((risk, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{risk.condition.replace(/_/g, ' ')}</span>
                      <span className={cn("font-medium", getRiskPercentageColor(risk.risk))}>
                        {risk.risk}% risk
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Alert */}
      {riskAssessment.riskLevel === "very_high" && (
        <Alert className="border-red-200 bg-red-50">
          <ShieldAlert className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Very High Risk Profile</AlertTitle>
          <AlertDescription className="text-red-700">
            This profile indicates significant healthcare needs. Consider comprehensive coverage with low deductibles and out-of-pocket maximums.
          </AlertDescription>
        </Alert>
      )}
      
      {riskAssessment.riskLevel === "high" && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">High Risk Profile</AlertTitle>
          <AlertDescription className="text-orange-700">
            Multiple health conditions present. Plans with lower out-of-pocket costs and good specialist coverage recommended.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}