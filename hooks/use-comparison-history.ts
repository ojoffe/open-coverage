/**
 * Hook for managing policy comparison history
 * 
 * This hook provides functionality to:
 * - Save comparison sessions with policies and situations
 * - Load previously saved comparisons
 * - List all saved comparisons
 * - Delete old comparisons
 * - Generate meaningful names for comparisons
 * 
 * Data is persisted in localStorage with automatic cleanup of old entries.
 */

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  PolicyComparison, 
  ComparisonSummary, 
  PolicyWithGrades, 
  ComparisonSituation,
  PolicyComparisonSchema,
  ComparisonSummarySchema
} from "@/types/schemas";

const STORAGE_KEY = "health-insurance-comparison-history";
const MAX_COMPARISONS = 10; // Keep only the 10 most recent comparisons

interface UseComparisonHistoryReturn {
  /** List of saved comparison summaries */
  comparisons: ComparisonSummary[];
  /** Current comparison being viewed/edited */
  currentComparison: PolicyComparison | null;
  /** Whether operations are in progress */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  
  // Operations
  /** Save a new comparison or update an existing one */
  saveComparison: (
    policies: PolicyWithGrades[], 
    situations: ComparisonSituation[], 
    name?: string,
    notes?: string
  ) => Promise<string>;
  /** Load a specific comparison by ID */
  loadComparison: (id: string) => Promise<PolicyComparison | null>;
  /** Delete a comparison */
  deleteComparison: (id: string) => Promise<void>;
  /** Clear all comparisons */
  clearAllComparisons: () => Promise<void>;
  /** Generate a meaningful name for a comparison */
  generateComparisonName: (policies: PolicyWithGrades[]) => string;
  /** Set the current comparison */
  setCurrentComparison: (comparison: PolicyComparison | null) => void;
}

