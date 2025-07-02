// Enhanced treatment mapping with detailed procedures and costs
// This provides comprehensive condition-to-treatment mappings for accurate cost estimation

import { TreatmentCategory } from "./treatment-cost-service"

export interface DetailedTreatment {
  id: string
  name: string
  category: TreatmentCategory
  cptCode?: string
  frequency: {
    min: number
    typical: number
    max: number
  }
  timing?: 'quarterly' | 'biannual' | 'annual' | 'monthly' | 'as_needed'
  requiresSpecialist: boolean
  requiresPriorAuth?: boolean
  isPreventive: boolean
  notes?: string
}

export interface MedicationDetail {
  id: string
  name: string
  genericName: string
  brandNames: string[]
  drugClass: string
  dosageRange: {
    min: string
    typical: string
    max: string
  }
  isSpecialty: boolean
  requiresPriorAuth: boolean
  typicalDuration: 'acute' | 'chronic' | 'as_needed'
  administrationRoute: 'oral' | 'injection' | 'inhaler' | 'topical' | 'other'
  monitoring?: DetailedTreatment[]
}

export interface ConditionManagementPlan {
  condition: string
  icdCodes: string[]
  severity: {
    mild: {
      treatments: DetailedTreatment[]
      medications: MedicationDetail[]
      annualCostRange: [number, number]
    }
    moderate: {
      treatments: DetailedTreatment[]
      medications: MedicationDetail[]
      annualCostRange: [number, number]
    }
    severe: {
      treatments: DetailedTreatment[]
      medications: MedicationDetail[]
      annualCostRange: [number, number]
    }
  }
  complications?: {
    name: string
    probability: number
    additionalTreatments: DetailedTreatment[]
  }[]
  relatedConditions: string[]
  specialConsiderations?: string[]
}

