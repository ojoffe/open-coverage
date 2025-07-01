import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedAnalysis {
  id: string
  name: string
  date: string
  policyNames: string[]
  familySize: number
  totalAnnualCost: number
  recommendedPolicy?: string
  analysisData: any // Full analysis results
}

interface AnalysisHistoryStore {
  analyses: SavedAnalysis[]
  addAnalysis: (analysis: SavedAnalysis) => void
  removeAnalysis: (id: string) => void
  getAnalysis: (id: string) => SavedAnalysis | undefined
  updateAnalysisName: (id: string, name: string) => void
}

export const useAnalysisHistoryStore = create<AnalysisHistoryStore>()(
  persist(
    (set, get) => {
      console.log('=== Creating Analysis History Store ===')
      return {
      analyses: [],
      
      addAnalysis: (analysis) => {
        console.log('Adding analysis to history store:', analysis)
        set((state) => {
          const newAnalyses = [analysis, ...state.analyses].slice(0, 20)
          console.log('New analyses array:', newAnalyses)
          return { analyses: newAnalyses }
        })
      },
      
      removeAnalysis: (id) =>
        set((state) => ({
          analyses: state.analyses.filter((a) => a.id !== id)
        })),
      
      getAnalysis: (id) => {
        const state = get()
        return state.analyses.find((a) => a.id === id)
      },
      
      updateAnalysisName: (id, name) =>
        set((state) => ({
          analyses: state.analyses.map((a) =>
            a.id === id ? { ...a, name } : a
          )
        }))
    }},
    {
      name: 'coverage-analysis-history',
      onRehydrateStorage: () => (state) => {
        console.log('=== Rehydrating Analysis History Store ===')
        console.log('Rehydrated state:', state)
        if (state) {
          console.log('Number of analyses loaded:', state.analyses.length)
        }
      }
    }
  )
)