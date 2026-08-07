import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { 
  FileText, CheckCircle, Clock, Search, X, Printer, 
  XCircle, AlertTriangle, ArrowUpDown, RefreshCw, 
  BarChart2, TrendingUp, Calendar, AlertCircle, Sparkles
} from 'lucide-react';

interface QuoteListProps {
  user: User;
}

const RECURRENCE_OPTIONS = [
  { value: '', label: 'Sem recorrência (Pontual)' },
  { value: '3_meses', label: 'A cada 3 Meses (Manutenção / Suporte Trimestral)' },
  { value: '6_meses', label: 'A cada 6 Meses (Revisão Preventiva de TI)' },
  { value: '12_meses', label: 'A cada 12 Meses (Revisão Anual de Equipamentos)' },
];

export default function QuoteList({ user }: QuoteListProps) {
  const { companyInfo } = useCompanyInfo();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'status' | 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc'>('status');
  const [editingRecurrenceId, setEditingRecurrenceId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const path = 'quotes';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quotesList: any[] = [];
      const now = Date.now();

      snapshot.forEach((document) => {
        const data = document.data();
        const createdMillis = data.createdAt?.toMillis 
          ? data.createdAt.toMillis() 
          : (typeof data.createdAt === 'number' ? data.createdAt : now);
        
        const updatedMillis = data.updatedAt?.toMillis
          ? data.updatedAt.toMillis()
          : (typeof data.updatedAt === 'number' ? data.updatedAt : createdMillis);

        // Calculate days elapsed since creation/last update
        const daysElapsed = (now - updatedMillis) / (1000 * 60 * 60 * 24);

        // Rule: If status is 'pendente' and > 5 days without update, it is automatically expired/recusado
        const isAutoExpired = data.status === 'pendente' && daysElapsed > 5;
        const effectiveStatus = isAutoExpired ? 'recusado' : (data.status || 'pendente');

        quotesList.push({
          id: document.id,
          quoteNumber: data.quoteNumber || 'N/A',
          customerName: data.customerName || 'Cliente',
          service: data.service || 'Geral',
          serviceDetails: data.serviceDetails || '',
          hours: Number(data.hours) || 0,
          hourlyRate: Number(data.hourlyRate) || 0,
          materialsTotal: Number(data.materialsTotal) || 0,
          total: Number(data.total) || 0,
          status: effectiveStatus,
          rawStatus: data.status || 'pendente',
          isAutoExpired,
          recurrencePeriod: data.recurrencePeriod || '',
          daysElapsed: Math.floor(daysElapsed),
          createdMillis,
          updatedMillis,
          date: new Date(createdMillis).toLocaleDateString('pt-BR'),
        });
      });

      setQuotes(quotesList);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        status: newStatus,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${quoteId}`);
      alert("Erro ao atualizar o status do orçamento.");
    }
  };

  const handleRecurrenceChange = async (quoteId: string, recurrencePeriod: string) => {
    try {
      const quoteRef = doc(db, 'quotes', quoteId);
      await updateDoc(quoteRef, {
        recurrencePeriod,
        updatedAt: Date.now()
      });
      setEditingRecurrenceId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quotes/${quoteId}`);
      alert("Erro ao salvar a recorrência do serviço.");
    }
  };

  const handlePrintQuotePDF = (quote: any) => {
    const laborTotal = (quote.hours || 0) * (quote.hourlyRate || 0);
    const recurrenceLabel = RECURRENCE_OPTIONS.find(r => r.value === quote.recurrencePeriod)?.label || '';
    const printWindow = window.open('', '', 'height=800,width=900');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8">
            <title>Orçamento ${quote.quoteNumber} - ${quote.customerName}</title>
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
              .summary-box { width: 320px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
              .summary-row { display: flex; justify-content: space-between; font-size: 13px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; color: #475569; }
              .summary-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #005B96; padding-top: 4px; }

              .recurrence-badge { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px 14px; border-radius: 8px; font-size: 12px; margin-bottom: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }

              .terms-box { background: #fffbebf5; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-bottom: 36px; }
              .terms-box h4 { font-weight: 700; margin-bottom: 4px; color: #78350f; }

              .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; text-align: center; }
              .sig-line { border-top: 1px solid #94a3b8; padding-top: 6px; font-size: 12px; color: #475569; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="company-title">${companyInfo.companyName}</div>
                <div class="company-sub">Telefone/WhatsApp: ${companyInfo.phone} | E-mail: ${companyInfo.email}</div>
                <div class="company-sub">${companyInfo.address} - ${companyInfo.city}</div>
              </div>
              <div>
                <div class="badge-number">ORÇAMENTO ${quote.quoteNumber}</div>
                <div class="badge-date">Data: ${quote.date}</div>
              </div>
            </div>

            <div class="grid-2">
              <div class="info-card">
                <h3>Dados do Cliente</h3>
                <p><strong>Nome:</strong> ${quote.customerName}</p>
                <p><strong>Status do Orçamento:</strong> ${
                  quote.status === 'concluido' ? 'Concluído' : 
                  quote.status === 'aprovado' ? 'Aprovado' : 
                  quote.status === 'recusado' ? 'Recusado' : 'Pendente'
                }</p>
              </div>
              <div class="info-card">
                <h3>Prestador de Serviço</h3>
                <p><strong>Empresa:</strong> ${companyInfo.companyName}</p>
                <p><strong>CNPJ:</strong> ${companyInfo.cnpj}</p>
                <p><strong>PIX:</strong> ${companyInfo.pixKey}</p>
                <p><strong>Serviço Solicitado:</strong> ${quote.service}</p>
              </div>
            </div>

            ${quote.serviceDetails ? `
              <div class="section-title">Detalhamento & Escopo do Serviço</div>
              <div class="details-box">${quote.serviceDetails}</div>
            ` : ''}

            ${recurrenceLabel ? `
              <div class="recurrence-badge">
                🔄 <strong>Plano de Recorrência Recomendado:</strong> ${recurrenceLabel}
              </div>
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
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">1. Mão de Obra Técnica (${quote.hours || 0} horas estimadas)</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">Serviço Técnico</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #1e293b;">R$ ${laborTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">2. Materiais, Peças e Insumos Integrados</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">Materiais / Insumos</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; color: #1e293b;">R$ ${(quote.materialsTotal || 0).toFixed(2)}</td>
                </tr>
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
                  <span>R$ ${(quote.materialsTotal || 0).toFixed(2)}</span>
                </div>
                <div class="summary-total">
                  <span>VALOR TOTAL:</span>
                  <span>R$ ${(quote.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="terms-box">
              <h4>Condições e Termos da Proposta:</h4>
              <ul style="padding-left: 16px; margin-top: 4px;">
                <li>Proposta técnica válida por 5 dias corridos a partir da data de emissão.</li>
                <li>Garantia de 90 dias referente aos serviços executados conforme norma técnica.</li>
              </ul>
            </div>

            <div class="signatures">
              <div>
                <div style="height: 40px;"></div>
                <div class="sig-line">${quote.customerName}<br><span style="font-size: 10px; font-weight: normal; color: #94a3b8;">Cliente (Aceite do Orçamento)</span></div>
              </div>
              <div>
                <div style="height: 40px;"></div>
                <div class="sig-line">TechRoutine TI Especializada<br><span style="font-size: 10px; font-weight: normal; color: #94a3b8;">Técnico Responsável</span></div>
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
  };

  // 📊 CALCULATE PROFESSIONAL STATISTICS
  const totalCount = quotes.length;
  const totalAmount = quotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const pendingQuotes = quotes.filter(q => q.status === 'pendente');
  const pendingCount = pendingQuotes.length;
  const pendingAmount = pendingQuotes.reduce((acc, q) => acc + (q.total || 0), 0);
  const expiringSoonCount = pendingQuotes.filter(q => q.daysElapsed >= 4).length;

  const approvedQuotes = quotes.filter(q => q.status === 'aprovado');
  const approvedCount = approvedQuotes.length;
  const approvedAmount = approvedQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const completedQuotes = quotes.filter(q => q.status === 'concluido');
  const completedCount = completedQuotes.length;
  const completedAmount = completedQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const refusedQuotes = quotes.filter(q => q.status === 'recusado');
  const refusedCount = refusedQuotes.length;
  const refusedAmount = refusedQuotes.reduce((acc, q) => acc + (q.total || 0), 0);

  const closedCount = approvedCount + completedCount;
  const conversionRate = totalCount > 0 ? ((closedCount / totalCount) * 100).toFixed(1) : '0';

  // 🔍 FILTER & SORT
  const filteredQuotes = quotes.filter(q => 
    q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.quoteNumber && q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    q.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedQuotes = [...filteredQuotes].sort((a, b) => {
    if (sortOrder === 'status') {
      // Order requirement: Pendentes first, followed by Aprovados, Concluídos, and Recusados
      const statusRank: Record<string, number> = {
        'pendente': 1,
        'aprovado': 2,
        'concluido': 3,
        'recusado': 4
      };
      const rankA = statusRank[a.status] || 5;
      const rankB = statusRank[b.status] || 5;
      if (rankA !== rankB) return rankA - rankB;
      return b.createdMillis - a.createdMillis;
    } else if (sortOrder === 'date-desc') {
      return b.createdMillis - a.createdMillis;
    } else if (sortOrder === 'date-asc') {
      return a.createdMillis - b.createdMillis;
    } else if (sortOrder === 'value-desc') {
      return (b.total || 0) - (a.total || 0);
    } else if (sortOrder === 'value-asc') {
      return (a.total || 0) - (b.total || 0);
    }
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Orçamentos & Propostas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gerencie propostas comerciais, controle de expiração em 5 dias e planos de recorrência.
          </p>
        </div>
      </div>

      {/* 📈 PROFESSIONAL STATISTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Card */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Embandeirado</span>
            <FileText className="w-4 h-4 text-[#005B96]" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-[#333333]">{totalCount} <span className="text-xs font-normal text-gray-500">orçamentos</span></div>
            <div className="text-xs font-bold text-[#005B96] mt-0.5">
              R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Pendentes Card */}
        <div className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Pendentes (Aguardando)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-800">{pendingCount} <span className="text-xs font-normal text-amber-600">em análise</span></div>
            <div className="text-xs font-bold text-amber-700 mt-0.5">
              R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          {expiringSoonCount > 0 && (
            <div className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              {expiringSoonCount} prestes a expirar (5d)
            </div>
          )}
        </div>

        {/* Aprovados Card */}
        <div className="bg-white rounded-xl p-4 border border-blue-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Aprovados</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-blue-800">{approvedCount} <span className="text-xs font-normal text-blue-600">para execução</span></div>
            <div className="text-xs font-bold text-blue-700 mt-0.5">
              R$ {approvedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Concluídos Card */}
        <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Concluídos</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-emerald-800">{completedCount} <span className="text-xs font-normal text-emerald-600">faturados</span></div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">
              R$ {completedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Recusados / Expirados Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between bg-slate-50/50">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Recusados / Expirados</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-700">{refusedCount} <span className="text-xs font-normal text-slate-500">não fechados</span></div>
            <div className="text-xs font-bold text-slate-600 mt-0.5">
              R$ {refusedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-1 text-[11px] text-gray-500 font-medium">
            Taxa de Conversão: <strong className="text-[#005B96]">{conversionRate}%</strong>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Controls Bar: Search & Sorting */}
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow text-sm"
              placeholder="Buscar por cliente, nº orçamento ou serviço..."
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#005B96]" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Ordenar por:</span>
            <select
              value={sortOrder}
              onChange={(e: any) => setSortOrder(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white text-gray-700 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none cursor-pointer"
            >
              <option value="status">Status (Pendentes &gt; Aprovados &gt; Concluídos &gt; Recusados)</option>
              <option value="date-desc">Mais Recentes</option>
              <option value="date-asc">Mais Antigos</option>
              <option value="value-desc">Maior Valor (R$)</option>
              <option value="value-asc">Menor Valor (R$)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4 font-bold">Nº Orçamento</th>
                <th className="px-6 py-4 font-bold">Cliente</th>
                <th className="px-6 py-4 font-bold">Serviço & Escopo</th>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold">Total</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Recorrência do Serviço</th>
                <th className="px-6 py-4 font-bold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    Carregando orçamentos...
                  </td>
                </tr>
              ) : sortedQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      <p>Nenhum orçamento encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedQuotes.map((quote) => {
                  const isRecusado = quote.status === 'recusado';
                  const isConcluido = quote.status === 'concluido';
                  const isAprovado = quote.status === 'aprovado';
                  const isPendente = quote.status === 'pendente';

                  return (
                    <tr 
                      key={quote.id} 
                      className={`transition-colors ${
                        isRecusado 
                          ? 'bg-slate-50/70 opacity-75 hover:bg-slate-100/80' 
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      {/* Quote Number */}
                      <td className={`px-6 py-4 font-bold ${isRecusado ? 'text-gray-400 line-through' : 'text-[#005B96]'}`}>
                        {quote.quoteNumber}
                      </td>

                      {/* Customer Name */}
                      <td className={`px-6 py-4 font-medium ${isRecusado ? 'text-gray-500' : 'text-gray-800'}`}>
                        {quote.customerName}
                      </td>

                      {/* Service */}
                      <td className="px-6 py-4">
                        <div className={`font-medium ${isRecusado ? 'text-gray-500' : 'text-gray-700'}`}>{quote.service}</div>
                        {quote.serviceDetails && (
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5" title={quote.serviceDetails}>
                            {quote.serviceDetails}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                        {quote.date}
                        {isPendente && quote.daysElapsed > 0 && (
                          <span className="block text-[10px] text-amber-600 font-semibold mt-0.5">
                            {quote.daysElapsed}d decorridos
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className={`px-6 py-4 font-bold whitespace-nowrap ${isRecusado ? 'text-gray-500' : 'text-gray-800'}`}>
                        R$ {quote.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isRecusado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle className="w-3.5 h-3.5 text-gray-500" />
                            {quote.isAutoExpired ? 'Recusado (Expirado 5d+)' : 'Recusado'}
                          </span>
                        ) : isConcluido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Concluído
                          </span>
                        ) : isAprovado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendente
                          </span>
                        )}
                      </td>

                      {/* Recurrence Period */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(isAprovado || isConcluido) ? (
                          editingRecurrenceId === quote.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={quote.recurrencePeriod || ''}
                                onChange={(e) => handleRecurrenceChange(quote.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-[#005B96] outline-none"
                              >
                                {RECURRENCE_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => setEditingRecurrenceId(null)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingRecurrenceId(quote.id)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                                quote.recurrencePeriod 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                              }`}
                              title="Clique para configurar recorrência técnica"
                            >
                              <RefreshCw className="w-3 h-3 text-emerald-600" />
                              {RECURRENCE_OPTIONS.find(r => r.value === quote.recurrencePeriod)?.label || 'Definir Recorrência'}
                            </button>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            {isRecusado ? 'Sem aplicação' : 'Pendente de Aprovação'}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF Print Button */}
                          <button
                            onClick={() => handlePrintQuotePDF(quote)}
                            title="Imprimir / Baixar PDF Profissional"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-gray-600" />
                            PDF
                          </button>

                          {/* Approval / Status Buttons */}
                          {isPendente && (
                            <>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'aprovado')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                                title="Aprovar Orçamento"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'recusado')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg text-xs font-semibold transition-colors"
                                title="Marcar como Recusado"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Recusar
                              </button>
                            </>
                          )}

                          {isAprovado && (
                            <>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'concluido')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                                title="Concluir Serviço"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Concluir
                              </button>
                              <button
                                onClick={() => handleStatusChange(quote.id, 'recusado')}
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:text-rose-600 rounded-lg text-xs font-medium transition-colors"
                                title="Cancelar / Recusar Proposta"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {isRecusado && (
                            <button
                              onClick={() => handleStatusChange(quote.id, 'pendente')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-500 hover:bg-gray-200 rounded-lg text-xs font-semibold transition-colors"
                              title="Reabrir Orçamento como Pendente"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Reabrir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
