"use client"

import { Label } from "@/components/ui/label"
import { AIAutocomplete } from "@/components/ui/ai-autocomplete"
import type { Member } from "@/lib/health-profile-store"

interface MedicalInformationProps {
  member: Member
  onUpdate: (updates: Partial<Member>) => void
}

export function MedicalInformation({ member, onUpdate }: MedicalInformationProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor={`conditions-${member.id}`} className="text-sm">Medical Conditions</Label>
        <AIAutocomplete
          id={`conditions-${member.id}`}
          placeholder="Type or select conditions (e.g., diabetes, hypertension)"
          value={member.conditions || []}
          onChange={(conditions) => onUpdate({ conditions })}
          options={[]}
          searchType="conditions"
          className="mt-1"
          aria-label="Medical conditions"
          aria-describedby={`conditions-desc-${member.id}`}
        />
        <span id={`conditions-desc-${member.id}`} className="sr-only">
          Enter or select medical conditions. You can add multiple conditions.
        </span>
      </div>

      <div>
        <Label htmlFor={`medications-${member.id}`} className="text-sm">Current Medications</Label>
        <AIAutocomplete
          id={`medications-${member.id}`}
          placeholder="Type or select medications"
          value={member.medications || []}
          onChange={(medications) => onUpdate({ medications })}
          options={[]}
          searchType="medications"
          className="mt-1"
          aria-label="Current medications"
          aria-describedby={`medications-desc-${member.id}`}
        />
        <span id={`medications-desc-${member.id}`} className="sr-only">
          Enter or select current medications. You can add multiple medications.
        </span>
      </div>

      <div>
        <Label htmlFor={`allergies-${member.id}`} className="text-sm">Allergies</Label>
        <AIAutocomplete
          id={`allergies-${member.id}`}
          placeholder="Type or select allergies"
          value={member.allergies || []}
          onChange={(allergies) => onUpdate({ allergies })}
          options={[]}
          searchType="allergies"
          className="mt-1"
          aria-label="Known allergies"
          aria-describedby={`allergies-desc-${member.id}`}
        />
        <span id={`allergies-desc-${member.id}`} className="sr-only">
          Enter or select known allergies. You can add multiple allergies.
        </span>
      </div>
    </div>
  )
} 