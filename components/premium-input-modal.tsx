"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card } from "@/components/ui/card"
import { DollarSign, Info, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PolicyPremium {
  policyId: string
  policyName: string
  individualMonthly: number
  familyMonthly?: number
  employerContribution?: number
}

interface PremiumInputModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  policies: Array<{
    id: string
    name: string
  }>
  onSubmit: (premiums: PolicyPremium[]) => void
  familySize?: number
}

export function PremiumInputModal({
  open,
  onOpenChange,
  policies,
  onSubmit,
  familySize = 1
}: PremiumInputModalProps) {
  const [premiums, setPremiums] = useState<Record<string, PolicyPremium>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Initialize premiums for all policies
  useState(() => {
    const initial: Record<string, PolicyPremium> = {}
    policies.forEach(policy => {
      initial[policy.id] = {
        policyId: policy.id,
        policyName: policy.name,
        individualMonthly: 0,
        familyMonthly: familySize > 1 ? 0 : undefined,
        employerContribution: 0
      }
    })
    setPremiums(initial)
  })
  
  const handlePremiumChange = (policyId: string, field: keyof PolicyPremium, value: string) => {
    const numValue = parseFloat(value) || 0
    
    setPremiums(prev => ({
      ...prev,
      [policyId]: {
        ...prev[policyId],
        [field]: numValue
      }
    }))
    
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[`${policyId}-${field}`]
      return newErrors
    })
  }
  
  const validatePremiums = () => {
    const newErrors: Record<string, string> = {}
    
    policies.forEach(policy => {
      const premium = premiums[policy.id]
      
      if (!premium.individualMonthly || premium.individualMonthly <= 0) {
        newErrors[`${policy.id}-individualMonthly`] = "Individual premium is required"
      }
      
      if (familySize > 1 && (!premium.familyMonthly || premium.familyMonthly <= 0)) {
        newErrors[`${policy.id}-familyMonthly`] = "Family premium is required"
      }
      
      if (premium.employerContribution && premium.employerContribution < 0) {
        newErrors[`${policy.id}-employerContribution`] = "Employer contribution cannot be negative"
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = () => {
    if (validatePremiums()) {
      onSubmit(Object.values(premiums))
      onOpenChange(false)
    }
  }
  
  const estimateAnnualCost = (premium: PolicyPremium) => {
    const monthlyPremium = familySize > 1 ? (premium.familyMonthly || 0) : premium.individualMonthly
    const monthlyAfterEmployer = monthlyPremium - (premium.employerContribution || 0)
    return monthlyAfterEmployer * 12
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Enter Monthly Premiums
          </DialogTitle>
          <DialogDescription>
            Your insurance documents don't include premium information. Please enter the monthly costs for each policy.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You can find premium information in your benefits enrollment materials, 
              pay stubs, or by contacting your HR department.
            </AlertDescription>
          </Alert>
          
          {familySize > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Your health profile includes {familySize} family members</span>
            </div>
          )}
          
          {policies.map((policy, index) => (
            <Card key={policy.id} className="p-4">
              <h3 className="font-medium mb-4">{policy.name}</h3>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${policy.id}-individual`}>
                      Individual Monthly Premium
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <Input
                        id={`${policy.id}-individual`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className={cn(
                          "pl-9",
                          errors[`${policy.id}-individualMonthly`] && "border-red-500"
                        )}
                        value={premiums[policy.id]?.individualMonthly || ''}
                        onChange={(e) => handlePremiumChange(policy.id, 'individualMonthly', e.target.value)}
                      />
                    </div>
                    {errors[`${policy.id}-individualMonthly`] && (
                      <p className="text-sm text-red-500">{errors[`${policy.id}-individualMonthly`]}</p>
                    )}
                  </div>
                  
                  {familySize > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor={`${policy.id}-family`}>
                        Family Monthly Premium
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id={`${policy.id}-family`}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className={cn(
                            "pl-9",
                            errors[`${policy.id}-familyMonthly`] && "border-red-500"
                          )}
                          value={premiums[policy.id]?.familyMonthly || ''}
                          onChange={(e) => handlePremiumChange(policy.id, 'familyMonthly', e.target.value)}
                        />
                      </div>
                      {errors[`${policy.id}-familyMonthly`] && (
                        <p className="text-sm text-red-500">{errors[`${policy.id}-familyMonthly`]}</p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`${policy.id}-employer`}>
                    Employer Monthly Contribution (optional)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      id={`${policy.id}-employer`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-9"
                      value={premiums[policy.id]?.employerContribution || ''}
                      onChange={(e) => handlePremiumChange(policy.id, 'employerContribution', e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Amount your employer pays toward your premium each month
                  </p>
                </div>
                
                {premiums[policy.id]?.individualMonthly > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your estimated annual cost:</span>
                      <span className="font-semibold">
                        ${estimateAnnualCost(premiums[policy.id]).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip for Now
          </Button>
          <Button onClick={handleSubmit}>
            Save Premiums
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}