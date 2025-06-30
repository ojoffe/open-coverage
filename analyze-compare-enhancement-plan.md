# Analyze & Compare Enhancement Plan

## Overview
Transform the /analyze-compare page into the primary user flow that seamlessly integrates health profile data with uploaded insurance policies to provide clear, actionable recommendations.

## User Journey Vision

### Ideal Flow
1. User completes health profile → 2. Uploads insurance documents → 3. Gets personalized analysis → 4. Sees clear recommendation

### Current Pain Points
- Disconnected experience between health profile and analysis
- Uploaded policies not integrated with cost calculations
- Generic sample policies instead of user's actual options
- Lack of visual clarity on which policy is best

## Implementation Plan

### Phase 1: Unified Analysis Experience (Immediate Priority)

#### 1.1 Enhance Main Analysis Page
**File: `/app/analyze-compare/page.tsx`**

```typescript
// New structure
interface UnifiedAnalysisState {
  healthProfile: {
    isComplete: boolean
    summary: HealthProfileSummary
    treatmentPlan: EnhancedTreatmentPlan
  }
  uploadedPolicies: {
    count: number
    policies: ParsedSBCDocument[]
    analysisResults: PolicyCostAnalysis[]
  }
  recommendations: {
    bestOverall: string
    bestForConditions: Map<string, string>
    savingsOpportunity: number
    confidence: 'high' | 'medium' | 'low'
  }
}
```

Key Features:
- Single page that combines profile summary + policy analysis
- Real-time cost calculations as policies are uploaded
- Clear visual hierarchy showing recommendation

#### 1.2 Health Profile Integration
- Auto-load completed health profile data
- Show profile completeness indicator
- Display relevant conditions/medications that impact costs
- Allow quick profile edits without leaving page

#### 1.3 Smart Policy Analysis
- Parse uploaded SBC documents into InsurancePolicy format
- Calculate real costs based on user's specific conditions
- Show side-by-side comparison with visual indicators
- Highlight differences that matter for user's situation

### Phase 2: Visual Enhancements

