import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProcessSBCResponse } from './sbc-schema'

export interface SavedAnalysis {
  id: string
  name: string
  createdAt: Date
  results: ProcessSBCResponse
  policyNames: string[]
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
  analysisHistory: AnalysisMetadata[]
  saveAnalysis: (name: string, results: ProcessSBCResponse) => Promise<string>
  deleteAnalysis: (id: string) => Promise<void>
  getAnalysis: (id: string) => SavedAnalysis | undefined
  loadAnalysisFromKV: (id: string) => Promise<SavedAnalysis | null>
  updateAnalysisName: (id: string, name: string) => void
  loadAnalysisHistory: () => Promise<void>
  clearAllHistory: () => Promise<void>
}

export const useAnalysisStore = create<AnalysisStore>()(
  persist(
    (set, get) => ({
      savedAnalyses: [],
      analysisHistory: [],
      
      saveAnalysis: async (name: string, results: ProcessSBCResponse) => {
        try {
          // Save to KV via API
          const response = await fetch('/api/analyses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, results })
          })
          
          if (!response.ok) {
            throw new Error('Failed to save analysis')
          }
          
          const { id } = await response.json()
          
          // Also save locally for quick access
          const policyNames = results.results
            .filter(r => r.success && r.data)
            .map(r => r.data!.plan_summary.plan_name || r.fileName)
          
          const analysis: SavedAnalysis = {
            id,
            name,
            createdAt: new Date(),
            results,
            policyNames
          }
          
          set(state => ({
            savedAnalyses: [analysis, ...state.savedAnalyses]
          }))
          
          // Update history
          await get().loadAnalysisHistory()
          
          return id
        } catch (error) {
          console.error('Failed to save analysis:', error)
          // Fallback to local-only storage
          const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          const policyNames = results.results
            .filter(r => r.success && r.data)
            .map(r => r.data!.plan_summary.plan_name || r.fileName)
          
          const analysis: SavedAnalysis = {
            id,
            name,
            createdAt: new Date(),
            results,
            policyNames
          }
          
          set(state => ({
            savedAnalyses: [analysis, ...state.savedAnalyses]
          }))
          
          return id
        }
      },
      
      deleteAnalysis: async (id: string) => {
        try {
          // Delete from KV via API
          await fetch(`/api/analyses?id=${id}`, { method: 'DELETE' })
        } catch (error) {
          console.error('Failed to delete from KV:', error)
        }
        
        // Always delete locally
        set(state => ({
          savedAnalyses: state.savedAnalyses.filter(a => a.id !== id)
        }))
        
        // Update history
        await get().loadAnalysisHistory()
      },
      
      getAnalysis: (id: string) => {
        return get().savedAnalyses.find(a => a.id === id)
      },
      
      loadAnalysisFromKV: async (id: string) => {
        try {
          const response = await fetch(`/api/analyses?id=${id}`)
          if (!response.ok) return null
          
          const data = await response.json()
          const analysis: SavedAnalysis = {
            ...data,
            createdAt: new Date(data.createdAt)
          }
          
          // Add to local cache
          set(state => {
            const existing = state.savedAnalyses.find(a => a.id === id)
            if (!existing) {
              return {
                savedAnalyses: [analysis, ...state.savedAnalyses]
              }
            }
            return state
          })
          
          return analysis
        } catch (error) {
          console.error('Failed to load analysis from KV:', error)
          return null
        }
      },
      
      loadAnalysisHistory: async () => {
        try {
          const response = await fetch('/api/analyses')
          if (response.ok) {
            const history = await response.json()
            set({ analysisHistory: history })
          }
        } catch (error) {
          console.error('Failed to load analysis history:', error)
        }
      },
      
      updateAnalysisName: (id: string, name: string) => {
        set(state => ({
          savedAnalyses: state.savedAnalyses.map(a => 
            a.id === id ? { ...a, name } : a
          )
        }))
      },
      
      clearAllHistory: async () => {
        try {
          // Clear from KV via API
          await fetch('/api/analyses/clear', { method: 'DELETE' })
        } catch (error) {
          console.error('Failed to clear KV history:', error)
        }
        
        // Clear locally
        set({
          savedAnalyses: [],
          analysisHistory: []
        })
      }
    }),
    {
      name: 'analysis-storage',
      partialize: (state) => ({
        savedAnalyses: state.savedAnalyses,
        // Don't persist analysisHistory as it comes from KV
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