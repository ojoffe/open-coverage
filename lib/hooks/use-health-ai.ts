import { useState, useCallback } from "react";
import { useHealthProfileStore } from "@/lib/health-profile-store";

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
    age: number,
    gender: string,
    existingConditions: string[] = [],
    symptoms: string[] = []
  ): Promise<{
    suggestions: ConditionSuggestion[];
    preventiveCare: Array<{
      name: string;
      frequency: string;
      nextDue?: string;
      reason: string;
    }>;
  } | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "conditions",
          context: { age, gender, existingConditions, symptoms },
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }
      
      return await response.json();
    } catch (err) {
      console.error("Condition suggestions error:", err);
      return null;
    }
  }, []);
  
  const getMedicationSuggestions = useCallback(async (
    conditions: string[] = [],
    existingMedications: string[] = []
  ): Promise<{
    suggestions: MedicationSuggestion[];
    interactions?: Array<{
      drug1: string;
      drug2: string;
      severity: string;
      description: string;
    }>;
  } | null> => {
    try {
      const response = await fetch("/api/health-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "medications",
          context: { conditions, existingMedications },
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }
      
      return await response.json();
    } catch (err) {
      console.error("Medication suggestions error:", err);
      return null;
    }
  }, []);
  
  return {
    analyzeHealthProfile,
    getConditionSuggestions,
    getMedicationSuggestions,
    analysis,
    isAnalyzing,
    error,
  };
}