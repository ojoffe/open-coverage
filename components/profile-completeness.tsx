"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface CompletenessCategory {
  name: string
  score: number
  description: string
  suggestions?: string[]
}

interface ProfileCompletenessProps {
  overallScore: number
  categories: {
    demographics: number
    conditions: number
    medications: number
    providers: number
    history: number
    preferences: number
  }
  memberName?: string
}

export function ProfileCompleteness({ 
  overallScore, 
  categories,
  memberName = "Member"
}: ProfileCompletenessProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Ensure score is valid and bounded between 0 and 100
  const safeOverallScore = Math.max(0, Math.min(100, isNaN(overallScore) || !isFinite(overallScore) ? 0 : overallScore))
  
  const categoryDetails: CompletenessCategory[] = [
    {
      name: "Demographics",
      score: Math.max(0, Math.min(100, categories.demographics || 0)),
      description: "Basic information about the member",
      suggestions: categories.demographics < 100 ? [
        "Add age",
        "Include height and weight",
        "Specify gender (optional)"
      ].filter((_, i) => i < Math.ceil((100 - categories.demographics) / 33)) : []
    },
    {
      name: "Medical Conditions",
      score: Math.max(0, Math.min(100, categories.conditions || 0)),
      description: "Pre-existing conditions and diagnoses",
      suggestions: categories.conditions < 100 ? [
        "Add any pre-existing medical conditions",
        "Include chronic conditions",
        "Or select 'No pre-existing conditions'"
      ] : []
    },
    {
      name: "Medications",
      score: Math.max(0, Math.min(100, categories.medications || 0)),
      description: "Current medications and dosages",
      suggestions: categories.medications < 100 ? [
        "Add any prescription medications",
        "Include over-the-counter medications",
        "Or select 'No current medications'"
      ] : []
    },
    {
      name: "Allergies",
      score: Math.max(0, Math.min(100, categories.history || 0)),
      description: "Known allergies to medications, food, or environment",
      suggestions: categories.history === 0 ? [
        "Add any known allergies",
        "Include medication allergies",
        "Or confirm 'No known allergies'"
      ] : []
    },
    {
      name: "Care Preferences",
      score: Math.max(0, Math.min(100, categories.preferences || 0)),
      description: "Your lifestyle information",
      suggestions: categories.preferences < 100 ? [
        "Specify smoking status",
        "Specify alcohol use",
        "Specify exercise frequency"
      ].filter((_, i) => i < Math.ceil((100 - categories.preferences) / 33.34)) : []
    }
  ]
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }
  
  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  return (
    <Card className="w-full">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {safeOverallScore >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            Profile Completeness
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-bold", getScoreColor(safeOverallScore))}>
              {Math.round(safeOverallScore)}%
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
        <Progress 
          value={safeOverallScore} 
          className="mt-3 h-2"
        />
        {safeOverallScore < 80 && (
          <p className="text-sm text-muted-foreground mt-2">
            Complete your profile for more accurate insurance recommendations
          </p>
        )}
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {categoryDetails.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                  <span className={cn("text-sm font-medium", getScoreColor(category.score))}>
                    {Math.round(category.score)}%
                  </span>
                </div>
                <Progress 
                  value={category.score} 
                  className="h-1.5"
                />
                {category.suggestions && category.suggestions.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                    {category.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          
          {safeOverallScore === 100 && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Excellent! Your profile is complete.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}