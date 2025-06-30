"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Upload, Search, MapPin, ExternalLink, DollarSign, Clock, Star, Phone, Navigation, ChevronDown, Plus, Loader2 } from "lucide-react"
import { processSBCDocuments } from "@/app/actions/process-sbc"
import type { SBCData, ProcessingResult } from "@/lib/sbc-schema"

interface UploadedPolicy {
  name: string
  file: File
  sbcData?: SBCData
  pdfUrl?: string
  isProcessing?: boolean
}

interface Provider {
  id: string
  name: string
  specialty: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  rating: number
  reviewCount: number
  networkStatus: 'in-network' | 'out-of-network'
  estimatedCost: {
    inNetwork: number
    outOfNetwork: number
  }
  distance: number
  waitTime: string
}


// Mock provider data for demonstration
const MOCK_PROVIDERS: Provider[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson, MD",
    specialty: "Primary Care",
    address: "123 Main St",
    city: "Seattle",
    state: "WA",
    zipCode: "98101",
    phone: "(206) 555-0123",
    rating: 4.8,
    reviewCount: 245,
    networkStatus: 'in-network',
    estimatedCost: { inNetwork: 35, outOfNetwork: 180 },
    distance: 0.8,
    waitTime: "Same day"
  },
  {
    id: "2", 
    name: "Northwest Medical Center",
    specialty: "Urgent Care",
    address: "456 Pine Ave",
    city: "Seattle",
    state: "WA", 
    zipCode: "98102",
    phone: "(206) 555-0456",
    rating: 4.2,
    reviewCount: 89,
    networkStatus: 'in-network',
    estimatedCost: { inNetwork: 125, outOfNetwork: 350 },
    distance: 1.2,
    waitTime: "15 min"
  },
  {
    id: "3",
    name: "Dr. Michael Chen, MD",
    specialty: "Specialist - Cardiology", 
    address: "789 Cedar Blvd",
    city: "Bellevue",
    state: "WA",
    zipCode: "98004",
    phone: "(425) 555-0789",
    rating: 4.9,
    reviewCount: 156,
    networkStatus: 'out-of-network',
    estimatedCost: { inNetwork: 280, outOfNetwork: 480 },
    distance: 3.4,
    waitTime: "2 weeks"
  }
]

