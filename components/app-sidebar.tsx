"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { FileText, Github, Home, Info, MoreHorizontal, Trash2, Eye, HeartCrack, Wrench, History, Stethoscope } from "lucide-react"

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
import { SbcInfoModal } from "@/components/sbc-info-modal"
import { AboutModal } from "@/components/about-modal"
import { useAnalysisStore } from "@/lib/analysis-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
          title: "Analyze & Compare Policies",
          url: "/analyze-compare",
          icon: Wrench,
          isActive: false,
        },
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
          url: "https://github.com/opencoverage/open-coverage",
          icon: Github,
          external: true,
        },
      ] as NavigationItem[],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [sbcModalOpen, setSbcModalOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const { savedAnalyses, deleteAnalysis, analysisHistory, loadAnalysisHistory, clearAllHistory } = useAnalysisStore()
  const router = useRouter()

  // Load analysis history on component mount
  useEffect(() => {
    loadAnalysisHistory()
  }, [])

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
    }
  }

  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete all analysis history? This cannot be undone.')) {
      clearAllHistory()
    }
  }

  // Combine saved analyses and analysis history, removing duplicates by ID
  const allAnalyses = [
    ...savedAnalyses.map(analysis => ({
      id: analysis.id,
      name: analysis.name,
      policyCount: analysis.policyNames.length,
      createdAt: analysis.createdAt,
    })),
    ...analysisHistory.filter(history => 
      !savedAnalyses.find(saved => saved.id === history.id)
    ).map(history => ({
      id: history.id,
      name: history.name,
      policyCount: history.policyCount,
      createdAt: history.createdAt,
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-2">
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
        {allAnalyses.length > 0 && (
          <SidebarContent className="border-t">
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center justify-between">
                Recent Analyses
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
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {allAnalyses.slice(0, 8).map((analysis) => (
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
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        )}
        
        <SidebarRail />
      </Sidebar>
      <SbcInfoModal open={sbcModalOpen} onOpenChange={setSbcModalOpen} />
      <AboutModal open={aboutModalOpen} onOpenChange={setAboutModalOpen} />
    </>
  )
}
