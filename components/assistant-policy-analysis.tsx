"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { usePolicy } from "@/components/policy-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHealthProfileStore } from "@/lib/health-profile-store";
import {
  Activity,
  AlertCircle,
  FileText,
  Heart,
  Shield,
  User
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface CostEstimate {
  service: string;
  frequency: number;
  unitCost: number;
  annualCost: number;
  coveredAmount: number;
  yourCost: number;
}

export default function AssistantPolicyAnalysis() {
  const policyContext = usePolicy();
  const { members } = useHealthProfileStore();
  
  const policy = policyContext?.policy;
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [totalAnnualCost, setTotalAnnualCost] = useState(0);
  
  const hasHealthProfile = members.length > 0 && members[0].age && (
    members[0].conditions.length > 0 || 
    members[0].medications.length > 0 ||
    members[0].otherServices?.length > 0
  );

  // Calculate cost estimates based on health profile and policy
  useEffect(() => {
    if (!policy || !hasHealthProfile) return;

    const estimates: CostEstimate[] = [];
    let total = 0;

    // Aggregate healthcare needs across all members
    members.forEach(member => {
      // Primary care visits based on age and conditions
      const primaryCareVisits = calculatePrimaryCareVisits(member);
      if (primaryCareVisits > 0) {
        const service = policy.services_you_may_need.find(s => 
          s.name.toLowerCase().includes('primary care')
        );
        if (service) {
          const cost = extractCost(service.what_you_will_pay.network_provider);
          estimates.push({
            service: `Primary Care Visits (${member.name || 'Member'})`,
            frequency: primaryCareVisits,
            unitCost: cost,
            annualCost: cost * primaryCareVisits,
            coveredAmount: 0, // Simplified for now
            yourCost: cost * primaryCareVisits
          });
          total += cost * primaryCareVisits;
        }
      }

      // Specialist visits based on conditions
      const specialistVisits = calculateSpecialistVisits(member);
      if (specialistVisits > 0) {
        const service = policy.services_you_may_need.find(s => 
          s.name.toLowerCase().includes('specialist')
        );
        if (service) {
          const cost = extractCost(service.what_you_will_pay.network_provider);
          estimates.push({
            service: `Specialist Visits (${member.name || 'Member'})`,
            frequency: specialistVisits,
            unitCost: cost,
            annualCost: cost * specialistVisits,
            coveredAmount: 0,
            yourCost: cost * specialistVisits
          });
          total += cost * specialistVisits;
        }
      }

      // Medications
      member.medications.forEach(med => {
        const service = policy.services_you_may_need.find(s => 
          s.name.toLowerCase().includes('generic') || 
          s.name.toLowerCase().includes('preferred brand')
        );
        if (service) {
          const cost = extractCost(service.what_you_will_pay.network_provider);
          const annualFills = 12; // Monthly refills
          estimates.push({
            service: `${med} (${member.name || 'Member'})`,
            frequency: annualFills,
            unitCost: cost,
            annualCost: cost * annualFills,
            coveredAmount: 0,
            yourCost: cost * annualFills
          });
          total += cost * annualFills;
        }
      });
    });

    setCostEstimates(estimates);
    setTotalAnnualCost(total);
  }, [policy, members, hasHealthProfile]);

  function calculatePrimaryCareVisits(member: any): number {
    const baseVisits = member.age < 18 ? 2 : member.age > 65 ? 4 : 1;
    const conditionVisits = member.conditions.length * 2;
    return baseVisits + conditionVisits;
  }

  function calculateSpecialistVisits(member: any): number {
    return member.conditions.length * 3; // Assume 3 visits per condition per year
  }

  function extractCost(costString: string): number {
    const match = costString.match(/\$(\d+)/);
    if (match) return parseInt(match[1]);
    if (costString.toLowerCase().includes('no charge')) return 0;
    if (costString.toLowerCase().includes('not covered')) return 500; // High default
    return 100; // Default cost
  }

  if (!policy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Policy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No policy uploaded yet. Upload a health insurance policy document to see analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Profile Status */}
      {!hasHealthProfile && (
        <Alert className="border-blue-200 bg-blue-50">
          <Heart className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="font-semibold mb-1">Complete your health profile for personalized analysis</div>
            <div className="text-sm text-blue-800 mb-2">
              Get accurate cost estimates based on your specific medical needs and conditions.
            </div>
            <Button asChild size="sm" variant="default">
              <Link href="/health-profile">
                <User className="w-4 h-4 mr-2" />
                Set Up Health Profile
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="coverage">Coverage Details</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
        </TabsList>

        {/* AI Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ask About Your Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <Thread />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Details Tab */}
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Plan Name</h4>
                  <p>{policy.plan_summary.plan_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Plan Type</h4>
                  <p>{policy.plan_summary.plan_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Individual Deductible</h4>
                  <p className="text-lg font-semibold">
                    ${policy.important_questions.overall_deductible.individual.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Out-of-Pocket Max</h4>
                  <p className="text-lg font-semibold">
                    ${policy.important_questions.out_of_pocket_limit_for_plan.individual.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Covered Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {policy.services_you_may_need.slice(0, 10).map((service, index) => (
                  <div key={index} className="border-b pb-3 last:border-0">
                    <div className="font-medium">{service.name}</div>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">In-Network: </span>
                        <span className="font-medium">{service.what_you_will_pay.network_provider}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Out-of-Network: </span>
                        <span className="font-medium">{service.what_you_will_pay.out_of_network_provider}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Analysis Tab */}
        <TabsContent value="costs" className="space-y-4">
          {hasHealthProfile ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Estimated Annual Costs</span>
                    <Badge variant="secondary" className="text-lg">
                      ${totalAnnualCost.toLocaleString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {costEstimates.map((estimate, index) => (
                      <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div>
                          <div className="font-medium">{estimate.service}</div>
                          <div className="text-sm text-muted-foreground">
                            {estimate.frequency} × ${estimate.unitCost} per visit
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${estimate.yourCost.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">annual cost</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Breakdown by Member</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members.map((member, index) => (
                      <div key={member.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {member.name || `Member ${index + 1}`}
                          </h4>
                          <Badge variant="outline">Age {member.age}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          {member.conditions.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Conditions:</span>
                              <span>{member.conditions.join(", ")}</span>
                            </div>
                          )}
                          {member.medications.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Heart className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">Medications:</span>
                              <span>{member.medications.join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold text-lg mb-2">No Cost Analysis Available</h3>
                <p className="text-muted-foreground mb-4">
                  Complete your health profile to see personalized cost estimates.
                </p>
                <Button asChild>
                  <Link href="/health-profile">
                    <User className="w-4 h-4 mr-2" />
                    Set Up Health Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}