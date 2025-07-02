import { useState, useCallback } from "react";
import { useHealthProfileStore } from "@/lib/health-profile-store";
import type { HealthSuggestion, HealthSuggestionsResponse } from "@/app/api/health-suggestions/route";

interface HealthAnalysis {
  riskScore: number;
  recommendations: Array<{
    category: string;
    priority: string;
    recommendation: string;
    reasoning: string;
  }>;
  coveragePriorities: Array<{
    feature: string;
    importance: string;
    reason: string;
  }>;
  expectedCosts: {
    lowEstimate: number;
    highEstimate: number;
    breakdown: Array<{
      category: string;
      annualCost: number;
    }>;
  };
  careGaps: Array<{
    type: string;
    description: string;
    suggestedAction: string;
  }>;
  providerNeeds: Array<{
    specialty: string;
    frequency: string;
    inNetwork?: boolean;
  }>;
}

interface ConditionSuggestion {
  name: string;
  icdCode?: string;
  category: string;
  relevance: number;
  relatedTo?: string[];
}

interface MedicationSuggestion {
  name: string;
  genericName: string;
  brandName?: string;
  drugClass: string;
  forCondition: string;
  isGenericAvailable: boolean;
  isSpecialty: boolean;
  monthlyEstimate: {
    generic?: number;
    brand?: number;
  };
}

export function useHealthAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { members } = useHealthProfileStore();
  
  const analyzeHealthProfile = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch("/api/analyze-health-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze health profile");
      }
      
      const data = await response.json();
      setAnalysis(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [members]);
  
  const getConditionSuggestions = useCallback(async (
    query: string,
    existingConditions: string[] = []
  ): Promise<HealthSuggestion[] | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          type: "conditions",
          existingValues: existingConditions,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get condition suggestions");
      }
      
      const data: HealthSuggestionsResponse = await response.json();
      return data.suggestions;
    } catch (err) {
      console.error("Condition suggestions error:", err);
      return null;
    }
  }, []);
  
  const getMedicationSuggestions = useCallback(async (
    query: string,
    existingMedications: string[] = []
  ): Promise<HealthSuggestion[] | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          type: "medications",
          existingValues: existingMedications,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get medication suggestions");
      }
      
      const data: HealthSuggestionsResponse = await response.json();
      return data.suggestions;
    } catch (err) {
      console.error("Medication suggestions error:", err);
      return null;
    }
  }, []);

  const getAllergySuggestions = useCallback(async (
    query: string,
    existingAllergies: string[] = []
  ): Promise<HealthSuggestion[] | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          type: "allergies",
          existingValues: existingAllergies,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get allergy suggestions");
      }
      
      const data: HealthSuggestionsResponse = await response.json();
      return data.suggestions;
    } catch (err) {
      console.error("Allergy suggestions error:", err);
      return null;
    }
  }, []);

  const getServiceSuggestions = useCallback(async (
    query: string,
    existingServices: string[] = []
  ): Promise<HealthSuggestion[] | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          type: "services",
          existingValues: existingServices,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get service suggestions");
      }
      
      const data: HealthSuggestionsResponse = await response.json();
      return data.suggestions;
    } catch (err) {
      console.error("Service suggestions error:", err);
      return null;
    }
  }, []);
  
  return {
    analyzeHealthProfile,
    getConditionSuggestions,
    getMedicationSuggestions,
    getAllergySuggestions,
    getServiceSuggestions,
    analysis,
    isAnalyzing,
    error,
  };
}