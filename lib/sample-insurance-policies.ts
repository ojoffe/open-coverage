// Sample Insurance Policies for Testing and Demo
import { InsurancePolicy } from "./insurance-calculator"

export const samplePolicies: InsurancePolicy[] = [
  {
    id: "bronze-hmo-basic",
    name: "Bronze HMO Basic",
    carrier: "HealthFirst Insurance",
    type: "HMO",
    premium: {
      individual: 3600, // $300/month
      family: 10800, // $900/month
      employer_contribution: 0
    },
    deductible: {
      individual: 7000,
      family: 14000,
      embedded: true
    },
    outOfPocketMax: {
      individual: 8700,
      family: 17400
    },
    coinsurance: 0.4, // 40% after deductible
    costSharing: {
      primaryCare: { copay: 45 },
      specialist: { copay: 75 },
      urgentCare: { copay: 90 },
      emergencyRoom: { coinsurance: 0.4, waived_if_admitted: true },
      labWork: { coinsurance: 0.4 },
      imaging: { coinsurance: 0.4 },
      genericDrugs: { copay: 15, tier: 1 },
      preferredBrandDrugs: { copay: 55, tier: 2 },
      nonPreferredBrandDrugs: { coinsurance: 0.5, tier: 3 },
      specialtyDrugs: { coinsurance: 0.5, tier: 4 },
      preventiveCare: { copay: 0, coinsurance: 0 }
    },
    network: {
      size: "standard",
      outOfNetworkCoverage: false
    },
    benefits: {
      hsaEligible: false,
      fsaEligible: true
    }
  },
  
  {
    id: "silver-ppo-standard",
    name: "Silver PPO Standard",
    carrier: "BlueCross BlueShield",
    type: "PPO",
    premium: {
      individual: 5400, // $450/month
      family: 16200, // $1350/month
      employer_contribution: 2400 // $200/month
    },
    deductible: {
      individual: 3000,
      family: 6000,
      embedded: true
    },
    outOfPocketMax: {
      individual: 8000,
      family: 16000
    },
    coinsurance: 0.2, // 20% after deductible
    costSharing: {
      primaryCare: { copay: 30 },
      specialist: { copay: 50 },
      urgentCare: { copay: 60 },
      emergencyRoom: { copay: 400, coinsurance: 0.2, waived_if_admitted: true },
      labWork: { coinsurance: 0.2 },
      imaging: { coinsurance: 0.2 },
      genericDrugs: { copay: 10, tier: 1 },
      preferredBrandDrugs: { copay: 40, tier: 2 },
      nonPreferredBrandDrugs: { copay: 80, tier: 3 },
      specialtyDrugs: { coinsurance: 0.3, tier: 4 },
      preventiveCare: { copay: 0, coinsurance: 0 }
    },
    network: {
      size: "broad",
      outOfNetworkCoverage: true,
      outOfNetworkDeductible: 6000,
      outOfNetworkCoinsurance: 0.4,
      outOfNetworkOopMax: 12000
    },
    benefits: {
      hsaEligible: false,
      fsaEligible: true,
      wellnessRewards: 500
    }
  },
  
  {
    id: "gold-hmo-premium",
    name: "Gold HMO Premium",
    carrier: "Kaiser Permanente",
    type: "HMO",
    premium: {
      individual: 7200, // $600/month
      family: 21600, // $1800/month
      employer_contribution: 3600 // $300/month
    },
    deductible: {
      individual: 1000,
      family: 2000,
      embedded: true
    },
    outOfPocketMax: {
      individual: 4000,
      family: 8000
    },
    coinsurance: 0.1, // 10% after deductible
    costSharing: {
      primaryCare: { copay: 20 },
      specialist: { copay: 35 },
      urgentCare: { copay: 40 },
      emergencyRoom: { copay: 250, waived_if_admitted: true },
      labWork: { copay: 20 },
      imaging: { copay: 75 },
      genericDrugs: { copay: 5, tier: 1 },
      preferredBrandDrugs: { copay: 25, tier: 2 },
      nonPreferredBrandDrugs: { copay: 50, tier: 3 },
      specialtyDrugs: { coinsurance: 0.2, tier: 4 },
      preventiveCare: { copay: 0, coinsurance: 0 }
    },
    network: {
      size: "narrow",
      outOfNetworkCoverage: false
    },
    benefits: {
      hsaEligible: false,
      fsaEligible: true,
      wellnessRewards: 300,
      telehealth: { copay: 0 }
    }
  },
  
  {
    id: "hdhp-hsa-saver",
    name: "HDHP with HSA",
    carrier: "United Healthcare",
    type: "HDHP",
    premium: {
      individual: 2400, // $200/month
      family: 7200, // $600/month
      employer_contribution: 1200 // $100/month
    },
    deductible: {
      individual: 2800, // 2024 IRS minimum
      family: 5600,
      embedded: false // Family deductible must be met
    },
    outOfPocketMax: {
      individual: 7050,
      family: 14100
    },
    coinsurance: 0, // 0% after deductible
    costSharing: {
      primaryCare: { coinsurance: 0 }, // After deductible
      specialist: { coinsurance: 0 },
      urgentCare: { coinsurance: 0 },
      emergencyRoom: { coinsurance: 0 },
      labWork: { coinsurance: 0 },
      imaging: { coinsurance: 0 },
      genericDrugs: { coinsurance: 0, tier: 1 },
      preferredBrandDrugs: { coinsurance: 0, tier: 2 },
      nonPreferredBrandDrugs: { coinsurance: 0, tier: 3 },
      specialtyDrugs: { coinsurance: 0, tier: 4 },
      preventiveCare: { copay: 0, coinsurance: 0 }
    },
    network: {
      size: "standard",
      outOfNetworkCoverage: true,
      outOfNetworkDeductible: 5600,
      outOfNetworkCoinsurance: 0.3,
      outOfNetworkOopMax: 14100
    },
    benefits: {
      hsaEligible: true,
      hsaContribution: 1000, // Employer HSA contribution
      fsaEligible: false // Can't have both HSA and general FSA
    }
  },
  
  {
    id: "platinum-ppo-exec",
    name: "Platinum PPO Executive",
    carrier: "Aetna",
    type: "PPO",
    premium: {
      individual: 9600, // $800/month
      family: 28800, // $2400/month
      employer_contribution: 6000 // $500/month
    },
    deductible: {
      individual: 250,
      family: 500,
      embedded: true
    },
    outOfPocketMax: {
      individual: 2000,
      family: 4000
    },
    coinsurance: 0, // 0% after deductible
    costSharing: {
      primaryCare: { copay: 10 },
      specialist: { copay: 20 },
      urgentCare: { copay: 25 },
      emergencyRoom: { copay: 150, waived_if_admitted: true },
      labWork: { copay: 0 },
      imaging: { copay: 50 },
      genericDrugs: { copay: 5, tier: 1 },
      preferredBrandDrugs: { copay: 15, tier: 2 },
      nonPreferredBrandDrugs: { copay: 35, tier: 3 },
      specialtyDrugs: { coinsurance: 0.1, tier: 4 },
      preventiveCare: { copay: 0, coinsurance: 0 }
    },
    network: {
      size: "broad",
      outOfNetworkCoverage: true,
      outOfNetworkDeductible: 1000,
      outOfNetworkCoinsurance: 0.2,
      outOfNetworkOopMax: 4000
    },
    benefits: {
      hsaEligible: false,
      fsaEligible: true,
      wellnessRewards: 1000,
      telehealth: { copay: 0 }
    }
  }
]

// Helper function to get policy by ID
export function getPolicyById(id: string): InsurancePolicy | undefined {
  return samplePolicies.find(policy => policy.id === id)
}

// Helper function to filter policies by type
export function getPoliciesByType(type: InsurancePolicy['type']): InsurancePolicy[] {
  return samplePolicies.filter(policy => policy.type === type)
}

// Helper function to get HSA-eligible policies
export function getHSAEligiblePolicies(): InsurancePolicy[] {
  return samplePolicies.filter(policy => policy.benefits?.hsaEligible)
}

// Calculate effective monthly premium after employer contribution
export function getEffectiveMonthlyPremium(policy: InsurancePolicy, familySize: number = 1): number {
  const annualPremium = familySize > 1 ? policy.premium.family : policy.premium.individual
  const employerContribution = policy.premium.employer_contribution || 0
  return (annualPremium - employerContribution) / 12
}