#### 2.1 Recommendation Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Your Personalized Insurance Recommendation         │
│                                                     │
│  ⭐ RECOMMENDED: [Policy Name]                      │
│  Expected Annual Cost: $X,XXX                       │
│  Savings vs. other options: $X,XXX                 │
│                                                     │
│  Why this works for you:                            │
│  ✓ Covers your diabetes medications                │
│  ✓ In-network specialists for your conditions      │
│  ✓ Lower out-of-pocket for expected treatments     │
└─────────────────────────────────────────────────────┘
```

#### 2.2 Cost Breakdown Visualization
- Monthly cost timeline showing when deductibles are met
- Stacked bar charts comparing total costs
- Scenario sliders (healthy year vs. medical emergency)
- Medication coverage comparison table

#### 2.3 Decision Support Tools
- "What matters most" questionnaire
- Risk tolerance assessment
- Trade-off visualizer (premium vs. deductible)
- Network adequacy checker

### Phase 3: Enhanced SBC Processing

#### 3.1 Improve Parser Accuracy
**File: `/lib/sbc-parser-enhanced.ts`**
- Better extraction of cost-sharing details
- Handle variations in SBC formats
- Extract network information
- Parse prescription formularies

#### 3.2 Policy Normalization
- Convert parsed SBC to standardized InsurancePolicy format
- Fill missing data with intelligent defaults
- Validate extracted data for completeness

### Phase 4: Personalized Insights

#### 4.1 Condition-Specific Analysis
For each condition in user's profile:
- Expected annual treatment cost
- How each policy covers treatments
- Specialist network availability
- Medication tier placement

#### 4.2 Smart Recommendations
- ML-based confidence scoring
- Explanation of recommendation logic
- Alternative options with trade-offs
- Red flags and warnings

## Technical Implementation

### 1. Update Main Analysis Flow
```typescript
// /app/analyze-compare/page.tsx
export default function AnalyzeComparePage() {
  // Load health profile
  const { members, profileComplete } = useHealthProfileStore()
  const { analyses } = useAnalysisStore()
  
  // Generate treatment plan
  const treatmentPlan = useMemo(() => {
    if (!profileComplete) return null
    return treatmentPlanGenerator.generateEnhancedTreatmentPlan(members[0])
  }, [members, profileComplete])
  
  // Calculate costs for uploaded policies
  const policyAnalyses = useMemo(() => {
    if (!treatmentPlan || analyses.length === 0) return []
    
    return analyses.map(analysis => {
      const policy = convertSBCToPolicy(analysis)
      return insuranceCalculator.calculatePolicyCosts(
        policy,
        treatmentPlan,
        members.length
      )
    })
  }, [treatmentPlan, analyses])
  
  // Generate recommendation
  const recommendation = useMemo(() => {
    if (policyAnalyses.length === 0) return null
    return generatePersonalizedRecommendation(policyAnalyses, treatmentPlan)
  }, [policyAnalyses, treatmentPlan])
}
```

### 2. Create SBC to Policy Converter
```typescript
// /lib/sbc-to-policy-converter.ts
export function convertSBCToPolicy(sbc: ParsedSBCDocument): InsurancePolicy {
  return {
    id: sbc.id,
    name: sbc.planName,
    carrier: sbc.insuranceCompany,
    type: detectPlanType(sbc),
    premium: extractPremiums(sbc),
    deductible: extractDeductibles(sbc),
    outOfPocketMax: extractOOPMax(sbc),
    coinsurance: extractCoinsurance(sbc),
    costSharing: extractCostSharing(sbc),
    network: extractNetworkInfo(sbc),
    benefits: extractBenefits(sbc)
  }
}
```

### 3. Enhanced Recommendation Engine
```typescript
// /lib/recommendation-engine.ts
export function generatePersonalizedRecommendation(
  analyses: PolicyCostAnalysis[],
  treatmentPlan: EnhancedTreatmentPlan
): PersonalizedRecommendation {
  // Score each policy based on:
  // 1. Total cost for user's specific needs
  // 2. Coverage quality for their conditions
  // 3. Network match for their providers
  // 4. Risk protection level
  // 5. Medication coverage
  
  const scores = analyses.map(analysis => ({
    policyId: analysis.policyId,
    costScore: calculateCostScore(analysis),
    coverageScore: calculateCoverageScore(analysis, treatmentPlan),
    networkScore: calculateNetworkScore(analysis),
    riskScore: calculateRiskScore(analysis),
    medicationScore: calculateMedicationScore(analysis, treatmentPlan),
    totalScore: 0
  }))
  
  // Weight scores based on user's situation
  const weights = determineWeights(treatmentPlan)
  
  // Calculate final scores and rank
  return generateRecommendation(scores, weights)
}
```

## UI/UX Improvements

### 1. Streamlined Navigation
- Remove separate cost analysis page
- Integrate everything into analyze-compare
- Add progress indicator showing journey
- Quick actions for common tasks

### 2. Information Architecture
```
/analyze-compare
  ├── Profile Summary (collapsible)
  ├── Uploaded Policies (with status)
  ├── Recommendation (prominent)
  ├── Detailed Comparison (tabbed)
  └── Action Buttons (clear CTAs)
```

### 3. Visual Design
- Use color coding for recommendations
- Progressive disclosure of complex info
- Interactive tooltips for medical terms
- Accessibility-first approach

### 4. Mobile Optimization
- Responsive comparison tables
- Touch-friendly controls
- Simplified mobile view
- Native app-like interactions

## Success Metrics
- Time to recommendation < 30 seconds
- User confidence in decision > 85%
- Completion rate > 90%
- Support tickets < 5%

## Next Steps
1. Implement Phase 1 unified experience
2. Enhance SBC parsing accuracy
3. Add visual recommendation dashboard
4. Test with real user data
5. Iterate based on feedback