/**
 * Mapeamento das colunas do QuarkRH para os campos internos do sistema.
 * Baseado na análise real do arquivo "Relatório Completo de Colaboradores.xls"
 * Estrutura: linha 0 = título mesclado, linha 1 = cabeçalhos reais
 */
export const QUARKRH_COLUMN_MAP: Record<string, string> = {
  'Colaborador': 'name',
  'Nome de Registro': 'registration_name',
  'RG': 'rg',
  'Orgão Emissor do RG': 'rg_issuer',
  'Data Emissão do RG': 'rg_issue_date',
  'CPF': 'cpf',
  'Data de Nascimento': 'birth_date',
  'Gênero': 'gender',
  'PIS': 'pis',
  'Código do Holerite': 'holerite_code',
  'Estado Civil': 'civil_status',
  'Carteira de Trabalho - Número': 'ctps_number',
  'CTPS - Série': 'ctps_series',
  'CTPS - UF': 'ctps_uf',
  'Escolaridade': 'education',
  'Raça/Cor': 'race_color',
  'Nacionalidade': 'nationality',
  'Naturalidade': 'naturalness',
  'CNH': 'cnh',
  'Categoria CNH': 'cnh_category',
  'PCD': 'pcd',
  'Tipo de Deficiência': 'disability_type',
  'Nome da Mãe': 'mother_name',
  'Nome da Pai': 'father_name',
  'CPF do Cônjugue': 'spouse_cpf',
  'Nome do Cônjugue': 'spouse_name',
  'Tipo Sanguineo': 'blood_type',
  'Título de Eleitor': 'voter_registration',
  'Zona': 'voter_zone',
  'Seção': 'voter_section',
  'Número da Reservista': 'reservist_number',
  'CEP': 'zip_code',
  'Endereço': 'address',
  'Bairro': 'neighborhood',
  'Complemento': 'complement',
  'Cidade': 'city',
  'E-mail para Contato': 'email',
  'Telefone Celular': 'phone',
  'Contato de Emergência': 'emergency_contact',
  'Data de Admissão': 'admission_date',
  'Data de Desligamento': 'termination_date',
  'Motivo de Desligamento': 'termination_reason',
  'Vínculo': 'employment_type',
  'Matrícula eSocial': 'esocial_registration',
  'Cargo - Nível - Subnível': 'job_title',
  'Salário Bruto (R$)': 'gross_salary',
  'Setor': 'department',
  'Time(s)': 'team',
  'Gestor': 'manager_name',
  'Carga Horária': 'work_schedule',
  'Email de login': 'login_email',
  'Cidade/Estado de Trabalho': 'work_city_state',
  'Observações': 'observations',
  'Adicional': 'additional',
  'Pix': 'pix',
  'Banco': 'bank',
  'Agência': 'agency',
  'Número da Conta': 'account_number',
  'Tipo da Conta': 'account_type',
  'N° Matrícula Funcional': 'functional_registration',
  'Tamanho da Camisa (P/M/G/GG/XG/XGG)': 'shirt_size',
}

/** Campos que contêm datas — convertidos para ISO */
export const DATE_FIELDS = ['birth_date', 'rg_issue_date', 'admission_date', 'termination_date']

/** Campos monetários — convertidos para número */
export const MONEY_FIELDS = ['gross_salary']

/** Campos booleanos — convertidos para true/false (Sim/Não) */
export const BOOLEAN_FIELDS = ['pcd']

/** Normaliza CPF removendo máscara e espaços */
export function normalizeCpf(value: string): string {
  return String(value ?? '').replace(/\D/g, '').padStart(11, '0')
}

/** Valida CPF brasileiro */
export function validateCpf(cpf: string): boolean {
  const c = normalizeCpf(cpf)
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(c[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(c[10])
}

/** Converte data do QuarkRH (DD/MM/YYYY ou serial Excel) para YYYY-MM-DD */
export function parseDate(value: unknown): string | null {
  if (!value) return null
  
  if (typeof value === 'number') {
    // Excel serial date: compensar o fuso horário local para garantir que a data seja interpretada como UTC 00:00
    const date = new Date(Math.round((value - 25569) * 86400 * 1000))
    // Adicionamos as horas de diferença do fuso para não "voltar" um dia
    const offset = date.getTimezoneOffset()
    const adjustedDate = new Date(date.getTime() + (offset * 60 * 1000))
    return adjustedDate.toISOString().split('T')[0]
  }
  const str = String(value).trim()
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/')
    return `${y}-${m}-${d}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return null
}

/** Normaliza valor monetário */
export function parseMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const str = String(value).replace(/[R$\s]/g, '').replace('.', '').replace(',', '.')
  const n = parseFloat(str)
  return isNaN(n) ? null : n
}

/** Converte Sim/Não ou True/False para booleano */
export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const str = String(value ?? '').trim().toLowerCase()
  return str === 'sim' || str === 's' || str === 'yes' || str === 'true' || str === '1'
}

/** Similiaridade básica entre strings para sugestão de mapeamento */
export function columnSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  const na = normalize(a), nb = normalize(b)
  if (na === nb) return 1
  if (na.includes(nb) || nb.includes(na)) return 0.8
  return 0
}
