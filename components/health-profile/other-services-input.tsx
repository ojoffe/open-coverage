"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { AIAutocomplete } from "@/components/ui/ai-autocomplete"
import type { OtherService } from "@/lib/health-profile-store"

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

export function OtherServicesInput({ services = [], onServicesChange }: OtherServicesInputProps) {
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
            expectedOutput={{
              maxSuggestions: 10,
              requireCategory: true,
              requireDetails: false
            }}
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