import { z } from "zod"

// Define common medical event service types
export const CommonMedicalEventServiceTypes = {
  PRIMARY_CARE_VISIT: "Primary care visit to treat an injury or illness",
  SPECIALIST_VISIT: "Specialist visit",
  PREVENTIVE_CARE: "Preventive care/screening/immunization",
  DIAGNOSTIC_TEST: "Diagnostic test (x-ray, blood work)",
  IMAGING: "Imaging (CT/PET scans, MRIs)",
  GENERIC_DRUGS: "Generic drugs",
  PREFERRED_BRAND_DRUGS: "Preferred brand drugs",
  NON_PREFERRED_BRAND_DRUGS: "Non-preferred brand drugs",
  SPECIALTY_DRUGS: "Specialty drugs",
  OUTPATIENT_SURGERY: "Outpatient surgery",
  EMERGENCY_ROOM_CARE: "Emergency room care",
  EMERGENCY_MEDICAL_TRANSPORTATION: "Emergency medical transportation",
  URGENT_CARE: "Urgent care",
  FACILITY_FEE: "Facility fee (e.g., ambulatory surgery center)",
  PHYSICIAN_SURGEON_FEES: "Physician/surgeon fees",
  OUTPATIENT_MENTAL_HEALTH: "Outpatient mental health/behavioral health/substance abuse services",
  INPATIENT_MENTAL_HEALTH: "Inpatient mental health/behavioral health/substance abuse services",
  DELIVERY_PROFESSIONAL_SERVICES: "Delivery and all inpatient services for maternity care",
  HOME_HEALTH_CARE: "Home health care",
  REHABILITATION_SERVICES: "Rehabilitation services",
  HABILITATION_SERVICES: "Habilitation services",
  SKILLED_NURSING_CARE: "Skilled nursing care",
  DURABLE_MEDICAL_EQUIPMENT: "Durable medical equipment",
  HOSPICE_SERVICES: "Hospice services",
  CHILDREN_EYE_EXAM: "Children's eye exam",
  CHILDREN_GLASSES: "Children's glasses",
  CHILDREN_DENTAL_CHECK_UP: "Children's dental check-up",
} as const

export const sbcSchema = z.object({
  plan_summary: z.object({
    plan_name: z.string(),
    coverage_period: z.object({
      start_date: z.string(),
      end_date: z.string(),
    }),
    coverage_for: z.union([z.enum(["individual", "family", "individual_and_family"]), z.string()]),
    plan_type: z.union([z.enum(["HMO", "PPO", "EPO", "POS", "HMO-POS", "HMO-EPO", "PPO-EPO", "PPO-POS"]), z.string()]),
    issuer_name: z.string(),
    issuer_contact_info: z.object({
      phone: z.string(),
      website: z.string(),
    }),
  }),
  important_questions: z.object({
    overall_deductible: z.object({
      individual: z.number(),
      family: z.number(),
      details: z.string().optional(),
    }),
    services_covered_before_deductible: z.object({
      covered: z.boolean(),
      services: z.array(z.string()),
      details: z.string().optional(),
    }),
    deductibles_for_specific_services: z.object({
      exists: z.boolean(),
      details: z.string().optional(),
    }),
    out_of_pocket_limit_for_plan: z.object({
      individual: z.number(),
      family: z.number(),
      details: z.string().optional(),
    }),
    not_included_in_out_of_pocket_limit: z.object({
      services: z.array(z.string()),
      details: z.string().optional(),
    }),
    network_provider_savings: z.object({
      lower_costs: z.boolean(),
      website: z.string(),
      phone: z.string(),
      details: z.string().optional(),
    }),
    need_referral_for_specialist_care: z.object({
      required: z.boolean(),
      details: z.string().optional(),
    }),
  }),
  services_you_may_need: z.array(
    z.object({
      name: z.union([z.enum(Object.values(CommonMedicalEventServiceTypes) as [string, ...string[]]), z.string()]),
      what_you_will_pay: z.object({
        network_provider: z.string(),
        out_of_network_provider: z.string(),
        limitations_exceptions_and_other_important_information: z
          .string()
          .describe(
            "This is on the right most column of the table. Duplicate this for each row it applies to in the table.",
          ),
      }),
    }),
  ),
})

export type SBCData = z.infer<typeof sbcSchema>

export interface ProcessingResult {
  success: boolean
  fileName: string
  data?: SBCData
  error?: string
  pdfUrl?: string
}

export interface ProcessSBCResponse {
  results: ProcessingResult[]
  successCount: number
  errorCount: number
  analysisId?: string
}
