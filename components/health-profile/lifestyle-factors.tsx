"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Member } from "@/lib/health-profile-store"

interface LifestyleFactorsProps {
  member: Member
  onUpdate: (updates: Partial<Member>) => void
}

export function LifestyleFactors({ member, onUpdate }: LifestyleFactorsProps) {
  return (
    <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h4 className="text-sm font-medium mb-2">Lifestyle Factors</h4>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="text-sm">Smoking Status</Label>
          <Select 
            value={member.smokingStatus} 
            onValueChange={(value) => onUpdate({ smokingStatus: value as 'never' | 'former' | 'current' | 'unknown' })}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select smoking status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="never">Never smoked</SelectItem>
              <SelectItem value="former">Former smoker</SelectItem>
              <SelectItem value="current">Current smoker</SelectItem>
              <SelectItem value="unknown">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Alcohol Use</Label>
          <Select 
            value={member.alcoholUse} 
            onValueChange={(value) => onUpdate({ alcoholUse: value as 'none' | 'moderate' | 'heavy' | 'unknown' })}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select alcohol use" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="moderate">Moderate (1-2 drinks/day)</SelectItem>
              <SelectItem value="heavy">Heavy (3+ drinks/day)</SelectItem>
              <SelectItem value="unknown">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm">Exercise Frequency</Label>
          <Select 
            value={member.exerciseFrequency} 
            onValueChange={(value) => onUpdate({ exerciseFrequency: value as 'none' | 'occasional' | 'regular' | 'daily' })}
          >
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Select exercise frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sedentary</SelectItem>
              <SelectItem value="occasional">Occasional (1-2x/week)</SelectItem>
              <SelectItem value="regular">Regular (3-4x/week)</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
} 