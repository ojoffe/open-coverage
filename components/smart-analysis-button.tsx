"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Shield,
  DollarSign
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { unifiedAnalysisService } from '@/lib/unified-analysis-service'
import { ProcessSBCResponse } from '@/lib/sbc-schema'
import { Member } from '@/lib/health-profile-store'

interface SmartAnalysisButtonProps {
  sbcResults: ProcessSBCResponse
  members: Member[]
  location: string
  onComplete: (results: any) => void
  className?: string
}

interface ProgressState {
  stage: 'idle' | 'preparing' | 'generating-plan' | 'retrieving-costs' | 'analyzing' | 'complete'
  message: string
  progress: number
  details?: string[]
}

export function SmartAnalysisButton({
  sbcResults,
  members,
  location,
  onComplete,
  className
}: SmartAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progressState, setProgressState] = useState<ProgressState>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const [error, setError] = useState<string | null>(null)

  const hasHealthProfile = members.some(m => 
    m.age && (m.conditions?.length > 0 || m.medications?.length > 0 || m.otherServices?.length > 0)
  )

  const handleAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      const results = await unifiedAnalysisService.analyzeWithHealthProfile({
        sbcResults,
        members,
        location,
        onProgress: (progress) => {
          setProgressState(progress)
        }
      })

      // Small delay to show completion
      setTimeout(() => {
        onComplete(results)
        setIsAnalyzing(false)
      }, 500)
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
      setIsAnalyzing(false)
    }
  }

  if (!hasHealthProfile) {
    return (
      <Card className={cn("border-yellow-200 bg-yellow-50", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900">Complete Your Health Profile</h3>
              <p className="text-sm text-yellow-800 mt-1">
                Add your medical conditions, medications, or expected healthcare services to get personalized policy recommendations.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={() => window.location.href = '/health-profile'}
              >
                Go to Health Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isAnalyzing) {
    return (
      <Card className={cn("border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <Sparkles className="w-4 h-4 text-blue-600 absolute -top-1 -right-1" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">{progressState.message}</h3>
                {progressState.details && progressState.details.length > 0 && (
                  <ul className="text-xs text-blue-700 mt-1 space-y-0.5">
                    {progressState.details.map((detail, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-400 rounded-full" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <Progress value={progressState.progress} className="h-2" />
            
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span>Analyzing {sbcResults.successCount} policies</span>
              <span>{progressState.progress}% complete</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900">Analysis Error</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleAnalysis}
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-green-200 bg-gradient-to-br from-green-50 to-blue-50", className)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Ready to Analyze</h3>
              <p className="text-sm text-gray-600 mt-1">
                Get instant personalized recommendations based on your health profile
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <Shield className="w-5 h-5 text-blue-600 mx-auto mb-1" />
              <div className="text-xs font-medium">Coverage Match</div>
              <div className="text-xs text-gray-500">For your conditions</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <DollarSign className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <div className="text-xs font-medium">Cost Analysis</div>
              <div className="text-xs text-gray-500">Real pricing data</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-gray-200">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <div className="text-xs font-medium">Smart Insights</div>
              <div className="text-xs text-gray-500">AI-powered</div>
            </div>
          </div>

          <Button 
            onClick={handleAnalysis}
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Analyze with My Health Profile
          </Button>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>One-click analysis • No manual configuration needed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}