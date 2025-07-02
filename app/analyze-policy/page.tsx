"use client"

import { EnhancedPolicyProvider } from "@/components/enhanced-policy-context"
import { PolicySelector } from "@/components/policy-selector"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { User } from "lucide-react"
import Link from "next/link"
import { Assistant } from "../assistant"

export default function AnalyzePolicyPage() {
  return (
    <EnhancedPolicyProvider>
    <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2 border-b px-4">
          <div className="flex w-full  items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Analyze Policy</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          
          </div>
          {/* Health Profile Button */}
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-2"
            >
              <Link href="/health-profile">
                <User className="w-4 h-4" />
                <span>Health Profile</span>
              </Link>
            </Button>
          </div>
          <PolicySelector />
        </header>
        
        <div className="flex-1">
          <Assistant />
        </div>
      </SidebarInset>
    </EnhancedPolicyProvider>
  )
}