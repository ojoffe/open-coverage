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
import { useHealthProfileStore, type OtherService } from "@/lib/health-profile-store"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Available medical services for selection - matching insurance policy categories
const AVAILABLE_SERVICES = [
  // Primary and Preventive Care
  "Primary care visit to treat an injury or illness",
  "Specialist visit",
  "Preventive care/screening/immunization",
  
  // Diagnostic and Imaging
  "Diagnostic test (x-ray, blood work)",
  "Imaging (CT/PET scans, MRIs)",
  
  // Prescription Drugs
  "Generic drugs",
  "Preferred brand drugs",
  "Non-preferred brand drugs",
  "Specialty drugs",
  
  // Emergency and Urgent Care
  "Emergency room care",
  "Emergency medical transportation",
  "Urgent care",
  
  // Surgery and Hospital
  "Outpatient surgery",
  "Facility fee (e.g., ambulatory surgery center)",
  "Physician/surgeon fees",
  
  // Mental Health and Substance Abuse
  "Outpatient mental health/behavioral health/substance abuse services",
  "Inpatient mental health/behavioral health/substance abuse services",
  
  // Maternity and Newborn Care
  "Delivery and all inpatient services for maternity care",
  
  // Therapy and Rehabilitation
  "Rehabilitation services",
  "Habilitation services",
  
  // Other Services
  "Home health care",
  "Skilled nursing care",
  "Durable medical equipment",
  "Hospice services",
  
  // Children's Services
  "Children's eye exam",
  "Children's glasses",
  "Children's dental check-up",
  
  // Custom option
  "Other (specify)"
]

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
      <Label className="text-sm">{label}</Label>
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

interface OtherServicesInputProps {
  services: OtherService[]
  onServicesChange: (services: OtherService[]) => void
}

function OtherServicesInput({ services = [], onServicesChange }: OtherServicesInputProps) {
  const [selectedService, setSelectedService] = useState("")
  const [customServiceName, setCustomServiceName] = useState("")
  const [frequency, setFrequency] = useState(1)
  const [showCustomInput, setShowCustomInput] = useState(false)
  
  // Get services that haven't been added yet (excluding already added services but keeping "Other")
  const availableServices = AVAILABLE_SERVICES.filter(
    service => service === "Other (specify)" || !services.some(s => s.name === service || s.name.startsWith(service))
  )
  
  const handleServiceChange = (value: string) => {
    setSelectedService(value)
    setShowCustomInput(value === "Other (specify)")
    if (value !== "Other (specify)") {
      setCustomServiceName("")
    }
  }
  
  const addService = () => {
    const serviceName = selectedService === "Other (specify)" ? customServiceName.trim() : selectedService
    
    if (serviceName && frequency > 0) {
      // Check if this custom service already exists
      if (services.some(s => s.name === serviceName)) {
        return
      }
      
      const newService: OtherService = {
        name: serviceName,
        frequency: frequency
      }
      onServicesChange([...services, newService])
      setSelectedService("")
      setCustomServiceName("")
      setFrequency(1)
      setShowCustomInput(false)
    }
  }
  
  const removeService = (serviceName: string) => {
    onServicesChange(services.filter(service => service.name !== serviceName))
  }
  
  const updateServiceFrequency = (serviceName: string, newFrequency: number) => {
    onServicesChange(
      services.map(service => 
        service.name === serviceName 
          ? { ...service, frequency: Math.max(0, newFrequency) }
          : service
      )
    )
  }
  
  return (
    <div className="space-y-2">
      <Label className="text-sm">Medical Services</Label>
      <p className="text-xs text-gray-600 mb-2">Add any medical services you expect to use next year</p>
      
      {/* Add new service form */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium mb-1">Service</Label>
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select service..." />
            </SelectTrigger>
            <SelectContent>
              {availableServices.map(service => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {showCustomInput && (
          <div>
            <Label className="text-xs font-medium mb-1">Custom Service Name</Label>
            <Input
              value={customServiceName}
              onChange={(e) => setCustomServiceName(e.target.value)}
              placeholder="Enter service name..."
              className="w-full"
            />
          </div>
        )}
        
        <div>
          <Label className="text-xs font-medium mb-1">Frequency/year</Label>
          <Input
            type="number"
            min="1"
            max="365"
            value={frequency}
            onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
            placeholder="1"
            className="w-full"
          />
        </div>
        
        <Button 
          type="button" 
          onClick={addService} 
          size="sm"
          className="w-full"
          disabled={(!selectedService && !customServiceName) || availableServices.length === 0}
        >
          Add Service
        </Button>
      </div>
      
      {/* List of added services */}
      {services.length > 0 && (
        <div className="space-y-2 mt-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span className="text-sm flex-1 pr-2">{service.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Input
                  type="number"
                  min="0"
                  max="365"
                  value={service.frequency}
                  onChange={(e) => updateServiceFrequency(service.name, parseInt(e.target.value) || 0)}
                  className="w-16 h-7 text-sm"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">/yr</span>
                <X 
                  className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500 ml-1" 
                  onClick={() => removeService(service.name)} 
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      {services.length === 0 && (
        <p className="text-sm text-gray-500 italic">No additional services added yet</p>
      )}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {members.map((member, index) => (
              <Card key={member.id} className="h-fit">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-4 h-4" />
                    {index === 0 ? "Primary Member" : `Member ${index + 1}`}
                  </CardTitle>
                  {members.length > 1 && (
                    <Button variant="outline" size="sm" onClick={() => removeMember(member.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <Label htmlFor={`age-${member.id}`} className="text-sm">Age</Label>
                    <Input
                      id={`age-${member.id}`}
                      type="number"
                      value={member.age}
                      onChange={(e) => updateMember(member.id, { age: e.target.value })}
                      placeholder="Age"
                      className="mt-1"
                    />
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
                  
                  <OtherServicesInput 
                    services={member.otherServices || []} 
                    onServicesChange={(otherServices) => updateMember(member.id, { otherServices })} 
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={addMember} variant="outline" className="w-full mb-6">
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
    </SidebarInset>
  )
}