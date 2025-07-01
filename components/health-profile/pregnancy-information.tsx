"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Baby } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Member } from "@/lib/health-profile-store"

interface PregnancyInformationProps {
  member: Member
  onUpdate: (updates: Partial<Member>) => void
}

export function PregnancyInformation({ member, onUpdate }: PregnancyInformationProps) {
  const [dueDate, setDueDate] = useState<Date | undefined>(
    member.pregnancyStatus?.dueDate ? new Date(member.pregnancyStatus.dueDate) : undefined
  )

  if (member.gender !== 'female') {
    return null
  }

  return (
    <div className="space-y-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Baby className="w-4 h-4 text-pink-600" />
        <span>Pregnancy Information</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm">Pregnancy Status</Label>
          <Select 
            value={member.pregnancyStatus?.isPregnant ? 'yes' : 'no'} 
            onValueChange={(value) => {
              if (value === 'no') {
                onUpdate({ pregnancyStatus: undefined })
                setDueDate(undefined)
              } else {
                onUpdate({ 
                  pregnancyStatus: { 
                    isPregnant: true,
                    dueDate: dueDate?.toISOString(),
                    isHighRisk: false,
                    multiples: false,
                    plannedDeliveryType: 'unknown'
                  } 
                })
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">Not pregnant</SelectItem>
              <SelectItem value="yes">Currently pregnant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {member.pregnancyStatus?.isPregnant && (
          <div>
            <Label className="text-sm">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? (
                    format(dueDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date)
                    if (date && member.pregnancyStatus) {
                      onUpdate({
                        pregnancyStatus: {
                          ...member.pregnancyStatus,
                          dueDate: date.toISOString()
                        }
                      })
                    }
                  }}
                  disabled={(date) =>
                    date < new Date() || date > new Date(new Date().setMonth(new Date().getMonth() + 9))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      {member.pregnancyStatus?.isPregnant && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Risk Level</Label>
            <Select 
              value={member.pregnancyStatus.isHighRisk ? 'high' : 'normal'} 
              onValueChange={(value) => {
                onUpdate({
                  pregnancyStatus: {
                    ...member.pregnancyStatus!,
                    isHighRisk: value === 'high'
                  }
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal risk</SelectItem>
                <SelectItem value="high">High risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Multiples</Label>
            <RadioGroup 
              value={member.pregnancyStatus.multiples ? 'yes' : 'no'}
              onValueChange={(value) => {
                onUpdate({
                  pregnancyStatus: {
                    ...member.pregnancyStatus!,
                    multiples: value === 'yes'
                  }
                })
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`multiples-no-${member.id}`} />
                <Label htmlFor={`multiples-no-${member.id}`} className="text-sm font-normal">Single</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`multiples-yes-${member.id}`} />
                <Label htmlFor={`multiples-yes-${member.id}`} className="text-sm font-normal">Twins or more</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label className="text-sm">Planned Delivery Type</Label>
            <Select 
              value={member.pregnancyStatus.plannedDeliveryType || 'unknown'} 
              onValueChange={(value) => {
                onUpdate({
                  pregnancyStatus: {
                    ...member.pregnancyStatus!,
                    plannedDeliveryType: value as 'vaginal' | 'cesarean' | 'unknown'
                  }
                })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Not determined</SelectItem>
                <SelectItem value="vaginal">Vaginal delivery</SelectItem>
                <SelectItem value="cesarean">Cesarean section</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
} 