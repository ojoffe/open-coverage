"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { Eye, FileText, Github, Heart, HeartCrack, Info, MoreHorizontal, Stethoscope, Trash2, Wrench } from "lucide-react"

import { AboutModal } from "@/components/about-modal"
import { SbcInfoModal } from "@/components/sbc-info-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAnalysisHistoryStore } from "@/lib/analysis-history-store"
import { useAnalysisStore } from "@/lib/analysis-store"
import { useRouter } from "next/navigation"

// Define proper types for the navigation items
type NavigationItem = {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
  action?: string
  external?: boolean
}

const data = {
  navMain: [
    {
      title: "Tools",
      items: [
        {
          title: "Health Profile",
          url: "/health-profile",
          icon: Heart,
          isActive: false,
        },
        {
          title: "Analyze Policy",
          url: "/analyze-policy",
          icon: FileText,
          isActive: false,
        },
        {
          title: "Compare Policies",
          url: "/analyze-compare",
          icon: Wrench,
          isActive: false,
        },
        // {
        //   title: "Cost Analysis",
        //   url: "/cost-analysis",
        //   icon: DollarSign,
        //   isActive: false,
        // },
        // {
        //   title: "Compare Policies",
        //   url: "/compare-policies",
        //   icon: FileText,
        //   isActive: false,
        // },
        {
          title: "Find Optimal Providers",
          url: "/find-providers",
          icon: Stethoscope,
          isActive: false,
        },
      ] as NavigationItem[],
    },
    {
      title: "Resources",
      items: [
        {
          title: "What is an SBC Document?",
          url: "#",
          icon: FileText,
          action: "openSbcModal",
        },
        {
          title: "About",
          url: "#",
          icon: Info,
          action: "openAboutModal",
        },
        {
          title: "GitHub Repository",
          url: "https://github.com/aaln/open-coverage",
          icon: Github,
          external: true,
        },
      ] as NavigationItem[],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Check localStorage on mount
  if (typeof window !== 'undefined') {
    console.log('=== AppSidebar Mount - LocalStorage Check ===')
    console.log('All localStorage keys:', Object.keys(localStorage))
    console.log('coverage-analysis-history:', localStorage.getItem('coverage-analysis-history'))
    console.log('analysis-storage:', localStorage.getItem('analysis-storage'))
  }
  const [sbcModalOpen, setSbcModalOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const { savedAnalyses, deleteAnalysis, clearAllHistory, saveAnalysis } = useAnalysisStore()
  const { analyses: historyAnalyses, removeAnalysis, addAnalysis } = useAnalysisHistoryStore()
  const router = useRouter()

  // Debug logging
  useEffect(() => {
    console.log('AppSidebar Debug:')
    console.log('- savedAnalyses from analysis-store:', savedAnalyses)
    console.log('- historyAnalyses from analysis-history-store:', historyAnalyses)
    console.log('- localStorage analysis-storage:', localStorage.getItem('analysis-storage'))
    console.log('- localStorage coverage-analysis-history:', localStorage.getItem('coverage-analysis-history'))
  }, [savedAnalyses, historyAnalyses])

  const handleItemClick = (item: NavigationItem) => {
    if (item.action === "openSbcModal") {
      setSbcModalOpen(true)
    } else if (item.action === "openAboutModal") {
      setAboutModalOpen(true)
    }
  }

  const handleViewAnalysis = (id: string) => {
    router.push(`/analysis/${id}`)
  }

  const handleDeleteAnalysis = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysis(id)
      removeAnalysis(id)
    }
  }

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
      clearAllHistory()
      // Clear history analyses by removing each one
      historyAnalyses.forEach(analysis => removeAnalysis(analysis.id))
    }
  }

  // Combine analyses from both stores, prioritizing history analyses
  const historyAnalysisMap = new Map(historyAnalyses.map(a => [a.id, a]))
  const analysisStoreMap = new Map(savedAnalyses.map(a => [a.id, a]))
  
  // Merge analyses, preferring history store data
  const allAnalysesMap = new Map()
  
  // Add all from history store
  historyAnalyses.forEach(analysis => {
    allAnalysesMap.set(analysis.id, {
      id: analysis.id,
      name: analysis.name,
      policyCount: analysis.policyNames.length,
      createdAt: analysis.date,
    })
  })
  
  // Add any from analysis store that aren't in history
  savedAnalyses.forEach(analysis => {
    if (!historyAnalysisMap.has(analysis.id)) {
      allAnalysesMap.set(analysis.id, {
        id: analysis.id,
        name: analysis.name,
        policyCount: analysis.policyNames.length,
        createdAt: analysis.createdAt,
      })
    }
  })
  
  const allAnalyses = Array.from(allAnalysesMap.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader className="border-b border-sidebar-border">
          <div 
            className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-sidebar-hover rounded-sm transition-colors"
            onClick={() => router.push('/')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <HeartCrack className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Open Coverage</span>
              <span className="text-xs text-sidebar-foreground/70">US Health Insurance Optimizer</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {data.navMain.map((group) => (
            <SidebarGroup key={group.title}>
              <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={!item.action} 
                        isActive={item.isActive}
                        onClick={item.action ? () => handleItemClick(item) : undefined}
                      >
                        {item.action ? (
                          <div className="flex items-center gap-2 cursor-pointer">
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                        ) : (
                          <a
                            href={item.url}
                            target={item.external ? "_blank" : undefined}
                            rel={item.external ? "noopener noreferrer" : undefined}
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
        
        {/* Consolidated Analyses Section */}
        <SidebarContent className="border-t">
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              Recent Analyses
              <div className="flex items-center gap-1">
                {/* <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    console.log('=== Debug Analysis Storage ===')
                    console.log('savedAnalyses:', savedAnalyses)
                    console.log('historyAnalyses:', historyAnalyses)
                    console.log('allAnalyses:', allAnalyses)
                    console.log('localStorage keys:', Object.keys(localStorage))
                    console.log('analysis-storage:', localStorage.getItem('analysis-storage'))
                    console.log('coverage-analysis-history:', localStorage.getItem('coverage-analysis-history'))
                    
                    // Test adding a dummy analysis
                    const testId = `test-${Date.now()}`
                    console.log('Adding test analysis with ID:', testId)
                    
                    // Add to analysis store
                    const dummyResults: any = {
                      results: [],
                      successCount: 0,
                      errorCount: 0
                    }
                    saveAnalysis(`Test Analysis ${new Date().toLocaleTimeString()}`, dummyResults)
                    
                    // Add to history store
                    addAnalysis({
                      id: testId,
                      name: `Test History ${new Date().toLocaleTimeString()}`,
                      date: new Date().toISOString(),
                      policyNames: ['Test Policy 1', 'Test Policy 2'],
                      familySize: 2,
                      totalAnnualCost: 10000,
                      analysisData: dummyResults
                    })
                  }}
                  className="h-6 px-2 text-xs"
                >
                  Debug
                </Button> */}
                {allAnalyses.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearAllHistory}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allAnalyses.length === 0 ? (
                    <SidebarMenuItem>
                      <div className="px-2 py-1.5 text-sm text-sidebar-foreground/50">
                        No saved analyses yet
                      </div>
                    </SidebarMenuItem>
                  ) : (
                    allAnalyses.slice(0, 8).map((analysis) => (
                      <SidebarMenuItem key={analysis.id}>
                      <div className="flex items-center gap-2 px-2 py-1.5 w-full">
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer hover:bg-sidebar-hover rounded-sm px-1 py-1 min-w-0"
                          onClick={() => handleViewAnalysis(analysis.id)}
                        >
                          <Eye className="h-4 w-4 text-sidebar-foreground/70 flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                            <span className="text-sm font-medium text-sidebar-foreground truncate block">
                              {analysis.name}
                            </span>
                            <span className="text-xs text-sidebar-foreground/70 truncate block">
                              {analysis.policyCount} policies • {new Date(analysis.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewAnalysis(analysis.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => handleDeleteAnalysis(analysis.id, e)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        
        <SidebarRail />
      </Sidebar>
      <SbcInfoModal open={sbcModalOpen} onOpenChange={setSbcModalOpen} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </>
  )
}
