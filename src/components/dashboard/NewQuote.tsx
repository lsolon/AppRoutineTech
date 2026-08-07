import { useState, useEffect } from 'react';
import { Calculator, MessageCircle, FileText, Plus, Trash2, PenTool, Mail, Printer, RefreshCw, Wrench } from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { RECURRENCE_LABELS } from './ServiceTypes';

interface MaterialItem {
  id: number;
  description: string;
  value: number | '';
}

interface NewQuoteProps {
  user: User;
  initialClientName?: string;
  initialServiceDetails?: string;
}

export default function NewQuote({ user, initialClientName = '', initialServiceDetails = '' }: NewQuoteProps) {
  const [client, setClient] = useState(initialClientName);
  const [customers, setCustomers] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [service, setService] = useState('Suporte Técnico & Manutenção de Computadores');
  const [recurrencePeriod, setRecurrencePeriod] = useState('6_meses');
  const [serviceDetails, setServiceDetails] = useState(initialServiceDetails);
  const [hours, setHours] = useState<number | ''>(2);
  const [hourlyRate, setHourlyRate] = useState<number | ''>(75.00);
  
  const [materials, setMaterials] = useState<MaterialItem[]>([
    { id: Date.now(), description: '', value: '' }
  ]);
  
  const [total, setTotal] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const laborTotal = (Number(hours) || 0) * (Number(hourlyRate) || 0);
  const materialsTotal = materials.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);

  useEffect(() => {
    setTotal(laborTotal + materialsTotal);
  }, [laborTotal, materialsTotal]);

  useEffect(() => {
    if (!user) return;

    // Fetch customers
    const custPath = 'customers';
    const qCust = query(
      collection(db, custPath),
      where('userId', '==', user.uid)
    );

    const unsubCust = onSnapshot(qCust, (snapshot) => {
      const customersList: any[] = [];
      snapshot.forEach((doc) => {
        customersList.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(customersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, custPath);
    });

    // Fetch Service Types
    const servPath = 'serviceTypes';
    const qServ = query(
      collection(db, servPath),
      where('userId', '==', user.uid)
    );

    const unsubServ = onSnapshot(qServ, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setServiceTypes(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, servPath);
    });

    return () => {
      unsubCust();
      unsubServ();
    };
  }, [user]);

  const handleSelectServiceType = (selectedName: string) => {
    setService(selectedName);
    const matched = serviceTypes.find(st => st.name === selectedName);
    if (matched) {
      if (matched.defaultRecurrence !== undefined) setRecurrencePeriod(matched.defaultRecurrence);
      if (matched.defaultHours !== undefined) setHours(matched.defaultHours);
      if (matched.defaultHourlyRate !== undefined) setHourlyRate(matched.defaultHourlyRate);
      if (matched.description) setServiceDetails(matched.description);
    }
  };

  const handleSaveQuote = async (action: 'whatsapp' | 'email' | 'pdf') => {
    if (!client) {
      alert("Por favor, preencha o nome do cliente.");
      return;
    }
    if (total === 0) {
      alert("O valor do orçamento não pode ser zero.");
      return;
    }
    
    setIsSaving(true);
    try {
      const quoteNumber = `ORC-${Date.now().toString().slice(-6)}`;
      const selectedCustomer = customers.find(c => c.name === client);
      
      await addDoc(collection(db, 'quotes'), {
        userId: user.uid,
        quoteNumber,
        customerName: client,
        service: service,
        serviceDetails: serviceDetails || '',
        recurrencePeriod: recurrencePeriod || '',
        hours: Number(hours) || 0,
        hourlyRate: Number(hourlyRate) || 0,
        materialsTotal: materialsTotal,
        total: total,
        status: 'pendente',
        createdAt: serverTimestamp()
      });
      
      const materialsDesc = materials
        .filter(m => m.description && m.value)
        .map(m => `- ${m.description}: R$ ${Number(m.value).toFixed(2)}`)
        .join('\n');
        
      const materialsText = materialsDesc ? `\n\n*Detalhes dos Custos (Materiais/Peças):*\n${materialsDesc}` : '';
      const detailsText = serviceDetails ? `\n\n*Detalhamento do Serviço:*\n${serviceDetails}` : '';

      const quoteText = `Olá ${client}, aqui está o orçamento preliminar para o serviço de *${service}* (Orçamento nº ${quoteNumber}).${detailsText}\n\n*Mão de Obra:* R$ ${laborTotal.toFixed(2)}${materialsText}\n\n*Valor Total Estimado:* R$ ${total.toFixed(2)}.\n\nPodemos agendar a execução do serviço?`;
      
      if (action === 'whatsapp') {
        const phone = selectedCustomer?.phone ? selectedCustomer.phone.replace(/\D/g, '') : '';
        
        const url = phone 
          ? `https://wa.me/55${phone}?text=${encodeURIComponent(quoteText)}`
          : `https://wa.me/?text=${encodeURIComponent(quoteText)}`;
          
        window.open(url, '_blank');
      } else if (action === 'email') {
        const subject = `Orçamento #${quoteNumber} - ${service} - ${client}`;
        const body = `Olá ${client},\n\nAqui está o orçamento preliminar para o serviço de ${service}.\n${serviceDetails ? `\nDetalhamento:\n${serviceDetails}\n` : ''}\nMão de Obra: R$ ${laborTotal.toFixed(2)}\nMateriais: R$ ${materialsTotal.toFixed(2)}\n\nValor Total Estimado: R$ ${total.toFixed(2)}.\n\nFicamos à disposição para agendamento.`;
        const mailtoUrl = `mailto:${selectedCustomer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
      } else if (action === 'pdf') {
        const materialsTableRows = materials
          .filter(m => m.description && m.value)
          .map((m, idx) => `
            <tr>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${idx + 2}. ${m.description}</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">Materiais / Peças</td>
              <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #1e293b;">R$ ${Number(m.value).toFixed(2)}</td>
            </tr>
          `).join('');

        const currentDateStr = new Date().toLocaleDateString('pt-BR');

        const printWindow = window.open('', '', 'height=800,width=900');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
              <head>
                <meta charset="utf-8">
                <title>Orçamento ${quoteNumber} - ${client}</title>
                <style>
                  * { box-sizing: border-box; margin: 0; padding: 0; }
                  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1e293b; background: #fff; padding: 32px; font-size: 14px; line-height: 1.5; }
                  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #005B96; margin-bottom: 24px; }
                  .company-title { font-size: 22px; font-weight: 800; color: #005B96; letter-spacing: -0.5px; }
                  .company-sub { font-size: 12px; color: #64748b; margin-top: 2px; }
                  .badge-number { background: #f0f9ff; border: 1px solid #bae6fd; color: #0284c7; padding: 6px 12px; border-radius: 6px; font-weight: 700; font-size: 14px; text-align: right; }
                  .badge-date { font-size: 11px; color: #64748b; margin-top: 4px; text-align: right; }
                  
                  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
                  .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; }
                  .info-card h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #005B96; letter-spacing: 0.5px; margin-bottom: 8px; }
                  .info-card p { font-size: 13px; color: #334155; margin-bottom: 4px; }
                  .info-card p strong { color: #0f172a; }

                  .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-left: 3px solid #005B96; padding-left: 8px; }
                  .details-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #334155; margin-bottom: 24px; white-space: pre-line; }

                  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                  th { background: #005B96; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px 12px; text-align: left; }
                  
                  .summary-wrapper { display: flex; justify-content: flex-end; margin-bottom: 28px; }
                  .summary-box { width: 300px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
                  .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #475569; }
                  .summary-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #005B96; padding-top: 4px; }

                  .terms-box { background: #fffbebf5; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-bottom: 36px; }
                  .terms-box h4 { font-weight: 700; margin-bottom: 4px; color: #78350f; }

                  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; }
                  .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 12px; color: #475569; font-weight: 600; }

                  @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                  }
                </style>
              </head>
              <body>
                <div className="header">
                  <div>
                    <div class="company-title">TechRoutine TI</div>
                    <div class="company-sub">Soluções Especializadas em Tecnologia da Informação e Suporte Técnico</div>
                  </div>
                  <div>
                    <div class="badge-number">ORÇAMENTO ${quoteNumber}</div>
                    <div class="badge-date">Emissão: ${currentDateStr}</div>
                  </div>
                </div>

                <div class="grid-2">
                  <div class="info-card">
                    <h3>Dados do Cliente</h3>
                    <p><strong>Nome:</strong> ${client}</p>
                    <p><strong>Telefone:</strong> ${selectedCustomer?.phone || 'Não informado'}</p>
                    <p><strong>Email:</strong> ${selectedCustomer?.email || 'Não informado'}</p>
                  </div>
                  <div class="info-card">
                    <h3>Prestador de Serviço</h3>
                    <p><strong>Empresa:</strong> AppRoutineTech Serviços Tecnológicos</p>
                    <p><strong>Serviço Solicitado:</strong> ${service}</p>
                    <p><strong>Validade da Proposta:</strong> 10 Dias</p>
                  </div>
                </div>

                ${serviceDetails ? `
                  <div class="section-title">Detalhamento & Escopo do Serviço</div>
                  <div class="details-box">${serviceDetails}</div>
                ` : ''}

                <div class="section-title">Composição de Custos</div>
                <table>
                  <thead>
                    <tr>
                      <th>Descrição do Item / Serviço</th>
                      <th style="text-align: center;">Categoria</th>
                      <th style="text-align: right;">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">1. Mão de Obra Técnica (${hours || 0} horas estimadas)</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">Serviço Técnico</td>
                      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #1e293b;">R$ ${laborTotal.toFixed(2)}</td>
                    </tr>
                    ${materialsTableRows}
                  </tbody>
                </table>

                <div class="summary-wrapper">
                  <div class="summary-box">
                    <div class="summary-row">
                      <span>Subtotal Mão de Obra:</span>
                      <span>R$ ${laborTotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-row">
                      <span>Subtotal Materiais / Peças:</span>
                      <span>R$ ${materialsTotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-total">
                      <span>VALOR TOTAL:</span>
                      <span>R$ ${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div class="terms-box">
                  <h4>Condições e Termos da Proposta:</h4>
                  <ul style="padding-left: 16px; margin-top: 4px;">
                    <li>Este documento é uma estimativa preliminar válida por 10 dias a contar da data de emissão.</li>
                    <li>Garantia de 90 dias referente à execução dos serviços técnicos contratados.</li>
                    <li>Formas de pagamento: PIX, transferência ou cartão de crédito a combinar.</li>
                  </ul>
                </div>

                <div class="signatures">
                  <div>
                    <div style="height: 40px;"></div>
                    <div class="sig-line">${client}<br><span style="font-size: 10px; font-weight: normal; color: #94a3b8;">Cliente (Aceite do Orçamento)</span></div>
                  </div>
                  <div>
                    <div style="height: 40px;"></div>
                    <div class="sig-line">AppRoutineTech Serviços<br><span style="font-size: 10px; font-weight: normal; color: #94a3b8;">Técnico Responsável</span></div>
                  </div>
                </div>

                <script>
                  window.onload = function() { window.print(); window.close(); }
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
      
      setClient('');
      setServiceDetails('');
      setHours('');
      setMaterials([{ id: Date.now(), description: '', value: '' }]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quotes');
      alert("Erro ao salvar o orçamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const addMaterial = () => {
    setMaterials([...materials, { id: Date.now(), description: '', value: '' }]);
  };

  const removeMaterial = (id: number) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const updateMaterial = (id: number, field: keyof MaterialItem, val: string | number) => {
    setMaterials(materials.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#005B96]/10 text-[#005B96] rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#333333]">Simulador de Precificação</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-[#333333] border-b border-gray-100 pb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" /> Detalhes do Serviço
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <select 
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow bg-white"
              >
                <option value="" disabled>Selecione um cliente</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>
                <select 
                  value={service}
                  onChange={(e) => handleSelectServiceType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow bg-white font-medium"
                >
                  {serviceTypes.length > 0 ? (
                    serviceTypes.map((st) => (
                      <option key={st.id} value={st.name}>
                        {st.name} ({RECURRENCE_LABELS[st.defaultRecurrence] || 'Pontual'})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Suporte Técnico & Manutenção de Computadores">Suporte Técnico & Manutenção de Computadores</option>
                      <option value="Instalação & Configuração de Redes e Wi-Fi">Instalação & Configuração de Redes e Wi-Fi</option>
                      <option value="Contrato de Suporte em TI Mensal">Contrato de Suporte em TI Mensal</option>
                      <option value="Backup em Nuvem & Segurança da Informação">Backup em Nuvem & Segurança da Informação</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recorrência do Alerta
                </label>
                <select 
                  value={recurrencePeriod}
                  onChange={(e) => setRecurrencePeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow bg-white text-sm"
                >
                  {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detalhamento do Serviço (Escopo / Observações)
              </label>
              <textarea 
                rows={3}
                value={serviceDetails}
                onChange={(e) => setServiceDetails(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow"
                placeholder="Ex: Formatação de 5 computadores, instalação de SSD 480GB, configuração de rede local e rotina de backup em nuvem."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100 mt-4">
              <div className="col-span-2">
                <h3 className="text-sm font-bold text-[#333333] mb-2 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-gray-500" /> Mão de Obra
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horas Estimadas
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow" 
                  placeholder="Ex: 2.5" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Hora (R$)</label>
                <input 
                  type="number" 
                  min="0"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow" 
                  placeholder="Ex: 50.00" 
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#333333]">Custos Detalhados (Materiais / Peças)</h3>
                  <button 
                    onClick={addMaterial}
                    className="text-xs bg-blue-50 text-[#005B96] hover:bg-blue-100 px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Item
                  </button>
               </div>
               
               <div className="space-y-3">
                 {materials.map((item) => (
                    <div key={item.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                         <input 
                           type="text" 
                           value={item.description}
                           onChange={(e) => updateMaterial(item.id, 'description', e.target.value)}
                           className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none" 
                           placeholder="Descrição (ex: SSD Kingston 480GB, Cabo Cat6)" 
                         />
                      </div>
                      <div className="w-32">
                         <input 
                           type="number" 
                           min="0"
                           step="10"
                           value={item.value}
                           onChange={(e) => updateMaterial(item.id, 'value', e.target.value === '' ? '' : Number(e.target.value))}
                           className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none" 
                           placeholder="R$ 0,00" 
                         />
                      </div>
                      <button 
                        onClick={() => removeMaterial(item.id)}
                        disabled={materials.length === 1}
                        className="w-11 h-11 shrink-0 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-red-400"
                        title="Remover Item"
                      >
                         <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Resumo e Ações */}
        <div className="space-y-6">
          <div className="bg-[#005B96] rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-medium text-blue-100 mb-6">Resumo do Orçamento</h3>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between items-center pb-3 border-b border-blue-400/30">
                <span className="text-blue-100">Mão de Obra ({hours || 0}h):</span>
                <span className="font-medium">R$ {laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-blue-400/30">
                <span className="text-blue-100">Materiais ({materials.filter(m => m.description).length} itens):</span>
                <span className="font-medium">R$ {materialsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-xl font-bold">
                <span>Total:</span>
                <span className="text-emerald-400">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => handleSaveQuote('whatsapp')}
                disabled={isSaving}
                className="w-full bg-[#00A86B] hover:bg-emerald-500 disabled:bg-gray-400 text-white py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
              >
                <MessageCircle className="w-5 h-5" />
                {isSaving ? 'Salvando...' : 'Salvar e Enviar via WhatsApp'}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleSaveQuote('email')}
                  disabled={isSaving}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
                <button 
                  onClick={() => handleSaveQuote('pdf')}
                  disabled={isSaving}
                  className="w-full bg-white text-blue-900 border border-blue-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
            <p className="text-center text-xs text-blue-200 mt-4">
              O cliente receberá uma mensagem ou documento formatado.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h4 className="font-bold text-[#005B96] mb-2 text-sm">💡 Dica de Precificação</h4>
            <p className="text-sm text-blue-800 leading-relaxed">
              Lembre-se de adicionar margem de segurança no tempo estimado (Horas) para imprevistos durante a instalação ou manutenção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
