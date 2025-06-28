import { create } from "zustand"
import { persist } from "zustand/middleware"
import { 
  EnhancedMember, 
  LegacyMember,
  Condition, 
  Medication, 
  ProviderRelationship,
  ExpectedVisit,
  HealthProfileCompletenessScore 
} from "./health-profile-types"

// Re-export legacy types for compatibility
export interface MedicalVisit {
  id: string
  name: string
  frequency: string
}

export interface OtherService {
  name: string
  frequency: number
}

export interface Member extends LegacyMember {}

interface HealthScenario {
  id: string
  name: string
  createdAt: string
  members: Member[]
  enhancedMembers?: EnhancedMember[]
}

interface EnhancedHealthProfileState {
  // Legacy fields for compatibility
  members: Member[]
  scenarios: HealthScenario[]
  currentScenarioId: string | null
  
  // New enhanced fields
  enhancedMembers: EnhancedMember[]
  isEnhancedMode: boolean
  
  // Legacy methods
  addMember: () => void
  removeMember: (memberId: string) => void
  updateMember: (memberId: string, updates: Partial<Member>) => void
  clearProfile: () => void
  saveScenario: (name: string) => void
  loadScenario: (scenarioId: string) => void
  deleteScenario: (scenarioId: string) => void
  createNewScenario: () => void
  
  // Enhanced methods
  addEnhancedMember: () => void
  removeEnhancedMember: (memberId: string) => void
  updateEnhancedMember: (memberId: string, updates: Partial<EnhancedMember>) => void
  toggleEnhancedMode: () => void
  migrateToEnhanced: () => void
  calculateCompleteness: (memberId: string) => HealthProfileCompletenessScore
  
  // Utility methods
  getActiveMemberCount: () => number
  hasEnhancedData: () => boolean
}

const createDefaultMember = (): Member => ({
  id: Date.now().toString(),
  age: "",
  conditions: [],
  medications: [],
  allergies: [],
  visits: [],
  otherServices: [],
})

const createDefaultEnhancedMember = (): EnhancedMember => ({
  id: Date.now().toString(),
  name: "",
  isPrimary: false,
  age: 0,
  gender: 'prefer_not_to_say',
  conditions: [],
  medications: [],
  allergies: [],
  surgeries: [],
  hospitalizations: [],
  preventiveCare: [],
  immunizations: [],
  providers: [],
  smokingStatus: 'unknown',
  alcoholUse: 'unknown',
  exerciseFrequency: 'occasional',
  carePriorities: [],
  telemedicinePreference: 'acceptable',
  plannedProcedures: [],
  expectedVisits: []
})

// Migration helper function
const migrateLegacyMember = (legacy: Member): EnhancedMember => {
  const enhanced = createDefaultEnhancedMember()
  
  return {
    ...enhanced,
    id: legacy.id,
    name: `Member ${legacy.id.slice(-4)}`,
    age: parseInt(legacy.age) || 0,
    isPrimary: false,
    
    // Convert simple arrays to structured data
    conditions: legacy.conditions.map((c, idx) => ({
      id: `${legacy.id}-condition-${idx}`,
      name: c,
      severity: 'moderate',
      status: 'active',
      diagnosisDate: undefined,
      managingSpecialist: undefined,
      medications: [],
      relatedConditions: [],
    })),
    
    medications: legacy.medications.map((m, idx) => ({
      id: `${legacy.id}-med-${idx}`,
      name: m,
      drugClass: 'Unknown',
      dosage: 'Unknown',
      frequency: 'Daily',
      prescribedFor: '',
      isSpecialty: false,
      requiresPriorAuth: false,
      monthlySupply: 30,
    })),
    
    allergies: legacy.allergies?.map((a, idx) => ({
      id: `${legacy.id}-allergy-${idx}`,
      allergen: a,
      type: 'other' as const,
      severity: 'moderate' as const,
      reactions: [],
    })) || [],
    
    // Convert visits to expected visits
    expectedVisits: [
      ...(legacy.visits?.map(v => ({
        serviceType: v.name,
        annualFrequency: parseInt(v.frequency) || 0,
        isPreventive: false,
        basedOn: 'user_input' as const,
      })) || []),
      ...(legacy.otherServices?.map(s => ({
        serviceType: s.name,
        annualFrequency: s.frequency,
        isPreventive: false,
        basedOn: 'user_input' as const,
      })) || [])
    ]
  }
}

