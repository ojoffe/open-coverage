"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Activity, 
  AlertTriangle, 
  Calendar, 
  Heart, 
  Pill, 
  Stethoscope,
  TrendingUp,
  Users,
  Snowflake,
  Sun,
  Leaf,
  Flower2
} from "lucide-react"
import { HealthcareUtilization, UtilizationPrediction } from "@/lib/utilization-engine"
import { cn } from "@/lib/utils"
import { RiskAssessmentDisplay } from "./risk-assessment-display"

interface UtilizationDisplayProps {
  utilization: HealthcareUtilization
  memberName?: string
}

export function UtilizationDisplay({ utilization, memberName = "Member" }: UtilizationDisplayProps) {
  const getCurrentSeasonIcon = () => {
    const month = new Date().getMonth() + 1
    if ([12, 1, 2].includes(month)) return <Snowflake className="w-3 h-3 text-blue-500" />
    if ([3, 4, 5].includes(month)) return <Flower2 className="w-3 h-3 text-pink-500" />
    if ([6, 7, 8].includes(month)) return <Sun className="w-3 h-3 text-yellow-500" />
    return <Leaf className="w-3 h-3 text-orange-500" />
  }
  
  const getServiceIcon = (serviceType: string) => {
    if (serviceType.includes("Primary care")) return <Stethoscope className="w-4 h-4" />
    if (serviceType.includes("Specialist")) return <Users className="w-4 h-4" />
    if (serviceType.includes("Emergency")) return <AlertTriangle className="w-4 h-4" />
    if (serviceType.includes("Preventive")) return <Heart className="w-4 h-4" />
    if (serviceType.includes("mental health")) return <Activity className="w-4 h-4" />
    if (serviceType.includes("drug")) return <Pill className="w-4 h-4" />
    return <Calendar className="w-4 h-4" />
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-600 bg-red-50"
      case "medium": return "text-yellow-600 bg-yellow-50"
      case "low": return "text-green-600 bg-green-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }
  
  const getCostCategoryColor = (category: string) => {
    switch (category) {
      case "very_high": return "text-red-600"
      case "high": return "text-orange-600"
      case "moderate": return "text-yellow-600"
      case "low": return "text-green-600"
      default: return "text-gray-600"
    }
  }
  
  // Group predictions by service type
  const groupedPredictions = utilization.predictions.reduce((acc, pred) => {
    const category = pred.serviceType.includes("drug") ? "Medications" :
                    pred.serviceType.includes("Emergency") ? "Emergency Care" :
                    pred.serviceType.includes("Preventive") ? "Preventive Care" :
                    pred.serviceType.includes("mental health") ? "Mental Health" :
                    pred.serviceType.includes("Specialist") ? "Specialist Visits" :
                    "Primary Care"
    
    if (!acc[category]) acc[category] = []
    acc[category].push(pred)
    return acc
  }, {} as Record<string, UtilizationPrediction[]>)
  
  return (
    <div className="space-y-6">
      {/* Risk Assessment */}
      {utilization.riskAssessment && (
        <RiskAssessmentDisplay 
          riskAssessment={utilization.riskAssessment}
          memberName={memberName}
        />
      )}
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Healthcare Utilization Prediction
          </CardTitle>
          <CardDescription>
            Estimated annual healthcare usage for {memberName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-gray-900">{utilization.totalVisits}</div>
              <div className="text-sm text-gray-600">Total Annual Visits</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={cn("text-3xl font-bold", getCostCategoryColor(utilization.costCategory))}>
                {utilization.costCategory.replace("_", " ").toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Cost Category</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {Math.round(utilization.emergencyRisk * 100)}%
              </div>
              <div className="text-sm text-gray-600">Emergency Risk</div>
            </div>
          </div>
          
          {/* Seasonal Notice */}
          {utilization.predictions.some(p => p.seasonalAdjustment && p.seasonalAdjustment > 1.1) && (
            <Alert className="mb-6">
              <div className="flex items-center gap-2">
                {getCurrentSeasonIcon()}
                <AlertDescription>
                  <strong>Seasonal Variation:</strong> Some conditions may have increased healthcare needs during this season.
                </AlertDescription>
              </div>
            </Alert>
          )}
          
          {/* Emergency Risk Bar */}
          {utilization.emergencyRisk > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Emergency Department Risk</span>
                <span className="text-sm text-gray-600">
                  {Math.round(utilization.emergencyRisk * 100)}% likelihood
                </span>
              </div>
              <Progress 
                value={utilization.emergencyRisk * 100} 
                className="h-2"
              />
            </div>
          )}
          
          {/* Primary Conditions */}
          {utilization.primaryConditions.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium mb-2">Primary Health Conditions</h4>
              <div className="flex flex-wrap gap-2">
                {utilization.primaryConditions.map(condition => (
                  <Badge key={condition} variant="secondary">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {utilization.recommendations.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Insurance Recommendations:</strong>
                <ul className="mt-2 space-y-1">
                  {utilization.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Detailed Predictions by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(groupedPredictions).map(([category, predictions]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {getServiceIcon(predictions[0].serviceType)}
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.map((pred, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{pred.serviceType}</span>
                      <div className="flex items-center gap-2">
                        {pred.seasonalAdjustment && pred.seasonalAdjustment > 1.1 && (
                          <span title="Seasonal variation expected">
                            {getCurrentSeasonIcon()}
                          </span>
                        )}
                        <Badge className={cn("text-xs", getSeverityColor(pred.severity))}>
                          {pred.annualVisits} visits/year
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{pred.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}