// Comprehensive condition management plans
export const conditionManagementPlans: Record<string, ConditionManagementPlan> = {
  'Type 2 Diabetes': {
    condition: 'Type 2 Diabetes',
    icdCodes: ['E11', 'E11.9', 'E11.65'],
    severity: {
      mild: {
        treatments: [
          {
            id: 'diabetes_pcp_visit',
            name: 'Primary Care Diabetes Management',
            category: 'office_visit',
            cptCode: '99213',
            frequency: { min: 2, typical: 3, max: 4 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'diabetes_a1c_test',
            name: 'Hemoglobin A1C Test',
            category: 'diagnostic_lab',
            cptCode: '83036',
            frequency: { min: 2, typical: 3, max: 4 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'diabetes_glucose_monitor',
            name: 'Continuous Glucose Monitoring',
            category: 'diagnostic_lab',
            frequency: { min: 0, typical: 12, max: 12 },
            timing: 'monthly',
            requiresSpecialist: false,
            isPreventive: false,
            notes: 'Test strips and supplies'
          },
        ],
        medications: [
          {
            id: 'metformin',
            name: 'Metformin',
            genericName: 'metformin',
            brandNames: ['Glucophage', 'Fortamet'],
            drugClass: 'Biguanides',
            dosageRange: {
              min: '500mg daily',
              typical: '1000mg twice daily',
              max: '2550mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [2000, 4000]
      },
      moderate: {
        treatments: [
          {
            id: 'diabetes_endo_visit',
            name: 'Endocrinologist Visit',
            category: 'specialist_visit',
            cptCode: '99214',
            frequency: { min: 2, typical: 4, max: 6 },
            timing: 'quarterly',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'diabetes_a1c_test',
            name: 'Hemoglobin A1C Test',
            category: 'diagnostic_lab',
            cptCode: '83036',
            frequency: { min: 3, typical: 4, max: 6 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'diabetes_eye_exam',
            name: 'Diabetic Eye Exam',
            category: 'specialist_visit',
            cptCode: '92014',
            frequency: { min: 1, typical: 1, max: 2 },
            timing: 'annual',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'diabetes_foot_exam',
            name: 'Diabetic Foot Exam',
            category: 'specialist_visit',
            frequency: { min: 1, typical: 2, max: 4 },
            timing: 'biannual',
            requiresSpecialist: true,
            isPreventive: true,
          },
        ],
        medications: [
          {
            id: 'metformin',
            name: 'Metformin',
            genericName: 'metformin',
            brandNames: ['Glucophage', 'Fortamet'],
            drugClass: 'Biguanides',
            dosageRange: {
              min: '1000mg daily',
              typical: '2000mg daily',
              max: '2550mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          },
          {
            id: 'jardiance',
            name: 'Jardiance',
            genericName: 'empagliflozin',
            brandNames: ['Jardiance'],
            drugClass: 'SGLT2 inhibitors',
            dosageRange: {
              min: '10mg daily',
              typical: '10mg daily',
              max: '25mg daily'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [5000, 10000]
      },
      severe: {
        treatments: [
          {
            id: 'diabetes_endo_visit',
            name: 'Endocrinologist Visit',
            category: 'specialist_visit',
            cptCode: '99215',
            frequency: { min: 4, typical: 6, max: 12 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'diabetes_a1c_test',
            name: 'Hemoglobin A1C Test',
            category: 'diagnostic_lab',
            cptCode: '83036',
            frequency: { min: 4, typical: 6, max: 12 },
            timing: 'monthly',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'diabetes_cgm',
            name: 'Continuous Glucose Monitor',
            category: 'diagnostic_lab',
            frequency: { min: 12, typical: 12, max: 12 },
            timing: 'monthly',
            requiresSpecialist: true,
            requiresPriorAuth: true,
            isPreventive: false,
            notes: 'CGM device and sensors'
          },
          {
            id: 'diabetes_kidney_panel',
            name: 'Kidney Function Panel',
            category: 'diagnostic_lab',
            cptCode: '80069',
            frequency: { min: 2, typical: 4, max: 6 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: true,
          },
        ],
        medications: [
          {
            id: 'insulin_basal',
            name: 'Insulin Glargine',
            genericName: 'insulin glargine',
            brandNames: ['Lantus', 'Basaglar', 'Toujeo'],
            drugClass: 'Long-acting insulin',
            dosageRange: {
              min: '10 units daily',
              typical: '20-40 units daily',
              max: '100 units daily'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'injection',
          },
          {
            id: 'insulin_rapid',
            name: 'Insulin Lispro',
            genericName: 'insulin lispro',
            brandNames: ['Humalog', 'Admelog'],
            drugClass: 'Rapid-acting insulin',
            dosageRange: {
              min: '10 units/day',
              typical: '30-50 units/day',
              max: '100 units/day'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'injection',
          },
          {
            id: 'ozempic',
            name: 'Ozempic',
            genericName: 'semaglutide',
            brandNames: ['Ozempic', 'Rybelsus'],
            drugClass: 'GLP-1 agonists',
            dosageRange: {
              min: '0.25mg weekly',
              typical: '1mg weekly',
              max: '2mg weekly'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'injection',
          }
        ],
        annualCostRange: [15000, 30000]
      }
    },
    complications: [
      {
        name: 'Diabetic Ketoacidosis',
        probability: 0.05,
        additionalTreatments: [
          {
            id: 'dka_emergency',
            name: 'Emergency Room Visit for DKA',
            category: 'emergency_room',
            frequency: { min: 0, typical: 1, max: 2 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      },
      {
        name: 'Diabetic Neuropathy',
        probability: 0.3,
        additionalTreatments: [
          {
            id: 'neuropathy_specialist',
            name: 'Neurologist Consultation',
            category: 'specialist_visit',
            frequency: { min: 1, typical: 2, max: 4 },
            timing: 'biannual',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      }
    ],
    relatedConditions: ['Hypertension', 'High Cholesterol', 'Kidney Disease', 'Heart Disease'],
    specialConsiderations: [
      'Requires regular monitoring of blood glucose',
      'Diet and exercise counseling recommended',
      'Annual diabetic eye and foot exams essential',
      'May require insulin pump for severe cases'
    ]
  },
  
  'Hypertension': {
    condition: 'Hypertension',
    icdCodes: ['I10', 'I11', 'I12', 'I13'],
    severity: {
      mild: {
        treatments: [
          {
            id: 'htn_pcp_visit',
            name: 'Primary Care Blood Pressure Management',
            category: 'office_visit',
            cptCode: '99213',
            frequency: { min: 2, typical: 3, max: 4 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'htn_bp_monitoring',
            name: 'Blood Pressure Monitoring',
            category: 'office_visit',
            frequency: { min: 4, typical: 6, max: 12 },
            timing: 'monthly',
            requiresSpecialist: false,
            isPreventive: false,
            notes: 'Home monitoring recommended'
          },
        ],
        medications: [
          {
            id: 'lisinopril',
            name: 'Lisinopril',
            genericName: 'lisinopril',
            brandNames: ['Prinivil', 'Zestril'],
            drugClass: 'ACE inhibitors',
            dosageRange: {
              min: '5mg daily',
              typical: '10-20mg daily',
              max: '40mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [1000, 2500]
      },
      moderate: {
        treatments: [
          {
            id: 'htn_cardio_visit',
            name: 'Cardiologist Visit',
            category: 'specialist_visit',
            cptCode: '99214',
            frequency: { min: 1, typical: 2, max: 4 },
            timing: 'biannual',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'htn_ekg',
            name: 'Electrocardiogram (EKG)',
            category: 'diagnostic_lab',
            cptCode: '93000',
            frequency: { min: 1, typical: 1, max: 2 },
            timing: 'annual',
            requiresSpecialist: false,
            isPreventive: true,
          },
          {
            id: 'htn_echo',
            name: 'Echocardiogram',
            category: 'diagnostic_imaging',
            cptCode: '93306',
            frequency: { min: 0, typical: 1, max: 1 },
            timing: 'annual',
            requiresSpecialist: true,
            isPreventive: true,
          },
        ],
        medications: [
          {
            id: 'lisinopril',
            name: 'Lisinopril',
            genericName: 'lisinopril',
            brandNames: ['Prinivil', 'Zestril'],
            drugClass: 'ACE inhibitors',
            dosageRange: {
              min: '10mg daily',
              typical: '20mg daily',
              max: '40mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          },
          {
            id: 'amlodipine',
            name: 'Amlodipine',
            genericName: 'amlodipine',
            brandNames: ['Norvasc'],
            drugClass: 'Calcium channel blockers',
            dosageRange: {
              min: '2.5mg daily',
              typical: '5mg daily',
              max: '10mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [3000, 6000]
      },
      severe: {
        treatments: [
          {
            id: 'htn_cardio_visit',
            name: 'Cardiologist Visit',
            category: 'specialist_visit',
            cptCode: '99215',
            frequency: { min: 3, typical: 4, max: 6 },
            timing: 'quarterly',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'htn_stress_test',
            name: 'Cardiac Stress Test',
            category: 'diagnostic_imaging',
            cptCode: '93015',
            frequency: { min: 1, typical: 1, max: 2 },
            timing: 'annual',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'htn_24hr_monitor',
            name: '24-Hour Blood Pressure Monitor',
            category: 'diagnostic_lab',
            cptCode: '93784',
            frequency: { min: 1, typical: 2, max: 3 },
            timing: 'biannual',
            requiresSpecialist: true,
            isPreventive: false,
          },
        ],
        medications: [
          {
            id: 'lisinopril',
            name: 'Lisinopril',
            genericName: 'lisinopril',
            brandNames: ['Prinivil', 'Zestril'],
            drugClass: 'ACE inhibitors',
            dosageRange: {
              min: '20mg daily',
              typical: '40mg daily',
              max: '40mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          },
          {
            id: 'amlodipine',
            name: 'Amlodipine',
            genericName: 'amlodipine',
            brandNames: ['Norvasc'],
            drugClass: 'Calcium channel blockers',
            dosageRange: {
              min: '5mg daily',
              typical: '10mg daily',
              max: '10mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          },
          {
            id: 'metoprolol',
            name: 'Metoprolol',
            genericName: 'metoprolol',
            brandNames: ['Lopressor', 'Toprol XL'],
            drugClass: 'Beta blockers',
            dosageRange: {
              min: '25mg twice daily',
              typical: '50mg twice daily',
              max: '200mg twice daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [7000, 15000]
      }
    },
    complications: [
      {
        name: 'Hypertensive Crisis',
        probability: 0.02,
        additionalTreatments: [
          {
            id: 'htn_crisis_er',
            name: 'Emergency Room Visit for Hypertensive Crisis',
            category: 'emergency_room',
            frequency: { min: 0, typical: 1, max: 2 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      },
      {
        name: 'Heart Failure',
        probability: 0.1,
        additionalTreatments: [
          {
            id: 'hf_management',
            name: 'Heart Failure Management',
            category: 'specialist_visit',
            frequency: { min: 4, typical: 6, max: 12 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      }
    ],
    relatedConditions: ['Heart Disease', 'Kidney Disease', 'Stroke', 'Diabetes'],
    specialConsiderations: [
      'Lifestyle modifications crucial (diet, exercise)',
      'Regular blood pressure monitoring essential',
      'May require multiple medications',
      'Risk of organ damage if uncontrolled'
    ]
  },
  
  'Pregnancy': {
    condition: 'Pregnancy',
    icdCodes: ['Z33', 'Z34', 'O09'],
    severity: {
      mild: { // Normal pregnancy
        treatments: [
          {
            id: 'prenatal_visits',
            name: 'Routine Prenatal Visits',
            category: 'maternity_care',
            cptCode: '59400',
            frequency: { min: 10, typical: 14, max: 16 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: true,
            notes: 'Monthly then biweekly then weekly'
          },
          {
            id: 'prenatal_ultrasound',
            name: 'Prenatal Ultrasound',
            category: 'diagnostic_imaging',
            cptCode: '76805',
            frequency: { min: 2, typical: 3, max: 4 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: true,
          },
          {
            id: 'prenatal_labs',
            name: 'Prenatal Laboratory Tests',
            category: 'diagnostic_lab',
            frequency: { min: 4, typical: 6, max: 8 },
            timing: 'quarterly',
            requiresSpecialist: false,
            isPreventive: true,
            notes: 'Blood work, urine tests, glucose screening'
          },
          {
            id: 'delivery_vaginal',
            name: 'Vaginal Delivery',
            category: 'maternity_care',
            cptCode: '59400',
            frequency: { min: 1, typical: 1, max: 1 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
            notes: 'Includes hospital stay'
          },
        ],
        medications: [
          {
            id: 'prenatal_vitamins',
            name: 'Prenatal Vitamins',
            genericName: 'prenatal multivitamin',
            brandNames: ['Various'],
            drugClass: 'Vitamins',
            dosageRange: {
              min: '1 daily',
              typical: '1 daily',
              max: '1 daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'acute',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [10000, 15000]
      },
      moderate: { // High-risk pregnancy
        treatments: [
          {
            id: 'prenatal_visits_hr',
            name: 'High-Risk Prenatal Visits',
            category: 'maternity_care',
            cptCode: '59400',
            frequency: { min: 15, typical: 20, max: 25 },
            timing: 'biweekly',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'maternal_fetal_specialist',
            name: 'Maternal-Fetal Medicine Specialist',
            category: 'specialist_visit',
            cptCode: '99215',
            frequency: { min: 4, typical: 8, max: 12 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'prenatal_ultrasound_hr',
            name: 'High-Risk Ultrasound Monitoring',
            category: 'diagnostic_imaging',
            cptCode: '76816',
            frequency: { min: 6, typical: 10, max: 15 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'fetal_monitoring',
            name: 'Non-Stress Test/Fetal Monitoring',
            category: 'diagnostic_lab',
            cptCode: '59025',
            frequency: { min: 8, typical: 16, max: 30 },
            timing: 'biweekly',
            requiresSpecialist: true,
            isPreventive: true,
          },
        ],
        medications: [
          {
            id: 'prenatal_vitamins',
            name: 'Prenatal Vitamins',
            genericName: 'prenatal multivitamin',
            brandNames: ['Various'],
            drugClass: 'Vitamins',
            dosageRange: {
              min: '1 daily',
              typical: '1 daily',
              max: '1 daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'acute',
            administrationRoute: 'oral',
          },
          {
            id: 'progesterone',
            name: 'Progesterone',
            genericName: 'progesterone',
            brandNames: ['Prometrium', 'Crinone'],
            drugClass: 'Hormones',
            dosageRange: {
              min: '200mg daily',
              typical: '200mg daily',
              max: '400mg daily'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'acute',
            administrationRoute: 'oral',
            notes: 'For preterm labor prevention'
          }
        ],
        annualCostRange: [20000, 35000]
      },
      severe: { // Multiple/Complicated pregnancy
        treatments: [
          {
            id: 'prenatal_visits_multiple',
            name: 'Multiple Pregnancy Visits',
            category: 'maternity_care',
            frequency: { min: 20, typical: 30, max: 40 },
            timing: 'biweekly',
            requiresSpecialist: true,
            isPreventive: true,
          },
          {
            id: 'delivery_cesarean',
            name: 'Cesarean Delivery',
            category: 'maternity_care',
            cptCode: '59510',
            frequency: { min: 1, typical: 1, max: 1 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
            notes: 'Includes extended hospital stay'
          },
          {
            id: 'nicu_care',
            name: 'NICU Care',
            category: 'maternity_care',
            frequency: { min: 7, typical: 14, max: 30 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
            notes: 'For premature or complicated births'
          },
        ],
        medications: [
          {
            id: 'prenatal_vitamins',
            name: 'Prenatal Vitamins',
            genericName: 'prenatal multivitamin',
            brandNames: ['Various'],
            drugClass: 'Vitamins',
            dosageRange: {
              min: '1 daily',
              typical: '1 daily',
              max: '1 daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'acute',
            administrationRoute: 'oral',
          },
          {
            id: 'betamethasone',
            name: 'Betamethasone',
            genericName: 'betamethasone',
            brandNames: ['Celestone'],
            drugClass: 'Corticosteroids',
            dosageRange: {
              min: '12mg x 2 doses',
              typical: '12mg x 2 doses',
              max: '12mg x 2 doses'
            },
            isSpecialty: true,
            requiresPriorAuth: false,
            typicalDuration: 'acute',
            administrationRoute: 'injection',
            notes: 'For fetal lung maturation'
          }
        ],
        annualCostRange: [40000, 100000]
      }
    },
    complications: [
      {
        name: 'Gestational Diabetes',
        probability: 0.1,
        additionalTreatments: [
          {
            id: 'gd_monitoring',
            name: 'Gestational Diabetes Monitoring',
            category: 'diagnostic_lab',
            frequency: { min: 20, typical: 30, max: 50 },
            timing: 'weekly',
            requiresSpecialist: false,
            isPreventive: false,
          }
        ]
      },
      {
        name: 'Preeclampsia',
        probability: 0.05,
        additionalTreatments: [
          {
            id: 'preeclampsia_monitoring',
            name: 'Preeclampsia Monitoring',
            category: 'emergency_room',
            frequency: { min: 1, typical: 2, max: 4 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      }
    ],
    relatedConditions: ['Gestational Diabetes', 'Hypertension', 'Anemia'],
    specialConsiderations: [
      'Costs vary significantly by delivery type',
      'Multiple births increase costs dramatically',
      'NICU care can add $3,000-5,000 per day',
      'Consider maternity coverage waiting periods'
    ]
  },
  
  'Asthma': {
    condition: 'Asthma',
    icdCodes: ['J45', 'J45.909', 'J45.901'],
    severity: {
      mild: {
        treatments: [
          {
            id: 'asthma_pcp_visit',
            name: 'Primary Care Asthma Management',
            category: 'office_visit',
            cptCode: '99213',
            frequency: { min: 1, typical: 2, max: 3 },
            timing: 'biannual',
            requiresSpecialist: false,
            isPreventive: false,
          },
          {
            id: 'spirometry',
            name: 'Spirometry Test',
            category: 'diagnostic_lab',
            cptCode: '94010',
            frequency: { min: 1, typical: 1, max: 2 },
            timing: 'annual',
            requiresSpecialist: false,
            isPreventive: false,
          },
        ],
        medications: [
          {
            id: 'albuterol',
            name: 'Albuterol',
            genericName: 'albuterol',
            brandNames: ['ProAir', 'Ventolin', 'Proventil'],
            drugClass: 'Short-acting beta agonists',
            dosageRange: {
              min: '1-2 puffs as needed',
              typical: '2 puffs 4x daily',
              max: '8 puffs daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'inhaler',
          }
        ],
        annualCostRange: [500, 1500]
      },
      moderate: {
        treatments: [
          {
            id: 'asthma_pulm_visit',
            name: 'Pulmonologist Visit',
            category: 'specialist_visit',
            cptCode: '99214',
            frequency: { min: 2, typical: 3, max: 4 },
            timing: 'quarterly',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'asthma_action_plan',
            name: 'Asthma Action Plan Review',
            category: 'office_visit',
            frequency: { min: 2, typical: 2, max: 4 },
            timing: 'biannual',
            requiresSpecialist: false,
            isPreventive: true,
          },
          {
            id: 'peak_flow_monitoring',
            name: 'Peak Flow Monitoring',
            category: 'diagnostic_lab',
            frequency: { min: 12, typical: 24, max: 52 },
            timing: 'monthly',
            requiresSpecialist: false,
            isPreventive: false,
            notes: 'Home monitoring device'
          },
        ],
        medications: [
          {
            id: 'albuterol',
            name: 'Albuterol',
            genericName: 'albuterol',
            brandNames: ['ProAir', 'Ventolin'],
            drugClass: 'Short-acting beta agonists',
            dosageRange: {
              min: '2 puffs as needed',
              typical: '2 puffs 4x daily',
              max: '8 puffs daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'inhaler',
          },
          {
            id: 'budesonide_formoterol',
            name: 'Symbicort',
            genericName: 'budesonide/formoterol',
            brandNames: ['Symbicort'],
            drugClass: 'Combination inhaler',
            dosageRange: {
              min: '2 puffs daily',
              typical: '2 puffs twice daily',
              max: '4 puffs twice daily'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'inhaler',
          }
        ],
        annualCostRange: [3000, 6000]
      },
      severe: {
        treatments: [
          {
            id: 'asthma_pulm_visit_freq',
            name: 'Pulmonologist Visit',
            category: 'specialist_visit',
            cptCode: '99215',
            frequency: { min: 4, typical: 6, max: 12 },
            timing: 'monthly',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'asthma_er_visits',
            name: 'Emergency/Urgent Care Visits',
            category: 'emergency_room',
            frequency: { min: 1, typical: 3, max: 6 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
          },
          {
            id: 'allergy_testing',
            name: 'Allergy Testing',
            category: 'diagnostic_lab',
            cptCode: '95004',
            frequency: { min: 1, typical: 1, max: 1 },
            timing: 'annual',
            requiresSpecialist: true,
            isPreventive: true,
          },
        ],
        medications: [
          {
            id: 'albuterol',
            name: 'Albuterol',
            genericName: 'albuterol',
            brandNames: ['ProAir', 'Ventolin'],
            drugClass: 'Short-acting beta agonists',
            dosageRange: {
              min: '2 puffs 4x daily',
              typical: '2 puffs 6x daily',
              max: '12 puffs daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'inhaler',
          },
          {
            id: 'advair',
            name: 'Advair Diskus',
            genericName: 'fluticasone/salmeterol',
            brandNames: ['Advair', 'AirDuo'],
            drugClass: 'Combination inhaler',
            dosageRange: {
              min: '1 puff twice daily',
              typical: '1 puff twice daily',
              max: '2 puffs twice daily'
            },
            isSpecialty: true,
            requiresPriorAuth: true,
            typicalDuration: 'chronic',
            administrationRoute: 'inhaler',
          },
          {
            id: 'montelukast',
            name: 'Montelukast',
            genericName: 'montelukast',
            brandNames: ['Singulair'],
            drugClass: 'Leukotriene modifiers',
            dosageRange: {
              min: '10mg daily',
              typical: '10mg daily',
              max: '10mg daily'
            },
            isSpecialty: false,
            requiresPriorAuth: false,
            typicalDuration: 'chronic',
            administrationRoute: 'oral',
          }
        ],
        annualCostRange: [8000, 20000]
      }
    },
    complications: [
      {
        name: 'Status Asthmaticus',
        probability: 0.02,
        additionalTreatments: [
          {
            id: 'status_asthmaticus_er',
            name: 'Emergency Hospitalization',
            category: 'emergency_room',
            frequency: { min: 1, typical: 1, max: 2 },
            timing: 'as_needed',
            requiresSpecialist: true,
            isPreventive: false,
          }
        ]
      }
    ],
    relatedConditions: ['Allergies', 'GERD', 'Sleep Apnea', 'Anxiety'],
    specialConsiderations: [
      'Seasonal variations affect severity',
      'Environmental triggers important',
      'Inhaler technique education crucial',
      'May require nebulizer for severe cases'
    ]
  }
}

// Preventive care schedules by age and gender
export const preventiveCareSchedules: Record<string, DetailedTreatment[]> = {
  'adult_male': [
    {
      id: 'annual_physical',
      name: 'Annual Physical Exam',
      category: 'preventive_care',
      cptCode: '99395',
      frequency: { min: 1, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
    },
    {
      id: 'cholesterol_screening',
      name: 'Cholesterol Screening',
      category: 'diagnostic_lab',
      cptCode: '80061',
      frequency: { min: 0.2, typical: 0.33, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
      notes: 'Every 3-5 years if normal'
    },
    {
      id: 'colonoscopy',
      name: 'Colonoscopy Screening',
      category: 'procedure_minor',
      cptCode: '45378',
      frequency: { min: 0, typical: 0.1, max: 0.1 },
      timing: 'annual',
      requiresSpecialist: true,
      isPreventive: true,
      notes: 'Starting at age 45, every 10 years'
    },
  ],
  'adult_female': [
    {
      id: 'annual_physical',
      name: 'Annual Physical Exam',
      category: 'preventive_care',
      cptCode: '99395',
      frequency: { min: 1, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
    },
    {
      id: 'well_woman_exam',
      name: 'Well Woman Exam',
      category: 'preventive_care',
      cptCode: '99385',
      frequency: { min: 1, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: true,
      isPreventive: true,
    },
    {
      id: 'mammogram',
      name: 'Mammogram',
      category: 'diagnostic_imaging',
      cptCode: '77067',
      frequency: { min: 0, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
      notes: 'Starting at age 40'
    },
    {
      id: 'pap_smear',
      name: 'Pap Smear',
      category: 'diagnostic_lab',
      cptCode: '88142',
      frequency: { min: 0.33, typical: 0.33, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
      notes: 'Every 3 years age 21-65'
    },
  ],
  'senior': [
    {
      id: 'medicare_wellness',
      name: 'Medicare Annual Wellness Visit',
      category: 'preventive_care',
      cptCode: 'G0438',
      frequency: { min: 1, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
    },
    {
      id: 'flu_vaccine',
      name: 'Flu Vaccine',
      category: 'preventive_care',
      cptCode: '90658',
      frequency: { min: 1, typical: 1, max: 1 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
    },
    {
      id: 'pneumonia_vaccine',
      name: 'Pneumonia Vaccine',
      category: 'preventive_care',
      cptCode: '90732',
      frequency: { min: 0, typical: 0.2, max: 0.2 },
      timing: 'annual',
      requiresSpecialist: false,
      isPreventive: true,
      notes: 'Once at 65, booster after 5 years'
    },
    {
      id: 'bone_density',
      name: 'Bone Density Test',
      category: 'diagnostic_imaging',
      cptCode: '77080',
      frequency: { min: 0, typical: 0.5, max: 0.5 },
      timing: 'biannual',
      requiresSpecialist: false,
      isPreventive: true,
      notes: 'Every 2 years for women 65+'
    },
  ]
}