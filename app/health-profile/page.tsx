"use client"

import type React from "react"

import { useState } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, User, Trash2 } from "lucide-react"
import { useHealthProfileStore } from "@/lib/health-profile-store"

interface MedicalVisit {
  id: string
  name: string
  frequency: string
}

interface TagInputProps {
  label: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder: string
}

function TagInput({ label, tags, onTagsChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onTagsChange([...tags, inputValue.trim()])
      setInputValue("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" onClick={addTag} size="sm">
          Add
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
            {tag}
            <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
          </Badge>
        ))}
      </div>
    </div>
  )
}

interface VisitInputProps {
  visits: MedicalVisit[]
  onVisitsChange: (visits: MedicalVisit[]) => void
}

function VisitInput({ visits, onVisitsChange }: VisitInputProps) {
  const [visitName, setVisitName] = useState("")
  const [visitFrequency, setVisitFrequency] = useState("")

  const addVisit = () => {
    if (visitName.trim() && visitFrequency.trim()) {
      const newVisit: MedicalVisit = {
        id: Date.now().toString(),
        name: visitName.trim(),
        frequency: visitFrequency.trim(),
      }
      onVisitsChange([...visits, newVisit])
      setVisitName("")
      setVisitFrequency("")
    }
  }

  const removeVisit = (visitId: string) => {
    onVisitsChange(visits.filter((visit) => visit.id !== visitId))
  }

  return (
    <div className="space-y-2">
      <Label>Expected Medical Visits (Next Year)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          value={visitName}
          onChange={(e) => setVisitName(e.target.value)}
          placeholder="Visit type (e.g., Annual checkup)"
        />
        <Input
          value={visitFrequency}
          onChange={(e) => setVisitFrequency(e.target.value)}
          placeholder="Frequency (e.g., 1x per year)"
        />
        <Button type="button" onClick={addVisit} size="sm">
          Add Visit
        </Button>
      </div>
      <div className="space-y-2">
        {visits.map((visit) => (
          <div key={visit.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <span className="text-sm">
              {visit.name} - {visit.frequency}
            </span>
            <X className="w-4 h-4 cursor-pointer text-gray-500" onClick={() => removeVisit(visit.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HealthProfilePage() {
  const { members, addMember, removeMember, updateMember, clearProfile } = useHealthProfileStore()

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Health Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Profile</h1>
              <p className="text-gray-600">
                Add your healthcare information to get personalized insurance analysis and recommendations.
              </p>
            </div>
            <Button variant="outline" onClick={clearProfile} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="space-y-6">
            {members.map((member, index) => (
              <Card key={member.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {index === 0 ? "Primary Member" : `Member ${index + 1}`}
                  </CardTitle>
                  {members.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeMember(member.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`age-${member.id}`}>Age</Label>
                      <Input
                        id={`age-${member.id}`}
                        type="number"
                        value={member.age}
                        onChange={(e) => updateMember(member.id, { age: e.target.value })}
                        placeholder="Age"
                      />
                    </div>
                  </div>

                  <TagInput
                    label="Pre-existing Conditions"
                    tags={member.conditions}
                    onTagsChange={(conditions) => updateMember(member.id, { conditions })}
                    placeholder="e.g., Diabetes, Hypertension"
                  />

                  <TagInput
                    label="Current Medications"
                    tags={member.medications}
                    onTagsChange={(medications) => updateMember(member.id, { medications })}
                    placeholder="e.g., Metformin, Lisinopril"
                  />

                  <TagInput
                    label="Allergies"
                    tags={member.allergies}
                    onTagsChange={(allergies) => updateMember(member.id, { allergies })}
                    placeholder="e.g., Penicillin, Peanuts"
                  />

                  <VisitInput visits={member.visits} onVisitsChange={(visits) => updateMember(member.id, { visits })} />
                </CardContent>
              </Card>
            ))}

            <Button onClick={addMember} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Family Member
            </Button>

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-gray-500">Your health profile is automatically saved to your browser</p>
              <div className="text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? "s" : ""} in profile
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
