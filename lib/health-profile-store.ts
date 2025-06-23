import { create } from "zustand"
import { persist } from "zustand/middleware"

interface MedicalVisit {
  id: string
  name: string
  frequency: string
}

interface Member {
  id: string
  age: string
  conditions: string[]
  medications: string[]
  allergies: string[]
  visits: MedicalVisit[]
}

interface HealthProfileState {
  members: Member[]
  addMember: () => void
  removeMember: (memberId: string) => void
  updateMember: (memberId: string, updates: Partial<Member>) => void
  clearProfile: () => void
}

const createDefaultMember = (): Member => ({
  id: Date.now().toString(),
  age: "",
  conditions: [],
  medications: [],
  allergies: [],
  visits: [],
})

export const useHealthProfileStore = create<HealthProfileState>()(
  persist(
    (set, get) => ({
      members: [createDefaultMember()],

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
        set({ members: [createDefaultMember()] })
      },
    }),
    {
      name: "health-profile-storage",
      version: 1,
    },
  ),
)
