import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// --- GERADOR VALE-TRANSPORTE ---
export async function generateVTPdf(data: any) {
  const doc = new jsPDF()
  const { employee, type, unit, option_date, effective_date, daily_total, monthly_estimated_total, max_employee_discount, generatedBy, reason_refusal } = data

  const routes = data.routes || data.vt_routes || []

  const formatCpf = (cpf: string) => {
    const clean = cpf?.replace(/\D/g, '') || ''
    if (clean.length !== 11) return cpf
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
  }

  const formatDatePT = (dateStr: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return format(date, "dd/MM/yyyy")
  }

  const formatDateExtenso = (dateStr: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const addFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages()
    const now = new Date()
    const footerDate = format(now, "dd/MM/yyyy 'às' HH:mm:ss")
    const disclaimer = "Este termo contém informações confidenciais e de uso exclusivo das partes envolvidas. É vedada sua reprodução, divulgação total ou parcial, sob qualquer forma ou meio, sem autorização expressa da BRS 2 PROMOTORA LTDA – CNPJ 59.841.366/0001-36. O descumprimento desta obrigação poderá ensejar responsabilização civil, trabalhista e/ou penal, conforme legislação vigente."

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.setFont('helvetica', 'normal')
      doc.text(`Data de Emissão: ${footerDate} - Usuário: ${generatedBy || 'Sistema'}`, 20, 282)
      doc.text(`Página ${i} de ${pageCount}`, 190, 282, { align: 'right' })
      doc.setFontSize(6.5)
      const splitDisclaimer = doc.splitTextToSize(disclaimer, 170)
      doc.text(splitDisclaimer, 105, 286, { align: 'center' })
    }
  }

  try {
    doc.addImage('/logotipos/BRS-GESTAO-FUNDO-CLARO.png', 'PNG', 150, 8, 40, 20, undefined, 'FAST')
  } catch (e) {
    doc.setFontSize(10)
    doc.setTextColor(27, 58, 107)
    doc.text('BRS GESTÃO', 190, 20, { align: 'right' })
  }

  if (type === 'refusal') {
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(0)
    doc.text('TERMO DE RECUSA DO VALE-TRANSPORTE', 20, 20)
    doc.setDrawColor(0).setLineWidth(0.5).line(20, 25, 190, 25)
    doc.setFont('helvetica', 'normal').setFontSize(10)

    let currentY = 40
    const p1 = `Eu, ${employee.name.toUpperCase()}, CPF n° ${formatCpf(employee.cpf)}, colaborador contratado pelo regime CLT da BRS 2 Promotora Ltda – CNPJ 59.841.366/0001-36, declaro, de forma livre e espontânea, que não desejo receber o benefício do Vale-Transporte, devido a:`
    const splitP1 = doc.splitTextToSize(p1, 170)
    doc.text(splitP1, 20, currentY, { align: 'justify', maxWidth: 170 })
    currentY += (splitP1.length * 5) + 3

    doc.setDrawColor(200).setFillColor(250, 250, 250)
    const reasonLines = doc.splitTextToSize(reason_refusal || '', 160)
    const boxHeight = (reasonLines.length * 5) + 8
    doc.rect(20, currentY, 170, boxHeight, 'FD')
    doc.setFont('helvetica', 'bolditalic').text(reasonLines, 25, currentY + 6)
    currentY += boxHeight + 8

    doc.setFont('helvetica', 'normal')
    const paragraphs = [
      `Declaro estar ciente de que o Vale-Transporte é um direito previsto na CLT, e que esta decisão foi tomada por minha vontade, não cabendo à empresa qualquer responsabilidade por minha escolha.`,
      `A assinatura deste termo implica a revogação imediata de qualquer Termo de Opção pelo Vale-Transporte anteriormente firmado, sendo este documento condição obrigatória para análise e eventual concessão do Cartão Vale-Combustível pela empresa.`,
      `Por ser expressão da verdade, firmo a presente declaração, ciente de que as informações aqui prestadas são de minha responsabilidade.`,
      `Este documento será assinado eletronicamente por meio da plataforma interna da empresa, que utiliza autenticação via e-mail pessoal, token, validação por foto e dados cadastrais. Nos termos do Art. 10, §2º, da Medida Provisória nº 2.200-2/2001, a assinatura eletrônica possui plena validade jurídica e eficácia probatória.`
    ]
    paragraphs.forEach(text => {
      const split = doc.splitTextToSize(text, 170)
      doc.text(split, 20, currentY, { align: 'justify', maxWidth: 170 })
      currentY += (split.length * 5) + 2
    })

    currentY += 4
    doc.setFont('helvetica', 'bold')
    const admissionDate = employee?.admission_date || '1900-01-01'
    const finalEffectiveDate = effective_date < admissionDate ? admissionDate : effective_date
    const cidadeUF = unit?.city ? `${unit.city}/${unit.state || 'GO'}` : 'Valparaíso de Goiás/GO'
    doc.text(`Vigência: ${formatDatePT(finalEffectiveDate)}  -  ${cidadeUF}, ${formatDateExtenso(option_date)}.`, 20, currentY)

  } else {
    doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(0)
    doc.text('TERMO DE OPÇÃO PELO VALE-TRANSPORTE', 20, 20)
    doc.setDrawColor(0).setLineWidth(0.5).line(20, 25, 190, 25)
    doc.setFontSize(10)
    doc.text('Eu,', 20, 33)
    doc.rect(27, 28, 110, 7)
    doc.text(employee.name.toUpperCase(), 30, 33)
    doc.text('CPF n°', 142, 33)
    doc.rect(155, 28, 35, 7)
    doc.text(formatCpf(employee.cpf), 157, 33)

    doc.setFont('helvetica', 'normal')
    const intro = `colaborador contratado pelo regime CLT da BRS 2 Promotora Ltda – CNPJ 59.841.366/0001-36, declaro que faço a opção por receber o Vale-Transporte e que resido no seguinte endereço:`
    const splitIntro = doc.splitTextToSize(intro, 170)
    doc.text(splitIntro, 20, 42, { align: 'justify', maxWidth: 170 })

    autoTable(doc, {
      startY: 48,
      head: [['ENDEREÇO', 'Nº', 'COMPLEMENTO']],
      body: [[employee.address || '-', employee.address_number || 's/nº', employee.complement || '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 1.5 }
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      head: [['BAIRRO', 'CIDADE', 'ESTADO', 'CEP']],
      body: [[employee.neighborhood || '-', employee.city || '-', employee.state || '-', employee.zip_code || '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 1.5 }
    })

    let currentY = (doc as any).lastAutoTable.finalY + 4
    doc.text('Realizarei o deslocamento de minha residência até o meu local de trabalho, identificado na tabela abaixo:', 20, currentY)
    
    autoTable(doc, {
      startY: currentY + 1.5,
      head: [['ENDEREÇO', 'Nº', 'COMPLEMENTO']],
      body: [[unit?.address || '-', unit?.number || 's/nº', unit?.complement || '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 1.5 }
    })

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY,
      head: [['BAIRRO', 'CIDADE', 'ESTADO', 'CEP']],
      body: [[unit?.neighborhood || '-', unit?.city || '-', unit?.state || 'GO', unit?.zip_code || '-']],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 1.5 }
    })

    currentY = (doc as any).lastAutoTable.finalY + 4
    doc.text('Para isso, utilizarei os meios de transporte com os valores abaixo apresentados:', 20, currentY)

    const trechosList = routes || []
    const tableData = trechosList.map((r: any) => [
      (r.route_type || r.type || 'ida') === 'ida' ? 'Ida' : 'Volta',
      r.line_operator || r.line || r.operator || '-',
      `R$ ${Number(r.unit_value || r.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ])
    tableData.push([{ content: 'TOTAL AO DIA', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [0, 0, 0], textColor: [255, 255, 255] } }, { content: `R$ ${Number(daily_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [0, 0, 0], textColor: [255, 255, 255] } }])

    autoTable(doc, {
      startY: currentY + 1.5,
      head: [['TRECHO (Ida ou volta)', 'LINHA / OPERADORA', 'VALOR UNITÁRIO']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      styles: { fontSize: 8.5, cellPadding: 1.5 }
    })

    currentY = (doc as any).lastAutoTable.finalY + 6
    doc.setFontSize(8.5)
    const declarations = [
      `Declaro estar ciente de que o valor referente ao Vale-Transporte será pago no último dia útil do mês anterior ao de sua utilização, por meio de transferência bancária para a conta salário cadastrada junto à empresa, conforme previsto no Regimento Interno da Empresa. Reconheço que tal valor não possui natureza salarial e que sua finalidade é exclusivamente custear os deslocamentos diários residência-trabalho e vice-versa. Estou ciente de que, caso haja faltas ou folgas, os valores proporcionais aos dias não utilizados serão descontados no mês subsequente. Estou igualmente ciente de que, conforme o Artigo 7º, parágrafo 3º do Decreto nº 95.247/87, o uso indevido ou declaração falsa constitui falta grave.`,
      `Comprometo-me a manter atualizadas estas informações, comunicando à empresa qualquer alteração de endereço ou mudança nas linhas de transporte utilizadas.`,
      `Autorizo a empresa a descontar mensalmente até 6% (seis por cento) do meu salário base para custear o Vale-Transporte, limitado ao valor mensal efetivamente entregue.`,
      `A assinatura deste termo implica a revogação imediata de qualquer outro documento vigente que trate de deslocamento residência-trabalho-residência, incluindo o Termo de Recusa do Vale-Transporte e o Termo de Solicitação de Vale-Combustível eventualmente firmados anteriormente.`,
      `Por ser expressão da verdade, firmo a presente declaração e termo de compromisso, ciente de que as informações aqui prestadas são de minha responsabilidade e passíveis de verificação.`,
      `Este documento será assinado eletronicamente por meio da plataforma interna da empresa, que utiliza autenticação via e-mail pessoal, token, validação por foto e dados cadastrais. Nos termos do Art. 10, §2º, da Medida Provisória nº 2.200-2/2001, a assinatura eletrônica possui plena validade jurídica e eficácia probatória.`
    ]
    declarations.forEach(text => {
      const split = doc.splitTextToSize(text, 170)
      doc.text(split, 20, currentY, { align: 'justify', maxWidth: 170 })
      currentY += (split.length * 4.5) + 1.5
    })

    currentY += 2
    doc.setFont('helvetica', 'bold')
    const admissionDate = employee?.admission_date || '1900-01-01'
    const finalEffectiveDate = effective_date < admissionDate ? admissionDate : effective_date
    const cidadeUF = unit?.city ? `${unit.city}/${unit.state || 'GO'}` : 'Valparaíso de Goiás/GO'
    doc.text(`Vigência: ${formatDatePT(finalEffectiveDate)}  -  ${cidadeUF}, ${formatDateExtenso(option_date)}.`, 20, currentY)
  }

  addFooter()
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
}


// --- GERADOR MEDIDAS DISCIPLINARES (LAYOUT BRS GESTÃO) ---
export async function generateDisciplinaryPdf(data: any) {
  const doc = new jsPDF()
  const { employee, type, application_date, occurrence_date, supervisor_name, witness_name, history_text, impact_text, recommendation_text, recurrence_number_by_reason, suspension_days, generatedBy } = data

  const formatCpf = (cpf: string) => {
    const clean = cpf?.replace(/\D/g, '') || ''
    if (clean.length !== 11) return cpf
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }

  const getTitle = () => {
    switch (type) {
      case 'verbal_warning': return 'ADVERTÊNCIA VERBAL AO COLABORADOR'
      case 'written_warning': return 'ADVERTÊNCIA DISCIPLINAR AO COLABORADOR'
      case 'suspension': return 'SUSPENSÃO DISCIPLINAR AO COLABORADOR'
      default: return 'MEDIDA DISCIPLINAR AO COLABORADOR'
    }
  }

  // Cabeçalho com Borda
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(15, 10, 180, 18)
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(getTitle(), 20, 21)
  
  try {
    doc.addImage('/logotipos/BRS-GESTAO-FUNDO-CLARO.png', 'PNG', 150, 8, 40, 20, undefined, 'FAST')
  } catch (e) {
    doc.text('BRS GESTÃO', 190, 21, { align: 'right' })
  }

  // Dados Básicos
  let currentY = 40
  doc.setFontSize(10)
  
  // Linha 1
  doc.setFont('helvetica', 'bold').text('DATA APLICAÇÃO:', 40, currentY)
  doc.setFont('helvetica', 'normal').text(formatDate(application_date), 75, currentY)
  doc.setFont('helvetica', 'bold').text('DATA OCORRIDO:', 115, currentY)
  doc.setFont('helvetica', 'normal').text(formatDate(occurrence_date), 150, currentY)
  
  currentY += 6
  doc.setFont('helvetica', 'bold').text('NOME DO COLABORADOR:', 30, currentY)
  doc.setFont('helvetica', 'normal').text(employee.name.toUpperCase(), 78, currentY)
  
  currentY += 6
  doc.setFont('helvetica', 'bold').text('CPF:', 65, currentY)
  doc.setFont('helvetica', 'normal').text(formatCpf(employee.cpf), 78, currentY)
  
  currentY += 6
  doc.setFont('helvetica', 'bold').text('CARGO:', 60, currentY)
  doc.setFont('helvetica', 'normal').text((employee.job_title || '-').toUpperCase(), 78, currentY)
  
  currentY += 6
  doc.setFont('helvetica', 'bold').text('TESTEMUNHA:', 48, currentY)
  doc.setFont('helvetica', 'normal').text((witness_name || 'NÃO INFORMADA').toUpperCase(), 78, currentY)
  
  currentY += 6
  doc.setFont('helvetica', 'bold').text('SUPERVISOR:', 50, currentY)
  doc.setFont('helvetica', 'normal').text((supervisor_name || 'NÃO INFORMADO').toUpperCase(), 78, currentY)

  // Histórico
  currentY += 12
  doc.setFont('helvetica', 'normal').setFontSize(9)
  doc.text('Nesta data e na presença da testemunha indicada, o colaborador foi advertido sobre o histórico abaixo:', 15, currentY)
  
  currentY += 3
  doc.setDrawColor(0).setLineWidth(0.3)
  const historyLines = doc.splitTextToSize(history_text || '', 170)
  const historyHeight = Math.max(15, (historyLines.length * 4.5) + 5)
  doc.rect(15, currentY, 180, historyHeight)
  doc.text(historyLines, 18, currentY + 6)
  
  currentY += historyHeight + 6
  const ordinal = recurrence_number_by_reason === 1 ? '1ª' : recurrence_number_by_reason === 2 ? '2ª' : recurrence_number_by_reason === 3 ? '3ª' : `${recurrence_number_by_reason}ª`
  doc.text('Esta foi a', 35, currentY)
  doc.setFont('helvetica', 'bold').text(`${ordinal} vez`, 58, currentY)
  doc.setFont('helvetica', 'normal').text('que o colaborador foi advertido sobre essa questão.', 75, currentY)

  // Gravidade
  currentY += 6
  doc.text('Sobre a gravidade do ocorrido, seguem as observações e implicações para o setor:', 15, currentY)
  currentY += 3
  const impactLines = doc.splitTextToSize(impact_text || '', 170)
  const impactHeight = Math.max(18, (impactLines.length * 4.5) + 5)
  doc.rect(15, currentY, 180, impactHeight)
  doc.text(impactLines, 18, currentY + 6)

  // Recomendações
  currentY += impactHeight + 6
  doc.text('Diante do ocorrido, recomendamos as seguintes medidas de aprimoramento de conduta e desempenho:', 15, currentY)
  currentY += 3
  const recLines = doc.splitTextToSize(recommendation_text || '', 170)
  const recHeight = Math.max(15, (recLines.length * 4.5) + 5)
  doc.rect(15, currentY, 180, recHeight)
  doc.text(recLines, 18, currentY + 6)

  // Texto Final Jurídico
  currentY += recHeight + 6 // Reduzi de 10 para 6
  const footerText = [
    "Este documento serve como notificação de que a empresa considera que esse tipo de conduta merece ação disciplinar e fará parte de seu arquivo pessoal.",
    "A presente advertência tem por objetivo registrar que o colaborador foi formalmente informado sobre condutas inadequadas observadas, bem como orientado quanto à necessidade de mudança de postura e adoção de ações corretivas.",
    "Ressalta-se que esta advertência não possui caráter punitivo, servindo apenas como instrumento de comunicação e orientação para melhoria do comportamento e do desempenho profissional.",
    "A assinatura do colaborador abaixo não representa reconhecimento de culpa, mas apenas a ciência do conteúdo desta notificação e o compromisso em corrigir as condutas mencionadas.",
    "O presente documento será assinado eletronicamente pelas partes envolvidas, por meio de plataforma eletrônica com validade jurídica, em conformidade com a Medida Provisória nº 2.200-2/2001, que institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil). As assinaturas eletrônicas conferem autenticidade, integridade e validade legal a este registro, dispensando a necessidade de vias físicas."
  ]

  doc.setFontSize(8)
  footerText.forEach(t => {
    const split = doc.splitTextToSize(t, 180)
    const blockHeight = (split.length * 4) + 1.2
    
    // SENSOR DE QUEBRA DE PÁGINA: Limite estendido para 282mm
    if (currentY + blockHeight > 282) {
      doc.addPage()
      currentY = 20 // Reinicia no topo da nova página
    }
    
    doc.text(split, 15, currentY)
    currentY += blockHeight
  })

  // Rodapé de Auditoria
  const addAuditFooter = () => {
    const pageCount = (doc as any).internal.getNumberOfPages()
    const now = new Date()
    const footerDate = format(now, "dd/MM/yyyy 'às' HH:mm:ss")
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Emitido em: ${footerDate} - Usuário: ${generatedBy || 'Sistema'} - ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 15, 288)
      doc.text(`Página ${i} de ${pageCount}`, 195, 288, { align: 'right' })
    }
  }

  addAuditFooter()
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
}
