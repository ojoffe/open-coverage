import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProcessSBCResponse } from './sbc-schema'

export interface SavedAnalysis {
  id: string
  name: string
  createdAt: Date
  results: ProcessSBCResponse
  policyNames: string[]
  premiums?: Record<string, any>
}

export interface AnalysisMetadata {
  id: string
  name: string
  createdAt: string
  policyCount: number
  policyNames: string[]
}

interface AnalysisStore {
  savedAnalyses: SavedAnalysis[]
  saveAnalysis: (name: string, results: ProcessSBCResponse) => string
  deleteAnalysis: (id: string) => void
  getAnalysis: (id: string) => SavedAnalysis | undefined
  updateAnalysisName: (id: string, name: string) => void
  clearAllHistory: () => void
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      savedAnalyses: [],
      
      saveAnalysis: (name: string, results: ProcessSBCResponse) => {
        // Generate a unique ID for the analysis
        const id = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Extract policy names from results
        const policyNames = results.results
          .filter(r => r.success && r.data)
          .map(r => r.data!.plan_summary.plan_name || r.fileName)
        
        // Create the analysis object
        const analysis: SavedAnalysis = {
          id,
          name,
          createdAt: new Date(),
          results,
          policyNames,
          premiums: (results as any).premiums
        }
        
        // Save to state (which will be persisted to localStorage)
        set(state => ({
          savedAnalyses: [analysis, ...state.savedAnalyses]
        }))
        
        return id
      },
      
      deleteAnalysis: (id: string) => {
        // Delete from localStorage by updating state
        set(state => ({
          savedAnalyses: state.savedAnalyses.filter(a => a.id !== id)
        }))
      },
      
      getAnalysis: (id: string) => {
        return get().savedAnalyses.find(a => a.id === id)
      },
      
      updateAnalysisName: (id: string, name: string) => {
        set(state => ({
          savedAnalyses: state.savedAnalyses.map(a => 
            a.id === id ? { ...a, name } : a
          )
        }))
      },
      
      clearAllHistory: () => {
        // Clear all analyses from localStorage
        set({
          savedAnalyses: []
        })
      }
    }),
    {
      name: 'analysis-storage',
      partialize: (state) => ({
        savedAnalyses: state.savedAnalyses
      }),
      // Custom serialization to handle Date objects
      serialize: (state) => {
        return JSON.stringify({
          ...state,
          state: {
            ...state.state,
            savedAnalyses: state.state.savedAnalyses.map(a => ({
              ...a,
              createdAt: a.createdAt.toISOString()
            }))
          }
        })
      },
      deserialize: (str) => {
        const parsed = JSON.parse(str)
        return {
          ...parsed,
          state: {
            ...parsed.state,
            savedAnalyses: parsed.state.savedAnalyses.map((a: any) => ({
              ...a,
              createdAt: new Date(a.createdAt)
            }))
          }
        }
      }
    }
  )
)