export function useComparisonHistory(): UseComparisonHistoryReturn {
  const [comparisons, setComparisons] = useState<ComparisonSummary[]>([]);
  const [currentComparison, setCurrentComparison] = useState<PolicyComparison | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load comparisons from localStorage on mount
  useEffect(() => {
    loadComparisonsFromStorage();
  }, []);

  /**
   * Load all comparison summaries from localStorage
   */
  const loadComparisonsFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setComparisons([]);
        return;
      }

      const data = JSON.parse(stored);
      
      // Validate and parse each comparison summary
      const validComparisons: ComparisonSummary[] = [];
      for (const item of data) {
        try {
          // Convert date strings back to Date objects
          const comparison = {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          };
          
          const validComparison = ComparisonSummarySchema.parse(comparison);
          validComparisons.push(validComparison);
        } catch (validationError) {
          console.warn("Invalid comparison summary found, skipping:", validationError);
        }
      }

      // Sort by most recent first
      validComparisons.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setComparisons(validComparisons);
      setError(null);
    } catch (error) {
      console.error("Error loading comparisons from storage:", error);
      setError("Failed to load comparison history");
      setComparisons([]);
    }
  }, []);

  /**
   * Save comparisons to localStorage
   */
  const saveComparisonsToStorage = useCallback((comparisons: ComparisonSummary[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
    } catch (error) {
      console.error("Error saving comparisons to storage:", error);
      throw new Error("Failed to save comparison history");
    }
  }, []);

  /**
   * Save a full comparison to localStorage with a generated key
   */
  const saveFullComparisonToStorage = useCallback((comparison: PolicyComparison) => {
    try {
      const key = `${STORAGE_KEY}_full_${comparison.id}`;
      localStorage.setItem(key, JSON.stringify(comparison));
    } catch (error) {
      console.error("Error saving full comparison to storage:", error);
      throw new Error("Failed to save full comparison data");
    }
  }, []);

  /**
   * Load a full comparison from localStorage
   */
  const loadFullComparisonFromStorage = useCallback((id: string): PolicyComparison | null => {
    try {
      const key = `${STORAGE_KEY}_full_${id}`;
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      const comparison = {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };

      return PolicyComparisonSchema.parse(comparison);
    } catch (error) {
      console.error("Error loading full comparison from storage:", error);
      return null;
    }
  }, []);

  /**
   * Delete a full comparison from localStorage
   */
  const deleteFullComparisonFromStorage = useCallback((id: string) => {
    try {
      const key = `${STORAGE_KEY}_full_${id}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error deleting full comparison from storage:", error);
    }
  }, []);

  /**
   * Generate a meaningful name for a comparison based on the policies
   */
  const generateComparisonName = useCallback((policies: PolicyWithGrades[]): string => {
    if (policies.length === 0) return "New Comparison";
    
    if (policies.length === 1) {
      return `${policies[0].plan_summary.plan_name} Analysis`;
    }
    
    if (policies.length === 2) {
      return `${policies[0].plan_summary.plan_name} vs ${policies[1].plan_summary.plan_name}`;
    }
    
    // For 3+ policies, use first policy name + count
    return `${policies[0].plan_summary.plan_name} + ${policies.length - 1} others`;
  }, []);

  /**
   * Save a new comparison or update an existing one
   */
  const saveComparison = useCallback(async (
    policies: PolicyWithGrades[], 
    situations: ComparisonSituation[], 
    name?: string,
    notes?: string
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const id = currentComparison?.id || `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const comparisonName = name || generateComparisonName(policies);
      
      // Create the full comparison object
      const fullComparison: PolicyComparison = {
        id,
        name: comparisonName,
        createdAt: currentComparison?.createdAt || now,
        updatedAt: now,
        policies,
        situations,
        notes,
      };

      // Validate the comparison
      PolicyComparisonSchema.parse(fullComparison);

      // Save the full comparison
      saveFullComparisonToStorage(fullComparison);

      // Create summary for the list
      const summary: ComparisonSummary = {
        id,
        name: comparisonName,
        createdAt: fullComparison.createdAt,
        updatedAt: now,
        policyCount: policies.length,
        situationCount: situations.length,
        policyNames: policies.map(p => p.plan_summary.plan_name),
      };

      // Update the comparisons list
      const updatedComparisons = [
        summary,
        ...comparisons.filter(c => c.id !== id)
      ].slice(0, MAX_COMPARISONS); // Keep only the most recent

      // Clean up old comparisons that exceed the limit
      const removedComparisons = comparisons.slice(MAX_COMPARISONS - 1);
      for (const removed of removedComparisons) {
        deleteFullComparisonFromStorage(removed.id);
      }

      setComparisons(updatedComparisons);
      saveComparisonsToStorage(updatedComparisons);
      setCurrentComparison(fullComparison);

      toast.success(`Comparison saved: ${comparisonName}`);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save comparison";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentComparison, comparisons, generateComparisonName, saveFullComparisonToStorage, saveComparisonsToStorage, deleteFullComparisonFromStorage]);

  /**
   * Load a specific comparison by ID
   */
  const loadComparison = useCallback(async (id: string): Promise<PolicyComparison | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const comparison = loadFullComparisonFromStorage(id);
      if (!comparison) {
        setError("Comparison not found");
        toast.error("Comparison not found");
        return null;
      }

      setCurrentComparison(comparison);
      toast.success(`Loaded comparison: ${comparison.name}`);
      return comparison;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load comparison";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadFullComparisonFromStorage]);

  /**
   * Delete a comparison
   */
  const deleteComparison = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Remove from summaries
      const updatedComparisons = comparisons.filter(c => c.id !== id);
      setComparisons(updatedComparisons);
      saveComparisonsToStorage(updatedComparisons);

      // Remove full comparison data
      deleteFullComparisonFromStorage(id);

      // Clear current comparison if it's the one being deleted
      if (currentComparison?.id === id) {
        setCurrentComparison(null);
      }

      toast.success("Comparison deleted");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete comparison";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [comparisons, currentComparison, saveComparisonsToStorage, deleteFullComparisonFromStorage]);

  /**
   * Clear all comparisons
   */
  const clearAllComparisons = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Delete all full comparison data
      for (const comparison of comparisons) {
        deleteFullComparisonFromStorage(comparison.id);
      }

      // Clear the summaries
      setComparisons([]);
      localStorage.removeItem(STORAGE_KEY);
      setCurrentComparison(null);

      toast.success("All comparisons cleared");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clear comparisons";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [comparisons, deleteFullComparisonFromStorage]);

  return {
    comparisons,
    currentComparison,
    isLoading,
    error,
    saveComparison,
    loadComparison,
    deleteComparison,
    clearAllComparisons,
    generateComparisonName,
    setCurrentComparison,
  };
}