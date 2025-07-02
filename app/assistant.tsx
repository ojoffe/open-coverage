/**
 * Main Assistant Component - Core application interface for health insurance analysis
 * 
 * This component serves as the primary interface for the Health Insurance Coverage
 * Analyzer application. It provides a comprehensive AI-powered analysis platform
 * for understanding health insurance benefits and coverage.
 * 
 * Key features:
 * - AI-powered chat interface with insurance expertise
 * - Policy document upload and analysis
 * - Interactive coverage category exploration
 * - Responsive design with mobile support
 * - Error boundaries for graceful error handling
 * 
 * Architecture:
 * - AssistantRuntimeProvider: Manages AI chat runtime and API communication
 * - PolicyProvider: Centralized policy data management with persistence
 * - Error boundaries: Graceful handling of AI and component errors
 * - Responsive layout: Mobile modal, desktop sidebar integration
 */

"use client";

import { AssistantModal } from "@/components/assistant-ui/assistant-modal";
import { AIErrorBoundary, GeneralErrorBoundary } from "@/components/error-boundaries";
import PolicyAnalysis from "@/components/policy-analysis";
import { PolicyOverview } from "@/components/policy-overview";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHealthProfileStore } from "@/lib/health-profile-store";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

/**
 * Main Assistant Application Component
 * 
 * Orchestrates the entire health insurance analysis application, providing
 * AI-powered insights, policy management, and interactive coverage exploration.
 * 
 * Component hierarchy:
 * 1. GeneralErrorBoundary - Catches all React errors
 * 2. AssistantRuntimeProvider - AI chat runtime management
 * 3. PolicyProvider - Insurance policy data context
 * 4. SidebarProvider - Responsive layout management
 * 5. Main content areas - Policy analysis and overview
 * 
 * @returns JSX.Element The complete application interface
 */
export const Assistant = () => {
  // ========================================================================
  // SETUP AND CONFIGURATION
  // ========================================================================
  
  /** Initialize the AI chat runtime with API endpoint */
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  /** Check if we're on a mobile device for responsive layout */
  const isMobile = useIsMobile();
  
  /** Get health profile data */
  const { members } = useHealthProfileStore();
  const hasHealthProfile = members.length > 0 && members[0].age && (
    members[0].conditions.length > 0 || 
    members[0].medications.length > 0 ||
    members[0].otherServices?.length > 0
  );
  
  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <GeneralErrorBoundary 
      onError={(error, errorInfo) => {
        // In production, send to monitoring service
        console.error("Application Error:", error, errorInfo);
        // Example: errorReportingService.report(error, errorInfo);
      }}
    >
      <AssistantRuntimeProvider runtime={runtime}>
                {/* Main Content Area */}
                <main className="flex flex-col min-h-full p-6 w-full">
                  
                  {/* Policy Overview Section */}
                  <AIErrorBoundary 
                    context="Policy Overview"
                    fallback={() => (
                      <div className="p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Policy overview is temporarily unavailable
                        </p>
                      </div>
                    )}
                  >
                    <PolicyOverview />
                  </AIErrorBoundary>

                  {/* Main Policy Analysis Interface */}
                  <div className="flex-1">
                    <PolicyAnalysis />
                  </div>
                  
                  {/* Main Policy Analysis Interface */}
                  {/* <div className="flex-1">
                    <AssistantPolicyAnalysis />
                  </div> */}
                  
                </main>
                
                {/* Mobile Chat Modal - Only shown on mobile devices */}
                {isMobile && (
                  <AIErrorBoundary 
                    context="Mobile Chat"
                    fallback={() => (
                      <div className="fixed bottom-4 right-4 p-2 bg-background border rounded">
                        Chat unavailable
                      </div>
                    )}
                  >
                    <AssistantModal />
                  </AIErrorBoundary>
                )}

      </AssistantRuntimeProvider>
    </GeneralErrorBoundary>
  );
};