export default function FindProvidersPage() {
  const [uploadedPolicy, setUploadedPolicy] = useState<UploadedPolicy | null>(null)
  const [isProcessingSBC, setIsProcessingSBC] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [careSearch, setCareSearch] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [providers, setProviders] = useState<Provider[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handlePolicyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      // Keep dropdown open during processing
      setDropdownOpen(true)
      
      // Set initial state with loading
      setUploadedPolicy({
        name: file.name,
        file: file,
        isProcessing: true
      })
      setIsProcessingSBC(true)
      
      try {
        // Create FormData for processing
        const formData = new FormData()
        formData.append('file', file)
        
        // Process the SBC document
        const result = await processSBCDocuments(formData)
        
        if (result.successCount > 0 && result.results[0]?.success) {
          const processedResult = result.results[0] as ProcessingResult & { success: true }
          setUploadedPolicy({
            name: file.name,
            file: file,
            sbcData: processedResult.data,
            pdfUrl: processedResult.pdfUrl,
            isProcessing: false
          })
        } else {
          // Handle parsing error but keep the file
          setUploadedPolicy({
            name: file.name,
            file: file,
            isProcessing: false
          })
          console.error('SBC parsing failed:', result.results[0]?.error)
        }
      } catch (error) {
        console.error('Error processing SBC:', error)
        // Keep the file but mark processing as failed
        setUploadedPolicy({
          name: file.name,
          file: file,
          isProcessing: false
        })
      } finally {
        setIsProcessingSBC(false)
        // Close dropdown after processing is complete
        setTimeout(() => setDropdownOpen(false), 1000)
      }
    }
    
    // Clear the input value so the same file can be uploaded again
    e.target.value = ''
  }

  const handleSearch = async () => {
    if (!careSearch || !zipCode) return
    
    setIsSearching(true)
    setHasSearched(false)
    
    // Simulate API call
    setTimeout(() => {
      // Filter mock providers based on care search
      const filteredProviders = MOCK_PROVIDERS.filter(provider => 
        provider.specialty.toLowerCase().includes(careSearch.toLowerCase()) ||
        provider.name.toLowerCase().includes(careSearch.toLowerCase())
      )
      
      setProviders(filteredProviders)
      setIsSearching(false)
      setHasSearched(true)
    }, 1500)
  }

  const handleGetDirections = (provider: Provider) => {
    const address = encodeURIComponent(`${provider.address}, ${provider.city}, ${provider.state} ${provider.zipCode}`)
    window.open(`https://maps.google.com/?q=${address}`, '_blank')
  }

  const canSearch = careSearch && zipCode.length >= 5

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Find Optimal Providers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        {/* Policy Context Dropdown */}
        <div className="ml-auto">
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {uploadedPolicy ? (
                  <>
                    {uploadedPolicy.isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="max-w-32 truncate">Processing...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span className="max-w-32 truncate">{uploadedPolicy.sbcData?.plan_summary?.plan_name || uploadedPolicy.name.replace('.pdf', '')}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add Policy</span>
                  </>
                )}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {uploadedPolicy ? (
                <>
                  <div className="p-3">
                    {uploadedPolicy.isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <div>
                          <h3 className="font-semibold text-sm mb-1">Processing SBC Document...</h3>
                          <p className="text-xs text-gray-600">Extracting policy details from your Summary of Benefits and Coverage</p>
                        </div>
                      </div>
                    ) : uploadedPolicy.sbcData ? (
                      <>
                        <h3 className="font-semibold text-sm mb-2">{uploadedPolicy.sbcData.plan_summary.plan_name}</h3>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>Coverage Period: {uploadedPolicy.sbcData.plan_summary.coverage_period.start_date} - {uploadedPolicy.sbcData.plan_summary.coverage_period.end_date}</div>
                          <div>Plan Type: {uploadedPolicy.sbcData.plan_summary.plan_type}</div>
                          <div>Coverage For: {uploadedPolicy.sbcData.plan_summary.coverage_for}</div>
                          <div>Issuer: {uploadedPolicy.sbcData.plan_summary.issuer_name}</div>
                          <div>Contact: {uploadedPolicy.sbcData.plan_summary.issuer_contact_info.phone}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-sm mb-2">{uploadedPolicy.name.replace('.pdf', '')}</h3>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="text-amber-600">SBC parsing incomplete - using file name</div>
                          <div>File: {uploadedPolicy.name}</div>
                        </div>
                      </>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center gap-2"
                    onClick={() => uploadedPolicy.pdfUrl && window.open(uploadedPolicy.pdfUrl, '_blank')}
                    disabled={!uploadedPolicy.pdfUrl}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View SBC Document
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 text-red-600 focus:text-red-600"
                    onClick={() => setUploadedPolicy(null)}
                  >
                    Remove Policy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isProcessingSBC ? (
                    <div className="px-2 py-1">
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Processing New SBC...</div>
                          <div className="text-xs text-gray-500">Updating policy details</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-2 py-2 px-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer mx-1"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        document.getElementById('header-policy-upload')?.click()
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      <span className="flex-1 text-sm">Switch SBC Document</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePolicyUpload}
                        className="hidden"
                        id="header-policy-upload"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1">Upload SBC Document</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Upload your Summary of Benefits and Coverage (SBC) PDF to get personalized cost estimates and provider recommendations
                    </p>
                  </div>
                  <div className="px-2 py-1">
                    {isProcessingSBC ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">Processing SBC Document...</div>
                          <div className="text-xs text-gray-500">Extracting policy details</div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 py-2 px-2 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          document.getElementById('header-policy-upload-new')?.click()
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        <span className="flex-1 text-sm">Choose SBC PDF File</span>
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePolicyUpload}
                          className="hidden"
                          id="header-policy-upload-new"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Optimal Providers</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find optimal providers near you with personalized recommendations.
            </p>
          </div>


          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-green-600" />
                Find Providers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="care-search">Search for care</Label>
                  <Input
                    id="care-search"
                    placeholder="e.g. Primary care, Dermatologist, Urgent care"
                    value={careSearch}
                    onChange={(e) => setCareSearch(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zip-code">ZIP Code</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="zip-code"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="pl-10"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSearch}
                disabled={!canSearch || isSearching}
                size="lg"
                className="w-full"
              >
                {isSearching ? (
                  <>Searching Providers...</>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find Providers
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          {hasSearched && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Found {providers.length} providers for "{careSearch}" near {zipCode}
                </h2>
              </div>

              {providers.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                    <p className="text-gray-600">Try expanding your search area or selecting a different care type.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <Card key={provider.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-2">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                  {provider.name}
                                </h3>
                                <p className="text-gray-600 mb-2">{provider.specialty}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {provider.distance} mi away
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {provider.waitTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    {provider.phone}
                                  </div>
                                </div>
                              </div>
                              <Badge 
                                variant={provider.networkStatus === 'in-network' ? 'default' : 'secondary'}
                                className={provider.networkStatus === 'in-network' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                              >
                                {provider.networkStatus === 'in-network' ? 'In-Network' : 'Out-of-Network'}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-medium">{provider.rating}</span>
                                <span className="text-gray-500">({provider.reviewCount} reviews)</span>
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                              {provider.address}, {provider.city}, {provider.state} {provider.zipCode}
                            </p>
                          </div>

                          <div className="lg:text-right">
                            <div className="mb-4">
                              <div className="flex items-center gap-1 mb-1">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-900">Estimated Cost</span>
                              </div>
                              {uploadedPolicy ? (
                                <div className="space-y-1">
                                  <div className="text-lg font-bold text-green-600">
                                    ${provider.estimatedCost.inNetwork}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Your cost (in-network)
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="text-sm">
                                    <span className="text-green-600 font-semibold">${provider.estimatedCost.inNetwork}</span>
                                    <span className="text-gray-500"> (in-network)</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-yellow-600 font-semibold">${provider.estimatedCost.outOfNetwork}</span>
                                    <span className="text-gray-500"> (out-of-network)</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button 
                                onClick={() => handleGetDirections(provider)}
                                variant="default"
                                size="sm"
                                className="w-full lg:w-auto"
                              >
                                <Navigation className="w-4 h-4 mr-2" />
                                Get Directions
                              </Button>
                              <Button 
                                variant="outline"
                                size="sm"
                                className="w-full lg:w-auto"
                                onClick={() => window.open(`tel:${provider.phone}`, '_self')}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Call Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  )
}