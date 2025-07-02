"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { Member } from "@/lib/health-profile-store"

interface BasicInformationProps {
  member: Member
  onUpdate: (updates: Partial<Member>) => void
}

export function BasicInformation({ member, onUpdate }: BasicInformationProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
      </div>
      
      {/* Height, Weight, BMI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div>
          <Label htmlFor={`age-${member.id}`} className="text-sm">Age</Label>
          <Input
            id={`age-${member.id}`}
            type="number"
            value={member.age}
            onChange={(e) => onUpdate({ age: e.target.value })}
            placeholder="Age"
            className="mt-1"
            aria-label="Member age"
            aria-describedby={`age-desc-${member.id}`}
            min="0"
            max="120"
          />
          <span id={`age-desc-${member.id}`} className="sr-only">Enter age between 0 and 120 years</span>
        </div>
        <div>
          <Label htmlFor={`gender-${member.id}`} className="text-sm">Gender</Label>
          <Select 
            value={member.gender || 'prefer_not_to_say'} 
            onValueChange={(value) => onUpdate({ gender: value as 'male' | 'female' | 'other' | 'prefer_not_to_say' })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`height-${member.id}`} className="text-sm">Height</Label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Input
                id={`height-feet-${member.id}`}
                type="number"
                value={member.height ? Math.floor(member.height / 12) : ''}
                onChange={(e) => {
                  const feet = parseInt(e.target.value) || 0
                  const inches = member.height ? member.height % 12 : 0
                  const totalInches = feet * 12 + inches
                  onUpdate({ 
                    height: totalInches,
                    bmi: member.weight && totalInches ? 
                      Number(((member.weight / (totalInches * totalInches)) * 703).toFixed(1)) : undefined
                  })
                }}
                placeholder="5"
                className="w-14 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Height in feet"
                min="0"
                max="8"
              />
              <span className="text-sm text-gray-500">ft</span>
            </div>
            <div className="flex items-center gap-1">
              <Input
                id={`height-inches-${member.id}`}
                type="number"
                value={member.height ? member.height % 12 : ''}
                onChange={(e) => {
                  const inches = parseInt(e.target.value) || 0
                  const feet = member.height ? Math.floor(member.height / 12) : 0
                  const totalInches = feet * 12 + inches
                  onUpdate({ 
                    height: totalInches,
                    bmi: member.weight && totalInches ? 
                      Number(((member.weight / (totalInches * totalInches)) * 703).toFixed(1)) : undefined
                  })
                }}
                placeholder="10"
                className="w-14 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Height in inches"
                min="0"
                max="11"
              />
              <span className="text-sm text-gray-500">in</span>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor={`weight-${member.id}`} className="text-sm">Weight</Label>
          <div className="flex items-center gap-1 mt-1">
            <Input
              id={`weight-${member.id}`}
              type="number"
              value={member.weight || ''}
              onChange={(e) => {
                const weight = parseFloat(e.target.value) || 0
                onUpdate({ 
                  weight,
                  bmi: weight && member.height ? 
                    Number(((weight / (member.height * member.height)) * 703).toFixed(1)) : undefined
                })
              }}
              placeholder="150"
              className="flex-1 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Weight in pounds"
              min="0"
              max="1000"
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">lbs</span>
          </div>
        </div>
        <div>
          <Label className="text-sm">BMI</Label>
          <div className="mt-1 h-10 px-3 py-2 bg-gray-100 rounded-md flex items-center">
            {member.bmi ? (
              <span className={cn(
                "font-medium",
                member.bmi < 18.5 ? "text-blue-600" :
                member.bmi < 25 ? "text-green-600" :
                member.bmi < 30 ? "text-yellow-600" : "text-red-600"
              )}>
                {member.bmi} 
                <span className="text-xs ml-1">
                  ({member.bmi < 18.5 ? "Underweight" :
                    member.bmi < 25 ? "Normal" :
                    member.bmi < 30 ? "Overweight" : "Obese"})
                </span>
              </span>
            ) : (
              <span className="text-gray-400 text-sm">Auto-calculated</span>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 