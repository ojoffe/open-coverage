"use client"

import { AIAutocomplete } from "@/components/ui/ai-autocomplete"
import { Label } from "@/components/ui/label"
import type { Member } from "@/lib/health-profile-store"
import { useCallback, useEffect, useRef } from "react"

interface MedicalInformationProps {
  member: Member
  onUpdate: (updates: Partial<Member>) => void
}

export function MedicalInformation({ member, onUpdate }: MedicalInformationProps) {
  // Use a ref to store the latest onUpdate function to avoid dependency issues
  const onUpdateRef = useRef(onUpdate)
  useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  // Create stable handlers that don't depend on any props
  const handleConditionsChange = useCallback((conditions: string[]) => {
    onUpdateRef.current({ conditions })
  }, [])

  const handleMedicationsChange = useCallback((medications: string[]) => {
    onUpdateRef.current({ medications })
  }, [])

  const handleAllergiesChange = useCallback((allergies: string[]) => {
    onUpdateRef.current({ allergies })
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`conditions-${member.id}`} className="text-sm">Medical Conditions</Label>
        <AIAutocomplete
          placeholder="Type or select conditions (e.g., diabetes, hypertension)"
          value={member.conditions || []}
          onChange={handleConditionsChange}
          options={[]}
          searchType="conditions"
          className="mt-1"
        />
        <span id={`conditions-desc-${member.id}`} className="sr-only">
          Enter or select medical conditions. You can add multiple conditions.
        </span>
      </div>

      <div>
        <Label htmlFor={`medications-${member.id}`} className="text-sm">Current Medications</Label>
        <AIAutocomplete
          placeholder="Type or select medications"
          value={member.medications || []}
          onChange={handleMedicationsChange}
          options={[]}
          searchType="medications"
          className="mt-1"
        />
        <span id={`medications-desc-${member.id}`} className="sr-only">
          Enter or select current medications. You can add multiple medications.
        </span>
      </div>

      <div>
        <Label htmlFor={`allergies-${member.id}`} className="text-sm">Allergies</Label>
        <AIAutocomplete
          placeholder="Type or select allergies"
          value={member.allergies || []}
          onChange={handleAllergiesChange}
          options={[]}
          searchType="allergies"
          className="mt-1"
        />
        <span id={`allergies-desc-${member.id}`} className="sr-only">
          Enter or select known allergies. You can add multiple allergies.
        </span>
      </div>
    </div>
  )
} 