"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, ArrowRight, Shield, Upload, BarChart3, Stethoscope } from "lucide-react"
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
              An open source initiative to provide free tools to US healthcare insurance consumers to make smarter insurance and provider decisions.
            </p>
          </div>

          {/* How It Works + Health Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
            {/* How It Works - Compact */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">1. Set Up Health Profile</h3>
                    <p className="text-sm text-gray-600">Configure your family's health information. Data is stored locally for privacy.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Upload className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">2. Upload SBC Documents</h3>
                    <p className="text-sm text-gray-600">Upload insurance policies and let AI extract key information.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">3. Compare & Analyze</h3>
                    <p className="text-sm text-gray-600">Get personalized cost projections and side-by-side comparisons.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Health Profile Card */}
            <div className="lg:col-span-1">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    Health Profile
                  </CardTitle>
                  <CardDescription>
                    Set up your family's health information for personalized recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Family member profiles</li>
                    <li>• Medical conditions & medications</li>
                    <li>• Expected visit frequencies</li>
                    <li>• Stored locally for privacy</li>
                  </ul>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/health-profile">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tools Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tools</h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Analyze & Compare
                </CardTitle>
                <CardDescription>Upload and compare multiple health insurance policies side by side</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Upload up to 8 SBC documents</li>
                  <li>• AI-powered policy analysis</li>
                  <li>• Side-by-side comparison tables</li>
                  <li>• Personalized cost projections</li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/analyze-compare">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
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
            </Card>
          </div>
           {/* Privacy Notice - Compact */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
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
        </div>
      </div>
    </SidebarInset>
  )
}
