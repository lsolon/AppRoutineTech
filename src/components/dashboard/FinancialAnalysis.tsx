import { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, DollarSign, PieChart as PieChartIcon, 
  Download, Printer, Filter, ArrowUpRight, 
  Calendar, Award, Layers
} from 'lucide-react';

interface FinancialAnalysisProps {
  user: User;
}

interface QuoteData {
  id: string;
  quoteNumber?: string;
  customerName: string;
  service: string;
  hours?: number;
  hourlyRate?: number;
  laborTotal?: number;
  materialsTotal?: number;
  total: number;
  status: 'pendente' | 'aprovado' | 'concluido' | string;
  createdAt?: any;
  dateObj: Date;
  monthYearStr: string; // e.g. "07/2026"
}

const COLORS = ['#005B96', '#00A86B', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

export default function FinancialAnalysis({ user }: FinancialAnalysisProps) {
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'all' | '3months' | '6months' | 'year'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluido' | 'aprovado' | 'pendente' | 'recusado'>('all');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const path = 'quotes';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: QuoteData[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const dateObj = data.createdAt?.toMillis 
          ? new Date(data.createdAt.toMillis()) 
          : new Date();
        
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        const monthYearStr = `${month}/${year}`;

        list.push({
          id: docSnap.id,
          quoteNumber: data.quoteNumber || 'N/A',
          customerName: data.customerName || 'Cliente não informado',
          service: data.service || 'Geral',
          hours: Number(data.hours) || 0,
          hourlyRate: Number(data.hourlyRate) || 0,
          laborTotal: Number(data.laborTotal) || ((Number(data.hours) || 0) * (Number(data.hourlyRate) || 0)),
          materialsTotal: Number(data.materialsTotal) || 0,
          total: Number(data.total) || 0,
          status: data.status || 'pendente',
          createdAt: data.createdAt,
          dateObj,
          monthYearStr
        });
      });

      setQuotes(list);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Filtered dataset
  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // Period filter
    const now = new Date();
    if (periodFilter === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      result = result.filter(q => q.dateObj >= threeMonthsAgo);
    } else if (periodFilter === '6months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      result = result.filter(q => q.dateObj >= sixMonthsAgo);
    } else if (periodFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      result = result.filter(q => q.dateObj >= startOfYear);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(q => q.status === statusFilter);
    }

    return result;
  }, [quotes, periodFilter, statusFilter]);

  // Financial Metrics
  const metrics = useMemo(() => {
    let receitaRealizada = 0; // Concluído
    let receitaPrevista = 0;  // Aprovado
    let emNegociacao = 0;     // Pendente
    let totalLabor = 0;
    let totalMaterials = 0;

    let countConcluido = 0;
    let countAprovado = 0;
    let countPendente = 0;

    const clientTotals: Record<string, number> = {};
    const serviceTotals: Record<string, { total: number; count: number }> = {};
    const monthlyMap: Record<string, { month: string; recebido: number; previsto: number; pendente: number }> = {};

    filteredQuotes.forEach((q) => {
      // Monthly accumulation
      const monthKey = q.monthYearStr;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, recebido: 0, previsto: 0, pendente: 0 };
      }

      if (q.status === 'concluido') {
        receitaRealizada += q.total;
        countConcluido += 1;
        monthlyMap[monthKey].recebido += q.total;
        totalLabor += q.laborTotal || 0;
        totalMaterials += q.materialsTotal || 0;

        clientTotals[q.customerName] = (clientTotals[q.customerName] || 0) + q.total;
      } else if (q.status === 'aprovado') {
        receitaPrevista += q.total;
        countAprovado += 1;
        monthlyMap[monthKey].previsto += q.total;
      } else {
        emNegociacao += q.total;
        countPendente += 1;
        monthlyMap[monthKey].pendente += q.total;
      }

      // Services distribution
      if (!serviceTotals[q.service]) {
        serviceTotals[q.service] = { total: 0, count: 0 };
      }
      serviceTotals[q.service].total += q.total;
      serviceTotals[q.service].count += 1;
    });

    const totalQuotes = filteredQuotes.length;
    const conversionRate = totalQuotes > 0 ? (((countConcluido + countAprovado) / totalQuotes) * 100) : 0;
    const ticketMedio = countConcluido > 0 ? (receitaRealizada / countConcluido) : 0;

    // Sort monthly trend array
    const monthlyTrend = Object.values(monthlyMap).sort((a, b) => {
      const [mA, yA] = a.month.split('/').map(Number);
      const [mB, yB] = b.month.split('/').map(Number);
      return (yA * 12 + mA) - (yB * 12 + mB);
    });

    // Top Services array
    const servicesData = Object.entries(serviceTotals).map(([name, data]) => ({
      name,
      valor: data.total,
      quantidade: data.count
    })).sort((a, b) => b.valor - a.valor);

    // Status breakdown array for Pie Chart
    const statusData = [
      { name: 'Concluído', value: countConcluido, color: '#00A86B' },
      { name: 'Aprovado', value: countAprovado, color: '#005B96' },
      { name: 'Pendente', value: countPendente, color: '#F59E0B' },
    ].filter(s => s.value > 0);

    // Top Clients array
    const topClients = Object.entries(clientTotals)
      .map(([name, val]) => ({ name, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 5);

    return {
      receitaRealizada,
      receitaPrevista,
      emNegociacao,
      ticketMedio,
      conversionRate,
      totalLabor,
      totalMaterials,
      countConcluido,
      countAprovado,
      countPendente,
      monthlyTrend,
      servicesData,
      statusData,
      topClients
    };
  }, [filteredQuotes]);

  // Export CSV function
  const handleExportCSV = () => {
    if (filteredQuotes.length === 0) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const headers = ["Nº Orçamento", "Cliente", "Serviço", "Data", "Status", "Mão de Obra (R$)", "Materiais (R$)", "Total (R$)"];
    const rows = filteredQuotes.map(q => [
      `"${q.quoteNumber}"`,
      `"${q.customerName}"`,
      `"${q.service}"`,
      `"${q.dateObj.toLocaleDateString('pt-BR')}"`,
      `"${q.status}"`,
      q.laborTotal.toFixed(2),
      q.materialsTotal.toFixed(2),
      q.total.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF Report function
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12" ref={reportRef}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#333333] flex items-center gap-2">
            <PieChartIcon className="w-7 h-7 text-[#005B96]" />
            Análise Financeira & Relatórios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Visão consolidada de faturamento, rentabilidade e desempenho dos orçamentos.
          </p>
        </div>

        {/* Action Buttons & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={periodFilter} 
              onChange={(e: any) => setPeriodFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Todo o Período</option>
              <option value="3months">Últimos 3 Meses</option>
              <option value="6months">Últimos 6 Meses</option>
              <option value="year">Ano Atual</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 shadow-sm">
            <select 
              value={statusFilter} 
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="concluido">Apenas Concluídos</option>
              <option value="aprovado">Apenas Aprovados</option>
              <option value="pendente">Apenas Pendentes</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
            title="Exportar CSV"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-2 bg-[#005B96] hover:bg-[#004b7c] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Report Header for Print Only */}
      <div className="hidden print:block border-b border-gray-300 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#005B96]">AppRoutineTech - Relatório Financeiro</h1>
            <p className="text-sm text-gray-600 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Empresa de Tecnologia e Suporte Técnico em TI</p>
            <p>Relatório de Desempenho Operacional</p>
          </div>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Realized Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Faturamento Realizado</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {metrics.receitaRealizada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {metrics.countConcluido} serviço(s) concluído(s)
            </p>
          </div>
        </div>

        {/* Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Aprovados (A Executar)</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {metrics.receitaPrevista.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              {metrics.countAprovado} orçamento(s) aguardando execução
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ticket Médio</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              R$ {metrics.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Média por serviço concluído
            </p>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Taxa de Conversão</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-amber-600 mt-1 font-medium">
              Aprovados/Concluídos de {filteredQuotes.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Over Time */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Evolução Mensal de Faturamento</h2>
              <p className="text-xs text-gray-500">Comparativo entre faturamento realizado e previsto por mês</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-72 w-full">
            {isLoading ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Carregando dados...</div>
            ) : metrics.monthlyTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados para exibir o gráfico</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00A86B" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00A86B" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#005B96" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#005B96" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip 
                    formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                    contentStyle={{ borderRadius: '8px', borderColor: '#e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="recebido" name="Faturamento Realizado" stroke="#00A86B" fillOpacity={1} fill="url(#colorRecebido)" />
                  <Area type="monotone" dataKey="previsto" name="Aprovado A Executar" stroke="#005B96" fillOpacity={1} fill="url(#colorPrevisto)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Status Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Status dos Orçamentos</h2>
            <p className="text-xs text-gray-500 mb-4">Proporção por estágio do orçamento</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {isLoading ? (
              <span className="text-xs text-gray-400">Carregando...</span>
            ) : metrics.statusData.length === 0 ? (
              <span className="text-xs text-gray-400">Sem orçamentos no período</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metrics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [`${val} orçamento(s)`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            {metrics.statusData.map((st) => (
              <div key={st.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: st.color }}></span>
                  <span className="text-gray-600 font-medium">{st.name}</span>
                </div>
                <span className="font-bold text-gray-800">{st.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Charts: Service Revenue & Labor vs Materials Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Revenue Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Faturamento por Tipo de Serviço</h2>
          <p className="text-xs text-gray-500 mb-6">Receita total dividida por categoria de serviço executado</p>

          <div className="h-64 w-full">
            {metrics.servicesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">Sem dados de serviços</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.servicesData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={110} />
                  <Tooltip formatter={(val: any) => [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']} />
                  <Bar dataKey="valor" fill="#005B96" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Cost Structure: Labor vs Materials */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Composição de Receita (Serviços Concluídos)</h2>
            <p className="text-xs text-gray-500 mb-6">Divisão entre custo de Mão de Obra e Materiais/Peças</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <span className="text-xs font-semibold text-blue-700 block mb-1">Mão de Obra</span>
                <p className="text-xl font-bold text-[#005B96]">
                  R$ {metrics.totalLabor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.receitaRealizada > 0 ? ((metrics.totalLabor / metrics.receitaRealizada) * 100).toFixed(1) : 0}% da receita
                </p>
              </div>

              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-700 block mb-1">Materiais / Peças</span>
                <p className="text-xl font-bold text-[#00A86B]">
                  R$ {metrics.totalMaterials.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.receitaRealizada > 0 ? ((metrics.totalMaterials / metrics.receitaRealizada) * 100).toFixed(1) : 0}% da receita
                </p>
              </div>
            </div>
          </div>

          {/* Visual Bar representation */}
          <div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden flex">
              <div 
                style={{ width: `${metrics.receitaRealizada > 0 ? (metrics.totalLabor / metrics.receitaRealizada) * 100 : 50}%` }}
                className="bg-[#005B96] h-full transition-all duration-500"
                title="Mão de Obra"
              />
              <div 
                style={{ width: `${metrics.receitaRealizada > 0 ? (metrics.totalMaterials / metrics.receitaRealizada) * 100 : 50}%` }}
                className="bg-[#00A86B] h-full transition-all duration-500"
                title="Materiais"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#005B96] rounded-sm"></span> Mão de Obra</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#00A86B] rounded-sm"></span> Materiais / Peças</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients Table Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Principais Clientes por Faturamento</h2>
          <span className="text-xs text-gray-500">Serviços Concluídos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30 text-gray-500 text-xs uppercase font-medium">
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3 text-right">Faturamento Total</th>
                <th className="px-6 py-3 text-right">% do Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.topClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-400 text-sm">
                    Nenhum cliente com serviços concluídos no período.
                  </td>
                </tr>
              ) : (
                metrics.topClients.map((c, index) => (
                  <tr key={c.name} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-medium text-gray-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-[#005B96] text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      {c.name}
                    </td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-800">
                      R$ {c.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5 text-right text-gray-500">
                      {metrics.receitaRealizada > 0 ? ((c.val / metrics.receitaRealizada) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
