"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Calendar,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from "lucide-react"
import { PolicyCostAnalysis, InsurancePolicy } from "@/lib/insurance-calculator"
import { cn } from "@/lib/utils"

interface PolicyCostAnalysisProps {
  analysis: PolicyCostAnalysis
  policy: InsurancePolicy
  onSelect?: () => void
  isRecommended?: boolean
}

export function PolicyCostAnalysisDisplay({ 
  analysis, 
  policy, 
  onSelect,
  isRecommended = false 
}: PolicyCostAnalysisProps) {
  const [selectedTab, setSelectedTab] = useState("overview")
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }
  
  const getDeductibleProgress = () => {
    return (analysis.annual.deductibleMet / policy.deductible.individual) * 100
  }
  
  const getOOPProgress = () => {
    return (analysis.annual.totalOutOfPocket / policy.outOfPocketMax.individual) * 100
  }
  
  return (
    <Card className={cn(
      "relative overflow-hidden",
      isRecommended && "ring-2 ring-blue-500"
    )}>
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
          Recommended
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{policy.name}</CardTitle>
            <CardDescription>
              {policy.carrier} • {policy.type}
              {policy.benefits?.hsaEligible && (
                <Badge variant="secondary" className="ml-2">HSA Eligible</Badge>
              )}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(analysis.annual.totalCosts)}</p>
            <p className="text-sm text-muted-foreground">Total Annual Cost</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Monthly Premium</span>
                  <span className="font-medium">
                    {formatCurrency(analysis.annual.premiums / 12)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Deductible</span>
                  <span className="font-medium">
                    {formatCurrency(policy.deductible.individual)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Out-of-Pocket Max</span>
                  <span className="font-medium">
                    {formatCurrency(policy.outOfPocketMax.individual)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Medical Costs</span>
                  <span className="font-medium">
                    {formatCurrency(analysis.annual.medicalCosts)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Medication Costs</span>
                  <span className="font-medium">
                    {formatCurrency(analysis.annual.medicationCosts)}
                  </span>
                </div>
                {analysis.annual.hsaSavings && (
                  <div className="flex items-center justify-between text-sm">
                    <span>HSA Contribution</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(analysis.annual.hsaSavings)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Indicators */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Deductible Progress</span>
                  <span>{formatCurrency(analysis.annual.deductibleMet)} / {formatCurrency(policy.deductible.individual)}</span>
                </div>
                <Progress value={getDeductibleProgress()} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Out-of-Pocket Progress</span>
                  <span>{formatCurrency(analysis.annual.totalOutOfPocket)} / {formatCurrency(policy.outOfPocketMax.individual)}</span>
                </div>
                <Progress value={getOOPProgress()} className="h-2" />
              </div>
            </div>
            
            {/* Key Features */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={analysis.keyMetrics.riskProtection === 'high' ? 'default' : 'secondary'}>
                <Shield className="w-3 h-3 mr-1" />
                {analysis.keyMetrics.riskProtection} Protection
              </Badge>
              {analysis.keyMetrics.deductibleMetMonth && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  Deductible by Month {analysis.keyMetrics.deductibleMetMonth}
                </Badge>
              )}
              {policy.network.outOfNetworkCoverage && (
                <Badge variant="outline">
                  Out-of-Network Coverage
                </Badge>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="breakdown" className="space-y-4">
            {/* Monthly Timeline */}
            <div>
              <h4 className="text-sm font-medium mb-3">Monthly Cost Timeline</h4>
              <div className="space-y-2">
                {analysis.monthly.slice(0, 6).map((month) => (
                  <div key={month.month} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-muted-foreground">Month {month.month}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ 
                            width: `${(month.premium + month.medical.totalYourCost + month.medications.totalYourCost) / 
                                     (analysis.annual.totalCosts / 12) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="font-medium">
                        {formatCurrency(month.premium + month.medical.totalYourCost + month.medications.totalYourCost)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {analysis.monthly.length > 6 && (
                <p className="text-sm text-muted-foreground mt-2">
                  + {analysis.monthly.length - 6} more months
                </p>
              )}
            </div>
            
            {/* Cost Categories */}
            <div>
              <h4 className="text-sm font-medium mb-3">Annual Cost Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Premiums</span>
                  <span className="font-medium">{formatCurrency(analysis.annual.premiums)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Medical Services</span>
                  <span className="font-medium">{formatCurrency(analysis.annual.medicalCosts)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Medications</span>
                  <span className="font-medium">{formatCurrency(analysis.annual.medicationCosts)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium">Total Annual Cost</span>
                  <span className="font-bold text-blue-600">{formatCurrency(analysis.annual.totalCosts)}</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="scenarios" className="space-y-4">
            {/* Scenario Analysis */}
            <div className="space-y-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Best Case</h4>
                    <p className="text-sm text-muted-foreground">{analysis.scenarios.bestCase.description}</p>
                    <p className="text-lg font-semibold mt-1">{formatCurrency(analysis.scenarios.bestCase.totalCost)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg border-blue-200 bg-blue-50">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Expected Case</h4>
                    <p className="text-sm text-muted-foreground">{analysis.scenarios.likelyCase.description}</p>
                    <p className="text-lg font-semibold mt-1">{formatCurrency(analysis.scenarios.likelyCase.totalCost)}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium">Worst Case</h4>
                    <p className="text-sm text-muted-foreground">{analysis.scenarios.worstCase.description}</p>
                    <p className="text-lg font-semibold mt-1">{formatCurrency(analysis.scenarios.worstCase.totalCost)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Risk Protection */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Maximum financial exposure with this plan is {formatCurrency(policy.premium.individual + policy.outOfPocketMax.individual)} 
                ({formatCurrency(policy.premium.individual)} in premiums + {formatCurrency(policy.outOfPocketMax.individual)} out-of-pocket maximum)
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        {onSelect && (
          <button
            onClick={onSelect}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select This Plan
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </CardContent>
    </Card>
  )
}