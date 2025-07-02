"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { UtilizationDisplay } from "@/components/utilization-display"
import type { Member } from "@/lib/health-profile-store"
import type { HealthcareUtilization as UtilizationData } from "@/lib/utilization-engine"

interface MemberUtilization {
  memberId: string
  memberName: string
  utilization: UtilizationData | null
  hasConditions: boolean
  hasBasicData: boolean
}

interface UtilizationAnalysisProps {
  memberUtilizations: MemberUtilization[]
  members: Member[]
  showUtilization: boolean
  selectedMemberId: string
  onToggleUtilization: () => void
  onSelectMember: (memberId: string) => void
}

export function UtilizationAnalysis({
  memberUtilizations,
  members,
  showUtilization,
  selectedMemberId,
  onToggleUtilization,
  onSelectMember
}: UtilizationAnalysisProps) {
  if (!memberUtilizations.some(mu => mu.utilization)) {
    return null
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Healthcare Utilization Analysis</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {memberUtilizations.some(mu => mu.hasBasicData) ? "Live updating" : "Add age to see analysis"}
          </span>
          <Button 
            variant="outline" 
            onClick={onToggleUtilization}
            disabled={!memberUtilizations.some(mu => mu.hasBasicData)}
          >
            {showUtilization ? "Hide" : "Show"} Analysis
          </Button>
        </div>
      </div>
      
      {showUtilization && (
        <>
          {/* Member Selector */}
          {members.length > 1 && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Select Member for Analysis</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {memberUtilizations.map((mu, index) => {
                  const member = members.find(m => m.id === mu.memberId)
                  if (!member || !member.age) return null
                  
                  const riskLevel = mu.utilization?.riskAssessment?.riskLevel || "low"
                  const riskColor = riskLevel === "high" || riskLevel === "critical" ? "border-red-500 bg-red-50" :
                                  riskLevel === "moderate" ? "border-yellow-500 bg-yellow-50" :
                                  "border-green-500 bg-green-50"
                  const riskTextColor = riskLevel === "high" || riskLevel === "critical" ? "text-red-700" :
                                      riskLevel === "moderate" ? "text-yellow-700" :
                                      "text-green-700"
                  
                  return (
                    <button
                      key={mu.memberId}
                      onClick={() => onSelectMember(mu.memberId)}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        selectedMemberId === mu.memberId
                          ? `${riskColor} ${riskTextColor} border-opacity-100`
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      )}
                      disabled={!mu.hasBasicData}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">
                          {index === 0 ? "Primary Member" : `Member ${index + 1}`}
                        </span>
                        {mu.hasConditions && mu.utilization && (
                          <Badge 
                            variant={riskLevel === "high" || riskLevel === "critical" ? "destructive" : 
                                    riskLevel === "moderate" ? "secondary" : 
                                    "default"}
                            className="text-xs"
                          >
                            {riskLevel} risk
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Age {member.age}
                        {member.gender && member.gender !== 'prefer_not_to_say' && 
                          ` • ${member.gender.charAt(0).toUpperCase() + member.gender.slice(1)}`}
                      </div>
                      {mu.hasBasicData ? (
                        <div className="text-xs mt-1">
                          {mu.hasConditions ? 
                            `${member.conditions.filter(c => c !== "NONE").length} condition(s)` :
                            "Baseline analysis"}
                        </div>
                      ) : (
                        <div className="text-xs mt-1 text-gray-400">
                          Age required for analysis
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Utilization Display */}
          {(() => {
            const selectedUtilization = memberUtilizations.find(mu => mu.memberId === selectedMemberId)
            const selectedMember = members.find(m => m.id === selectedMemberId)
            const memberIndex = members.findIndex(m => m.id === selectedMemberId)
            
            if (selectedUtilization?.utilization) {
              return (
                <UtilizationDisplay 
                  utilization={selectedUtilization.utilization}
                  memberName={memberIndex === 0 ? 
                    `Primary Member (Age ${selectedMember?.age})` : 
                    `Member ${memberIndex + 1} (Age ${selectedMember?.age})`}
                />
              )
            } else {
              return (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      {selectedMember?.age ? 
                        "Analysis will be available once healthcare utilization can be calculated. Try adding more demographic information." :
                        "Add age to see baseline healthcare utilization predictions and analysis."}
                    </p>
                  </CardContent>
                </Card>
              )
            }
          })()}
        </>
      )}
    </div>
  )
} 