export const useEnhancedHealthProfileStore = create<EnhancedHealthProfileState>()(
  persist(
    (set, get) => ({
      // Initial state
      members: [createDefaultMember()],
      enhancedMembers: [],
      scenarios: [],
      currentScenarioId: null,
      isEnhancedMode: false,
      
      // Legacy methods (maintain compatibility)
      addMember: () => {
        const newMember = createDefaultMember()
        set((state) => ({
          members: [...state.members, newMember],
        }))
      },

      removeMember: (memberId: string) => {
        const { members } = get()
        if (members.length > 1) {
          set((state) => ({
            members: state.members.filter((member) => member.id !== memberId),
          }))
        }
      },

      updateMember: (memberId: string, updates: Partial<Member>) => {
        set((state) => ({
          members: state.members.map((member) => 
            member.id === memberId ? { ...member, ...updates } : member
          ),
        }))
      },

      clearProfile: () => {
        set({ 
          members: [createDefaultMember()], 
          enhancedMembers: [],
          currentScenarioId: null 
        })
      },

      saveScenario: (name: string) => {
        const { members, enhancedMembers, scenarios, isEnhancedMode } = get()
        const newScenario: HealthScenario = {
          id: Date.now().toString(),
          name,
          createdAt: new Date().toISOString(),
          members: JSON.parse(JSON.stringify(members)),
          enhancedMembers: isEnhancedMode ? JSON.parse(JSON.stringify(enhancedMembers)) : undefined,
        }
        set((state) => ({
          scenarios: [...state.scenarios, newScenario],
          currentScenarioId: newScenario.id,
        }))
      },

      loadScenario: (scenarioId: string) => {
        const { scenarios } = get()
        const scenario = scenarios.find((s) => s.id === scenarioId)
        if (scenario) {
          set({
            members: JSON.parse(JSON.stringify(scenario.members)),
            enhancedMembers: scenario.enhancedMembers ? 
              JSON.parse(JSON.stringify(scenario.enhancedMembers)) : [],
            currentScenarioId: scenarioId,
            isEnhancedMode: !!scenario.enhancedMembers,
          })
        }
      },

      deleteScenario: (scenarioId: string) => {
        const { currentScenarioId } = get()
        set((state) => ({
          scenarios: state.scenarios.filter((s) => s.id !== scenarioId),
          currentScenarioId: currentScenarioId === scenarioId ? null : currentScenarioId,
        }))
      },

      createNewScenario: () => {
        set({
          members: [createDefaultMember()],
          enhancedMembers: [],
          currentScenarioId: null,
        })
      },
      
      // Enhanced methods
      addEnhancedMember: () => {
        const newMember = createDefaultEnhancedMember()
        const { enhancedMembers } = get()
        newMember.isPrimary = enhancedMembers.length === 0
        
        set((state) => ({
          enhancedMembers: [...state.enhancedMembers, newMember],
        }))
      },
      
      removeEnhancedMember: (memberId: string) => {
        const { enhancedMembers } = get()
        if (enhancedMembers.length > 1) {
          set((state) => {
            const filtered = state.enhancedMembers.filter((member) => member.id !== memberId)
            // Ensure we still have a primary member
            if (filtered.length > 0 && !filtered.some(m => m.isPrimary)) {
              filtered[0].isPrimary = true
            }
            return { enhancedMembers: filtered }
          })
        }
      },
      
      updateEnhancedMember: (memberId: string, updates: Partial<EnhancedMember>) => {
        set((state) => ({
          enhancedMembers: state.enhancedMembers.map((member) => 
            member.id === memberId ? { ...member, ...updates } : member
          ),
        }))
      },
      
      toggleEnhancedMode: () => {
        set((state) => ({ isEnhancedMode: !state.isEnhancedMode }))
      },
      
      migrateToEnhanced: () => {
        const { members } = get()
        const enhancedMembers = members.map((m, idx) => ({
          ...migrateLegacyMember(m),
          isPrimary: idx === 0
        }))
        
        set({
          enhancedMembers,
          isEnhancedMode: true,
        })
      },
      
      calculateCompleteness: (memberId: string): HealthProfileCompletenessScore => {
        const { enhancedMembers } = get()
        const member = enhancedMembers.find(m => m.id === memberId)
        
        if (!member) {
          return {
            overall: 0,
            categories: {
              demographics: 0,
              conditions: 0,
              medications: 0,
              providers: 0,
              history: 0,
              preferences: 0,
            }
          }
        }
        
        // Calculate category scores
        const demographics = [
          member.name ? 10 : 0,
          member.age > 0 ? 10 : 0,
          member.gender !== 'prefer_not_to_say' ? 10 : 0,
          member.dateOfBirth ? 10 : 0,
          member.height ? 5 : 0,
          member.weight ? 5 : 0,
        ].reduce((a, b) => a + b, 0) / 50 * 100
        
        const conditions = member.conditions.length > 0 ? 
          member.conditions.reduce((score, c) => {
            return score + (c.severity ? 20 : 0) + (c.managingSpecialist ? 20 : 0) + (c.diagnosisDate ? 10 : 0)
          }, 50) / (member.conditions.length * 50) * 100 : 0
        
        const medications = member.medications.length > 0 ?
          member.medications.reduce((score, m) => {
            return score + (m.dosage !== 'Unknown' ? 25 : 0) + (m.frequency !== 'Daily' ? 25 : 0)
          }, 50) / (member.medications.length * 50) * 100 : 0
        
        const providers = member.providers.length > 0 ? 100 : 0
        const history = (member.surgeries.length + member.hospitalizations.length + member.preventiveCare.length) > 0 ? 100 : 0
        const preferences = member.carePriorities.length > 0 ? 100 : 0
        
        const overall = (demographics + conditions + medications + providers + history + preferences) / 6
        
        return {
          overall,
          categories: {
            demographics,
            conditions,
            medications,
            providers,
            history,
            preferences,
          }
        }
      },
      
      // Utility methods
      getActiveMemberCount: () => {
        const { isEnhancedMode, members, enhancedMembers } = get()
        return isEnhancedMode ? enhancedMembers.length : members.length
      },
      
      hasEnhancedData: () => {
        const { enhancedMembers } = get()
        return enhancedMembers.length > 0
      },
    }),
    {
      name: "enhanced-health-profile-storage",
      version: 3,
      migrate: (persistedState: any, version: number) => {
        // Handle migration from version 2 (legacy) to version 3 (enhanced)
        if (version < 3) {
          return {
            ...persistedState,
            enhancedMembers: [],
            isEnhancedMode: false,
          }
        }
        return persistedState
      },
    },
  ),
)