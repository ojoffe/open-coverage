"use client"

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { ArrowRight, FileText, Shield, Users } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="flex-1 bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Open Coverage</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Open source tools for US healthcare insurance consumers to make smarter insurance and provider decisions.
            </p>
          </div>

          {/* How It Works Section */}
          

          {/* Tools Section */}
          {/* <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tools</h2>
          </div> */}

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Health Profile
                </CardTitle>
                <CardDescription>Set up your family's health information for personalized recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Family member profiles</li>
                  <li>• Medical conditions & medications</li>
                  <li>• Expected visit frequencies</li>
                  <li>• Stored locally for privacy</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/health-profile">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  Analyze Policy
                </CardTitle>
                <CardDescription>Get detailed analysis of a single health insurance policy</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload one SBC document</li>
                  <li>• Detailed coverage breakdown</li>
                  <li>• Personalized cost estimates</li>
                  <li>• Coverage insights</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/analyze-policy">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Compare Policies
                </CardTitle>
                <CardDescription>Compare multiple health insurance policies side by side</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload up to 8 SBC documents</li>
                  <li>• Side-by-side comparison</li>
                  <li>• Cost analysis</li>
                  <li>• Best match recommendations</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/analyze-compare">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-green-600" />
                  Find Optimal Providers
                </CardTitle>
                <CardDescription>Find healthcare providers with cost estimates based on your coverage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Search by care type and location</li>
                  <li>• In-network and out-of-network options</li>
                  <li>• Cost projections with or without insurance</li>
                  <li>• Provider ratings and directions</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/find-providers">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card> */}
          </div>
          
          {/* Disclaimers */}
          <div className="space-y-4 mt-6">
            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm mb-1">Privacy & Security</h4>
                  <p className="text-blue-800 text-xs">
                    Health data stored locally. Only non-identifying information sent to AI providers. 
                    No personal details like names or addresses collected.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Accuracy Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900 text-sm mb-1">Important: Please Verify All Results</h4>
                  <p className="text-amber-800 text-xs">
                    Accurate US healthcare pricing is extremely complex and varies significantly by provider, location, and specific circumstances. 
                    Our tools provide estimates based on available data, but actual costs may differ. We're continuously working to improve 
                    accuracy and expand our coverage. Always confirm costs with your insurance provider and healthcare facilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
