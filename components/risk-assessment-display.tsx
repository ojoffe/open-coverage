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
  TrendingUp,
  User
} from "lucide-react"
import { RiskAssessment } from "@/lib/utilization-engine"
import { cn } from "@/lib/utils"

interface RiskAssessmentDisplayProps {
  riskAssessment: RiskAssessment
  memberName?: string
}

export function RiskAssessmentDisplay({ 
  riskAssessment, 
  memberName = "Member" 
}: RiskAssessmentDisplayProps) {
  
  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-50"
      case "high": return "text-orange-600 bg-orange-50"
      case "moderate": return "text-yellow-600 bg-yellow-50"
      case "low": return "text-green-600 bg-green-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }
  
  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return <ShieldAlert className="w-5 h-5" />
      case "high": return <AlertTriangle className="w-5 h-5" />
      case "moderate": return <Info className="w-5 h-5" />
      case "low": return <CheckCircle className="w-5 h-5" />
      default: return <User className="w-5 h-5" />
    }
  }
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "destructive"
      case "medium": return "secondary"
      case "low": return "outline"
      default: return "default"
    }
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medical": return "🏥"
      case "lifestyle": return "🏃"
      case "demographic": return "👤"
      case "social": return "👥"
      default: return "📊"
    }
  }
  
  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-red-500"
    if (score >= 50) return "bg-orange-500"
    if (score >= 30) return "bg-yellow-500"
    return "bg-green-500"
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Health Risk Assessment
        </CardTitle>
        <CardDescription>
          Comprehensive risk analysis for {memberName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Overall Risk Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getRiskLevelIcon(riskAssessment.riskLevel)}
              <span className="font-medium">Overall Risk Score</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{riskAssessment.overallScore}/100</span>
              <Badge className={cn("uppercase", getRiskLevelColor(riskAssessment.riskLevel))}>
                {riskAssessment.riskLevel} risk
              </Badge>
            </div>
          </div>
          <Progress 
            value={riskAssessment.overallScore} 
            className="h-3"
            indicatorClassName={getProgressColor(riskAssessment.overallScore)}
          />
        </div>
        
        {/* Risk Level Alert */}
        {riskAssessment.riskLevel === "critical" && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Critical Health Risk</AlertTitle>
            <AlertDescription className="text-red-700">
              This profile indicates significant health complexity requiring comprehensive insurance coverage.
            </AlertDescription>
          </Alert>
        )}
        
        {riskAssessment.riskLevel === "high" && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">High Health Risk</AlertTitle>
            <AlertDescription className="text-orange-700">
              Multiple risk factors present. Consider plans with lower out-of-pocket costs.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Risk Factors */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Risk Factors</h4>
          <div className="space-y-3">
            {riskAssessment.factors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{getCategoryIcon(factor.category)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{factor.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getImpactColor(factor.impact)} className="text-xs">
                        {factor.impact} impact
                      </Badge>
                      <span className="text-sm font-medium text-gray-600">
                        +{factor.score} pts
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Insurance Recommendations</h4>
            <div className="space-y-2">
              {riskAssessment.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}