"use client"

import * as React from "react"
import { useState, useMemo } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Baby } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { AIAutocomplete } from "@/components/ui/ai-autocomplete"
import { commonConditions, commonMedications } from "@/lib/health-profile-utils"
import { ProfileCompleteness } from "@/components/profile-completeness"
import { UtilizationDisplay } from "@/components/utilization-display"
import { calculateHealthcareUtilization, getPreventiveCareSchedule } from "@/lib/utilization-engine"
import { useScreenReaderAnnouncement, ScreenReaderAnnouncement } from "@/lib/hooks/use-screen-reader"

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


interface OtherServicesInputProps {
  services: OtherService[]
  onServicesChange: (services: OtherService[]) => void
}

function OtherServicesInput({ services = [], onServicesChange }: OtherServicesInputProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [frequency, setFrequency] = useState(1)
  
  // Check if "No services" is selected
  const hasNoServices = services.some(s => s.name === "NONE_SERVICES")
  
  // Convert AVAILABLE_SERVICES to options format
  const serviceOptions = [
    { value: "NONE_SERVICES", label: "No expected medical services", category: "None" },
    ...AVAILABLE_SERVICES
      .filter(service => service !== "Other (specify)")
      .map(service => {
        const category = 
          service.includes("Primary care") || service.includes("Preventive") ? "Primary & Preventive Care" :
          service.includes("Diagnostic") || service.includes("Imaging") ? "Diagnostic & Imaging" :
          service.includes("Generic") || service.includes("drugs") ? "Prescription Drugs" :
          service.includes("Emergency") || service.includes("Urgent") ? "Emergency & Urgent Care" :
          service.includes("surgery") || service.includes("surgeon") ? "Surgery & Hospital" :
          service.includes("mental") || service.includes("behavioral") ? "Mental Health" :
          service.includes("Delivery") || service.includes("maternity") ? "Maternity Care" :
          service.includes("Rehabilitation") || service.includes("Habilitation") ? "Therapy" :
          service.includes("Children") ? "Children's Services" :
          "Other Services"
        
        return {
          value: service,
          label: service,
          category: category
        }
      })
  ]
  
  const addServices = () => {
    if (selectedServices.length > 0 && frequency > 0) {
      // If "NONE_SERVICES" is selected, clear all other services
      if (selectedServices.includes("NONE_SERVICES")) {
        onServicesChange([{ name: "NONE_SERVICES", frequency: 0 }])
        setSelectedServices([])
        setFrequency(1)
        return
      }
      
      const newServices = selectedServices
        .filter(serviceName => !services.some(s => s.name === serviceName))
        .map(serviceName => ({
          name: serviceName,
          frequency: frequency
        }))
      
      if (newServices.length > 0) {
        // Remove "NONE_SERVICES" if adding actual services
        const filteredServices = services.filter(s => s.name !== "NONE_SERVICES")
        onServicesChange([...filteredServices, ...newServices])
        setSelectedServices([])
        setFrequency(1)
      }
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
      <Label className="text-sm font-medium">Medical Services</Label>
      <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">Add any medical services you expect to use next year</p>
      
      {/* Add new service form */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-medium mb-1">Service</Label>
          <AIAutocomplete
            options={serviceOptions}
            value={selectedServices}
            onChange={setSelectedServices}
            placeholder="Search or select services..."
            searchPlaceholder="Search services (AI-powered)..."
            emptyText="No services found."
            searchType="services"
            allowCustom={true}
            customLabel="Add service"
            multiple={true}
          />
        </div>
        
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
          onClick={addServices} 
          size="sm"
          className="w-full"
          disabled={selectedServices.length === 0}
        >
          Add Service{selectedServices.length > 1 ? 's' : ''}
        </Button>
      </div>
      
      {/* List of added services */}
      {services.length > 0 && (
        <div className="space-y-2 mt-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
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
                <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap" aria-label="per year">/yr</span>
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
      
      {hasNoServices && (
        <p className="text-xs text-green-600 mt-2">✓ No expected medical services confirmed</p>
      )}
    </div>
  )
}

export default function HealthProfilePage() {
  const { members, addMember, removeMember, updateMember, clearProfile } = useHealthProfileStore()
  const [pregnancyDueDates, setPregnancyDueDates] = useState<Record<string, Date | undefined>>({})
  const [showUtilization, setShowUtilization] = useState(false)
  const { announce, announcementRef } = useScreenReaderAnnouncement()
  
  // Memoize healthcare utilization calculation for primary member
  const primaryMemberUtilization = useMemo(() => {
    if (members.length > 0 && members[0].age) {
      return calculateHealthcareUtilization(members[0])
    }
    return null
  }, [members])
  
  // Auto-show utilization if member has sufficient data
  React.useEffect(() => {
    if (members.length > 0 && members[0] && members[0].age && members[0].conditions && members[0].conditions.length > 0) {
      setShowUtilization(true)
    }
  }, [members])
  
  // Calculate profile completeness for basic profile
  const calculateBasicCompleteness = (member: Member) => {
    // Demographics scoring (age, gender, height, weight)
    const demographics = [
      member.age && member.age.trim() !== '' ? 25 : 0,
      member.gender && member.gender !== 'prefer_not_to_say' ? 25 : 0,
      member.height && member.height > 0 ? 25 : 0,
      member.weight && member.weight > 0 ? 25 : 0,
    ].reduce((a, b) => a + b, 0)
    
    // Conditions scoring - 100% if at least one condition is added OR explicitly marked as "NONE"
    const conditions = (member.conditions && member.conditions.length > 0) ? 100 : 0
    
    // Medications scoring - 100% if at least one medication is added OR explicitly marked as "NONE"
    const medications = (member.medications && member.medications.length > 0) ? 100 : 0
    
    // Providers scoring - Not implemented in basic profile
    const providers = 0
    
    // History scoring - 100% if allergies are specified (including "NONE")
    const history = (member.allergies && member.allergies.length > 0) ? 100 : 0
    
    // Preferences scoring (lifestyle factors and medical services)
    const preferences = [
      (member.otherServices && member.otherServices.length > 0) ? 25 : 0,
      member.smokingStatus && member.smokingStatus !== 'unknown' ? 25 : 0,
      member.alcoholUse && member.alcoholUse !== 'unknown' ? 25 : 0,
      member.exerciseFrequency && member.exerciseFrequency !== 'occasional' ? 25 : 0,
    ].reduce((a, b) => a + b, 0)
    
    // Calculate overall score (average of all categories)
    const overall = (demographics + conditions + medications + providers + history + preferences) / 6
    
    return {
      overall: Math.round(overall),
      categories: {
        demographics: Math.round(demographics),
        conditions: Math.round(conditions),
        medications: Math.round(medications),
        providers: Math.round(providers),
        history: Math.round(history),
        preferences: Math.round(preferences),
      }
    }
  }

  // Handle member addition with announcement
  const handleAddMember = () => {
    addMember()
    announce(`New family member added. Total members: ${members.length + 1}`)
  }

  // Handle member removal with announcement
  const handleRemoveMember = (memberId: string, index: number) => {
    removeMember(memberId)
    announce(`Member ${index + 1} removed. Total members: ${members.length - 1}`)
  }

  return (
    <SidebarInset>
      <ScreenReaderAnnouncement announcementRef={announcementRef} />
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
        <div className="max-w-7xl mx-auto px-4 py-8">
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

          {/* Profile Completeness Summary */}
          {members.length > 0 && members[0] && (
            <div className="mb-6">
              <ProfileCompleteness 
                overallScore={calculateBasicCompleteness(members[0]).overall}
                categories={calculateBasicCompleteness(members[0]).categories}
                memberName={members[0].age ? `Primary Member (Age ${members[0].age})` : "Primary Member"}
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            {members.map((member, index) => (
              <Card key={member.id} className="h-fit">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-4 h-4" />
                    {index === 0 ? "Primary Member" : `Member ${index + 1}`}
                  </CardTitle>
                  {members.length > 1 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRemoveMember(member.id, index)}
                      aria-label={`Remove ${index === 0 ? "Primary Member" : `Member ${index + 1}`}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`age-${member.id}`} className="text-sm">Age</Label>
                      <Input
                        id={`age-${member.id}`}
                        type="number"
                        value={member.age}
                        onChange={(e) => updateMember(member.id, { age: e.target.value })}
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
                        onValueChange={(value) => updateMember(member.id, { gender: value })}
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
                  </div>
                  
                  {/* Height, Weight, BMI */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                              updateMember(member.id, { 
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
                              updateMember(member.id, { 
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
                            updateMember(member.id, { 
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

                  {/* Lifestyle Factors */}
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="text-sm font-medium mb-2">Lifestyle Factors</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label className="text-sm">Smoking Status</Label>
                        <Select 
                          value={member.smokingStatus || 'unknown'} 
                          onValueChange={(value) => updateMember(member.id, { smokingStatus: value as any })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue />
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
                          value={member.alcoholUse || 'unknown'} 
                          onValueChange={(value) => updateMember(member.id, { alcoholUse: value as any })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue />
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
                          value={member.exerciseFrequency || 'occasional'} 
                          onValueChange={(value) => updateMember(member.id, { exerciseFrequency: value as any })}
                        >
                          <SelectTrigger className="mt-1 w-full">
                            <SelectValue />
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

                  {member.gender === 'female' && (
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
                                updateMember(member.id, { pregnancyStatus: undefined })
                                setPregnancyDueDates(prev => ({ ...prev, [member.id]: undefined }))
                              } else {
                                updateMember(member.id, { 
                                  pregnancyStatus: { 
                                    isPregnant: true,
                                    dueDate: pregnancyDueDates[member.id]?.toISOString(),
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
                                    !pregnancyDueDates[member.id] && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {pregnancyDueDates[member.id] ? (
                                    format(pregnancyDueDates[member.id]!, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={pregnancyDueDates[member.id]}
                                  onSelect={(date) => {
                                    setPregnancyDueDates(prev => ({ ...prev, [member.id]: date }))
                                    if (date && member.pregnancyStatus) {
                                      updateMember(member.id, {
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
                                updateMember(member.id, {
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
                                updateMember(member.id, {
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
                                updateMember(member.id, {
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
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm">Pre-existing Conditions</Label>
                    <AIAutocomplete
                      options={[
                        { value: "NONE", label: "No pre-existing conditions", category: "None", details: "I have no medical conditions" },
                        ...commonConditions.map(condition => ({
                          value: condition.name,
                          label: condition.name,
                          category: condition.category,
                          details: condition.icdCode ? `ICD: ${condition.icdCode}` : undefined
                        }))
                      ]}
                      value={member.conditions}
                      onChange={(conditions) => {
                        // If "NONE" is selected, clear all other conditions
                        if (conditions.includes("NONE")) {
                          updateMember(member.id, { conditions: ["NONE"] })
                        } else {
                          updateMember(member.id, { conditions })
                        }
                      }}
                      placeholder="Search conditions or select 'None'..."
                      searchPlaceholder="Search conditions (AI-powered)..."
                      emptyText="No conditions found."
                      searchType="conditions"
                      allowCustom={true}
                      customLabel="Add condition"
                    />
                    {member.conditions.includes("NONE") && (
                      <p className="text-xs text-green-600">✓ No pre-existing conditions confirmed</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Current Medications</Label>
                    <AIAutocomplete
                      options={[
                        { value: "NONE", label: "No current medications", category: "None", details: "I don't take any medications" },
                        ...Object.entries(commonMedications).flatMap(([category, meds]) =>
                          meds.map(med => ({
                            value: med.name,
                            label: med.name,
                            category: category.charAt(0).toUpperCase() + category.slice(1),
                            details: `${med.genericName} (${med.drugClass})${med.isSpecialty ? ' - Specialty' : ''}`
                          }))
                        )
                      ]}
                      value={member.medications}
                      onChange={(medications) => {
                        // If "NONE" is selected, clear all other medications
                        if (medications.includes("NONE")) {
                          updateMember(member.id, { medications: ["NONE"] })
                        } else {
                          updateMember(member.id, { medications })
                        }
                      }}
                      placeholder="Search medications or select 'None'..."
                      searchPlaceholder="Search medications (AI-powered)..."
                      emptyText="No medications found."
                      searchType="medications"
                      allowCustom={true}
                      customLabel="Add medication"
                    />
                    {member.medications.includes("NONE") && (
                      <p className="text-xs text-green-600">✓ No current medications confirmed</p>
                    )}
                  </div>
                  
                  {/* Allergies Section */}
                  <div className="space-y-2">
                    <Label className="text-sm">Allergies</Label>
                    <AIAutocomplete
                      options={[
                        { value: "NONE", label: "No known allergies", category: "None", details: "I have no allergies" },
                        // Common medication allergies
                        { value: "Penicillin", label: "Penicillin", category: "Medications", details: "Common antibiotic allergy" },
                        { value: "Amoxicillin", label: "Amoxicillin", category: "Medications", details: "Penicillin-type antibiotic" },
                        { value: "Sulfa drugs", label: "Sulfa drugs", category: "Medications", details: "Sulfonamide antibiotics" },
                        { value: "Aspirin", label: "Aspirin", category: "Medications", details: "NSAID allergy" },
                        { value: "Ibuprofen", label: "Ibuprofen", category: "Medications", details: "NSAID allergy" },
                        { value: "Codeine", label: "Codeine", category: "Medications", details: "Opioid allergy" },
                        // Common food allergies
                        { value: "Peanuts", label: "Peanuts", category: "Food", details: "Tree nut allergy" },
                        { value: "Tree nuts", label: "Tree nuts", category: "Food", details: "Includes almonds, cashews, walnuts" },
                        { value: "Milk", label: "Milk", category: "Food", details: "Dairy allergy" },
                        { value: "Eggs", label: "Eggs", category: "Food", details: "Egg protein allergy" },
                        { value: "Wheat", label: "Wheat", category: "Food", details: "Gluten allergy" },
                        { value: "Soy", label: "Soy", category: "Food", details: "Soybean allergy" },
                        { value: "Fish", label: "Fish", category: "Food", details: "Finned fish allergy" },
                        { value: "Shellfish", label: "Shellfish", category: "Food", details: "Crustacean allergy" },
                        // Environmental allergies
                        { value: "Pollen", label: "Pollen", category: "Environmental", details: "Seasonal allergies" },
                        { value: "Dust mites", label: "Dust mites", category: "Environmental", details: "Indoor allergen" },
                        { value: "Pet dander", label: "Pet dander", category: "Environmental", details: "Cat/dog allergies" },
                        { value: "Mold", label: "Mold", category: "Environmental", details: "Fungal allergies" },
                        { value: "Latex", label: "Latex", category: "Environmental", details: "Natural rubber allergy" },
                        { value: "Bee stings", label: "Bee stings", category: "Environmental", details: "Insect venom allergy" },
                      ]}
                      value={member.allergies}
                      onChange={(allergies) => {
                        // If "NONE" is selected, clear all other allergies
                        if (allergies.includes("NONE")) {
                          updateMember(member.id, { allergies: ["NONE"] })
                        } else {
                          updateMember(member.id, { allergies })
                        }
                      }}
                      placeholder="Search allergies or select 'None'..."
                      searchPlaceholder="Search allergies (AI-powered)..."
                      emptyText="No allergies found."
                      searchType="allergies"
                      allowCustom={true}
                      customLabel="Add allergy"
                    />
                    {member.allergies.includes("NONE") && (
                      <p className="text-xs text-green-600">✓ No known allergies confirmed</p>
                    )}
                  </div>
                  
                  <OtherServicesInput 
                    services={member.otherServices || []} 
                    onServicesChange={(otherServices) => updateMember(member.id, { otherServices })} 
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          <Button 
            onClick={handleAddMember} 
            variant="outline" 
            className="w-full mb-6 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Add new family member to health profile"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Family Member
          </Button>

          <div className="flex justify-between items-center pt-4">
            <p className="text-sm text-gray-500">Your health profile is automatically saved to your browser</p>
            <div className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? "s" : ""} in profile
            </div>
          </div>
          
          {/* Healthcare Utilization Analysis */}
          {primaryMemberUtilization && members[0].age && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Healthcare Utilization Analysis</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {members[0].conditions.length > 0 ? "Live updating" : "Add conditions to see analysis"}
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUtilization(!showUtilization)}
                    disabled={members[0].conditions.length === 0}
                  >
                    {showUtilization ? "Hide" : "Show"} Analysis
                  </Button>
                </div>
              </div>
              {showUtilization && members[0].conditions.length > 0 && (
                <UtilizationDisplay 
                  utilization={primaryMemberUtilization}
                  memberName={members[0].age ? `Primary Member (Age ${members[0].age})` : "Primary Member"}
                />
              )}
              {showUtilization && members[0].conditions.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-gray-500">
                      Add pre-existing conditions to see healthcare utilization predictions and risk assessment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}