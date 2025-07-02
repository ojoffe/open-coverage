"use client";

import { useComposerRuntime } from "@assistant-ui/react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useHealthProfileStore } from "@/lib/health-profile-store";
import { PolicyProvider as BasePolicyProvider, usePolicy as useBasePolicy, type ParsedPolicy } from "@/components/policy-context";

interface EnhancedPolicyContextType {
  healthProfileSummary: string;
}

const EnhancedPolicyContext = createContext<EnhancedPolicyContextType | undefined>(undefined);

export const EnhancedPolicyProvider = ({ children }: { children: ReactNode }) => {
  let composerRuntime;
  try {
    composerRuntime = useComposerRuntime();
  } catch (e) {
    // Composer runtime not available, continue without it
    composerRuntime = null;
  }
  
  const { members } = useHealthProfileStore();
  const [healthProfileSummary, setHealthProfileSummary] = useState("");

  // Update health profile summary whenever members change
  useEffect(() => {
    if (members.length > 0) {
      const summary = generateHealthProfileSummary(members);
      setHealthProfileSummary(summary);
      
      // Update the AI context with health profile information
      if (composerRuntime) {
        composerRuntime.setRunConfig({
          custom: {
            ...composerRuntime.getState().runConfig?.custom,
            healthProfile: JSON.stringify({
              memberCount: members.length,
              summary: summary,
              details: members.map(m => ({
                age: m.age,
                gender: m.gender,
                conditions: m.conditions,
                medications: m.medications,
                otherServices: m.otherServices
              }))
            }),
          },
        });
      }
    }
  }, [members, composerRuntime]);

  return (
    <EnhancedPolicyContext.Provider value={{ healthProfileSummary }}>
      <BasePolicyProvider>
        {children}
      </BasePolicyProvider>
    </EnhancedPolicyContext.Provider>
  );
};

function generateHealthProfileSummary(members: any[]): string {
  if (members.length === 0) return "No health profile configured";

  const parts: string[] = [];
  
  // Family composition
  if (members.length === 1) {
    parts.push(`Individual coverage for a ${members[0].age}-year-old ${members[0].gender || 'person'}`);
  } else {
    parts.push(`Family of ${members.length} members`);
    const ages = members.map(m => m.age).filter(Boolean);
    if (ages.length > 0) {
      parts.push(`ages ${ages.join(', ')}`);
    }
  }

  // Medical conditions
  const allConditions = members.flatMap(m => m.conditions || []);
  if (allConditions.length > 0) {
    const uniqueConditions = [...new Set(allConditions)];
    parts.push(`with conditions: ${uniqueConditions.join(', ')}`);
  }

  // Medications
  const allMeds = members.flatMap(m => m.medications || []);
  if (allMeds.length > 0) {
    parts.push(`taking ${allMeds.length} medication${allMeds.length > 1 ? 's' : ''}`);
  }

  // Expected usage
  const totalVisits = members.reduce((sum, m) => {
    const conditions = (m.conditions || []).length;
    const baseVisits = m.age < 18 ? 2 : m.age > 65 ? 4 : 1;
    return sum + baseVisits + (conditions * 3);
  }, 0);
  
  if (totalVisits > 0) {
    parts.push(`expecting ~${totalVisits} medical visits annually`);
  }

  return parts.join(', ');
}

export function useEnhancedPolicy() {
  const basePolicy = useBasePolicy();
  const enhancedContext = useContext(EnhancedPolicyContext);
  
  if (!enhancedContext) {
    throw new Error("useEnhancedPolicy must be used within an EnhancedPolicyProvider");
  }

  return {
    ...basePolicy,
    healthProfileSummary: enhancedContext.healthProfileSummary
  };
}