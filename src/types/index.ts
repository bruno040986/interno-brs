export type UserRole = 'admin' | 'rh' | 'gestor' | 'consulta'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  name: string
  registration_name?: string
  cpf: string
  rg?: string
  rg_issuer?: string
  rg_issue_date?: string
  birth_date?: string
  gender?: string
  pis?: string
  holerite_code?: string
  civil_status?: string
  ctps_number?: string
  ctps_series?: string
  ctps_uf?: string
  education?: string
  race_color?: string
  nationality?: string
  naturalness?: string
  cnh?: string
  cnh_category?: string
  pcd?: boolean
  disability_type?: string
  mother_name?: string
  father_name?: string
  spouse_cpf?: string
  spouse_name?: string
  blood_type?: string
  voter_registration?: string
  voter_zone?: string
  voter_section?: string
  reservist_number?: string
  email?: string
  phone?: string
  emergency_contact?: string
  zip_code?: string
  address?: string
  address_number?: string
  neighborhood?: string
  complement?: string
  city?: string
  state?: string
  admission_date?: string
  termination_date?: string
  termination_reason?: string
  employment_type?: string
  esocial_registration?: string
  job_title?: string
  job_level?: string
  job_sublevel?: string
  gross_salary?: number
  department?: string
  team?: string
  manager_name?: string
  work_schedule?: string
  login_email?: string
  work_city_state?: string
  observations?: string
  additional?: string
  pix?: string
  bank?: string
  agency?: string
  account_number?: string
  account_type?: string
  functional_registration?: string
  shirt_size?: string
  status: 'active' | 'inactive' | 'terminated'
  vt_status: 'sem_informacao' | 'optante' | 'recusou' | 'em_analise' | 'vale_combustivel' | 'cancelado' | 'historico_antigo'
  created_at: string
  updated_at: string
}

export interface CompanyUnit {
  id: string
  name: string
  cnpj?: string
  zip_code?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface VtRecord {
  id: string
  employee_id: string
  type: 'option' | 'refusal'
  status: string
  reason_refusal?: string
  unit_id?: string
  daily_total?: number
  working_days_estimate?: number
  monthly_estimated_total?: number
  max_employee_discount?: number
  company_estimated_cost?: number
  document_pdf_url?: string
  generated_by?: string
  generated_at?: string
  option_date?: string
  effective_date?: string
  end_date?: string
  revoked_record_id?: string
  active: boolean
  created_at: string
  updated_at: string
  employee?: Employee
  unit?: CompanyUnit
  routes?: VtRoute[]
  generated_by_user?: UserProfile
}

export interface VtRoute {
  id: string
  vt_record_id: string
  route_type: 'ida' | 'volta'
  line_operator: string
  unit_value: number
  notes?: string
  created_at: string
}

export interface DisciplinaryReason {
  id: string
  name: string
  category?: string
  description?: string
  default_gravity: 'leve' | 'medio' | 'grave' | 'gravissimo'
  template_history?: string
  template_impact?: string
  template_recommendation?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface DisciplinaryRecord {
  id: string
  employee_id: string
  type: 'verbal_warning' | 'written_warning' | 'suspension'
  reason_id: string
  occurrence_date: string
  application_date: string
  witness_name?: string
  supervisor_name?: string
  suspension_days?: number
  recurrence_number_by_reason: number
  total_warnings_at_date: number
  total_suspensions_at_date: number
  history_text?: string
  impact_text?: string
  recommendation_text?: string
  document_pdf_url?: string
  generated_by?: string
  generated_at?: string
  status: string
  created_at: string
  updated_at: string
  employee?: Employee
  reason?: DisciplinaryReason
  generated_by_user?: UserProfile
}

export interface ImportLog {
  id: string
  file_name: string
  imported_by?: string
  total_rows: number
  created_count: number
  updated_count: number
  error_count: number
  errors_json?: Record<string, unknown>[]
  created_at: string
  imported_by_user?: UserProfile
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  description?: string
  ip_address?: string
  created_at: string
  user?: UserProfile
}
