import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MedicalVisit {
  id: string
  name: string
  frequency: string
}

export interface OtherService {
  name: string
  frequency: number
}

export interface Member {
  id: string
  age: string
  conditions: string[]
  medications: string[]
  allergies: string[]
  visits: MedicalVisit[]
  otherServices: OtherService[]
}

interface HealthScenario {
  id: string
  name: string
  createdAt: string
  members: Member[]
}

interface HealthProfileState {
  members: Member[]
  scenarios: HealthScenario[]
  currentScenarioId: string | null
  addMember: () => void
  removeMember: (memberId: string) => void
  updateMember: (memberId: string, updates: Partial<Member>) => void
  clearProfile: () => void
  saveScenario: (name: string) => void
  loadScenario: (scenarioId: string) => void
  deleteScenario: (scenarioId: string) => void
  createNewScenario: () => void
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

export const useHealthProfileStore = create<HealthProfileState>()(
  persist(
    (set, get) => ({
      members: [createDefaultMember()],
      scenarios: [],
      currentScenarioId: null,

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
          members: state.members.map((member) => (member.id === memberId ? { ...member, ...updates } : member)),
        }))
      },

      clearProfile: () => {
        set({ members: [createDefaultMember()], currentScenarioId: null })
      },

      saveScenario: (name: string) => {
        const { members, scenarios } = get()
        const newScenario: HealthScenario = {
          id: Date.now().toString(),
          name,
          createdAt: new Date().toISOString(),
          members: JSON.parse(JSON.stringify(members)),
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
            currentScenarioId: scenarioId,
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
          currentScenarioId: null,
        })
      },
    }),
    {
      name: "health-profile-storage",
      version: 2,
    },
  ),
)
