import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { 
  Bell, AlertTriangle, Clock, CheckCircle2, MessageCircle, 
  Mail, Calendar, Phone, Search, Copy, Check, Sparkles, RefreshCw, Calculator, ArrowRight
} from 'lucide-react';

interface MaintenanceAlertsProps {
  user: User;
  onNavigateToQuote?: (clientName?: string, serviceName?: string) => void;
}

export const RECURRENCE_MONTHS: Record<string, number> = {
  '3_meses': 3,
  '6_meses': 6,
  '12_meses': 12,
};

export default function MaintenanceAlerts({ user, onNavigateToQuote }: MaintenanceAlertsProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'overdue' | 'upcoming' | 'ok' | 'all'>('overdue');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch quotes
    const quotesPath = 'quotes';
    const qQuotes = query(collection(db, quotesPath), where('userId', '==', user.uid));
    
    const unsubQuotes = onSnapshot(qQuotes, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setQuotes(list);
      setIsLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, quotesPath));

    // Fetch customers for phone/email matching
    const custPath = 'customers';
    const qCust = query(collection(db, custPath), where('userId', '==', user.uid));
    const unsubCust = onSnapshot(qCust, (snapshot) => {
      const cList: any[] = [];
      snapshot.forEach((doc) => {
        cList.push({ id: doc.id, ...doc.data() });
      });
      setCustomers(cList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, custPath));

    return () => {
      unsubQuotes();
      unsubCust();
    };
  }, [user]);

  // Process maintenance recurrence items
  const nowMillis = Date.now();
  
  const alertsList = quotes
    .filter(q => (q.status === 'concluido' || q.status === 'aprovado') && q.recurrencePeriod && RECURRENCE_MONTHS[q.recurrencePeriod])
    .map((q) => {
      const customerInfo = customers.find(c => c.name?.toLowerCase() === q.customerName?.toLowerCase());
      const months = RECURRENCE_MONTHS[q.recurrencePeriod] || 6;
      
      const createdMillis = q.createdAt?.toMillis ? q.createdAt.toMillis() : (typeof q.createdAt === 'number' ? q.createdAt : nowMillis);
      const updatedMillis = q.updatedAt?.toMillis ? q.updatedAt.toMillis() : (typeof q.updatedAt === 'number' ? q.updatedAt : createdMillis);

      // Due date = last update / completion date + months
      const dueDateMillis = updatedMillis + (months * 30 * 24 * 60 * 60 * 1000);
      const diffDays = Math.floor((dueDateMillis - nowMillis) / (1000 * 60 * 60 * 24));

      let urgencyStatus: 'overdue' | 'upcoming' | 'ok' = 'ok';
      if (diffDays < 0) {
        urgencyStatus = 'overdue';
      } else if (diffDays <= 30) {
        urgencyStatus = 'upcoming';
      }

      const formattedLastDate = new Date(updatedMillis).toLocaleDateString('pt-BR');
      const formattedDueDate = new Date(dueDateMillis).toLocaleDateString('pt-BR');

      return {
        id: q.id,
        quoteNumber: q.quoteNumber || 'N/A',
        customerName: q.customerName || 'Cliente',
        customerPhone: customerInfo?.phone || '',
        customerEmail: customerInfo?.email || '',
        service: q.service || 'Suporte Técnico / Manutenção em TI',
        recurrencePeriod: q.recurrencePeriod,
        months,
        updatedMillis,
        dueDateMillis,
        diffDays,
        urgencyStatus,
        formattedLastDate,
        formattedDueDate,
      };
    })
    .sort((a, b) => a.dueDateMillis - b.dueDateMillis); // Most overdue first

  const overdueCount = alertsList.filter(a => a.urgencyStatus === 'overdue').length;
  const upcomingCount = alertsList.filter(a => a.urgencyStatus === 'upcoming').length;
  const okCount = alertsList.filter(a => a.urgencyStatus === 'ok').length;

  const filteredAlerts = alertsList.filter((item) => {
    const matchesSearch = item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.service.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'overdue') return item.urgencyStatus === 'overdue';
    if (activeFilter === 'upcoming') return item.urgencyStatus === 'upcoming';
    if (activeFilter === 'ok') return item.urgencyStatus === 'ok';
    return true;
  });

  const generateWhatsAppText = (item: any) => {
    const monthsText = item.months === 3 ? '3 meses' : item.months === 6 ? '6 meses' : '1 ano';
    return `Olá ${item.customerName}, tudo bem? Passaram-se ${monthsText} desde a realização do serviço de *${item.service}* em ${item.formattedLastDate}.\n\nPara garantir o desempenho, segurança de dados e prevenção de falhas nos seus equipamentos de TI, está na hora da sua *revisão preventiva*. Podemos agendar a manutenção para esta semana?`;
  };

  const handleOpenWhatsApp = (item: any) => {
    const phone = item.customerPhone ? item.customerPhone.replace(/\D/g, '') : '';
    const text = generateWhatsAppText(item);
    const url = phone 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = (item: any) => {
    const text = generateWhatsAppText(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#333333]">Central de Alertas Preventivos</h1>
            <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
              {overdueCount} {overdueCount === 1 ? 'Alerta Crítico' : 'Alertas Críticos'}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Sistema pró-ativo de retenção de clientes: saiba exatamente quando contatar cada cliente para manutenções periódicas.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overdue Card */}
        <button
          onClick={() => setActiveFilter('overdue')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'overdue' 
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Manutenções Vencidas</span>
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-800">{overdueCount}</div>
          <p className="text-xs text-rose-600 mt-1">Clientes com prazo expirado. Ação imediata recomendada.</p>
        </button>

        {/* Upcoming Card */}
        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'upcoming' 
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Vencendo nos Próximos 30d</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-800">{upcomingCount}</div>
          <p className="text-xs text-amber-600 mt-1">Avisar previamente para garantir o agendamento.</p>
        </button>

        {/* Compliant / OK Card */}
        <button
          onClick={() => setActiveFilter('ok')}
          className={`p-4 rounded-xl border text-left transition-all ${
            activeFilter === 'ok' 
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm' 
              : 'bg-white border-gray-100 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Em Dia</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-800">{okCount}</div>
          <p className="text-xs text-emerald-600 mt-1">Manutenções preventivas com prazo regular.</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'overdue' ? 'bg-white text-rose-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vencidas ({overdueCount})
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'upcoming' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Próximos 30d ({upcomingCount})
          </button>
          <button
            onClick={() => setActiveFilter('ok')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'ok' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Em Dia ({okCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'all' ? 'bg-white text-[#005B96] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({alertsList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por cliente ou serviço..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#005B96] outline-none"
          />
        </div>
      </div>

      {/* Alerts List */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          Carregando histórico de manutenções...
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-gray-800 text-lg">Nenhum alerta nesta categoria!</p>
          <p className="text-sm text-gray-500 mt-1">
            {activeFilter === 'overdue' 
              ? 'Excelente trabalho! Não há manutenções preventivas atrasadas no momento.' 
              : 'Nenhum registro encontrado para este filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((item) => {
            const isOverdue = item.urgencyStatus === 'overdue';
            const isUpcoming = item.urgencyStatus === 'upcoming';

            return (
              <div 
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  isOverdue 
                    ? 'border-rose-200 bg-rose-50/30' 
                    : isUpcoming 
                      ? 'border-amber-200 bg-amber-50/20' 
                      : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[#333333] text-lg">{item.customerName}</span>
                      
                      {isOverdue && (
                        <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {Math.abs(item.diffDays)} {Math.abs(item.diffDays) === 1 ? 'dia de atraso' : 'dias de atraso'}
                        </span>
                      )}

                      {isUpcoming && (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Vence em {item.diffDays} {item.diffDays === 1 ? 'dia' : 'dias'}
                        </span>
                      )}

                      {!isOverdue && !isUpcoming && (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Em dia ({item.diffDays} dias restantes)
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-700 font-medium">
                      Serviço: <strong className="text-[#005B96]">{item.service}</strong> (Ref: {item.quoteNumber})
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        Executado em: <strong>{item.formattedLastDate}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                        Recorrência: <strong>a cada {item.months} meses</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Data Prevista da Revisão: <strong className={isOverdue ? 'text-rose-700 font-bold' : 'text-gray-800'}>{item.formattedDueDate}</strong>
                      </span>
                    </div>

                    {item.customerPhone && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        Telefone: <span className="font-semibold text-gray-800">{item.customerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap md:flex-col items-stretch justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-5">
                    {/* WhatsApp Direct Action */}
                    <button
                      onClick={() => handleOpenWhatsApp(item)}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1eb857] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                      title="Enviar aviso preventivo via WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                      Avisar Cliente WhatsApp
                    </button>

                    {/* Copy Text */}
                    <button
                      onClick={() => handleCopyMessage(item)}
                      className="inline-flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors bg-white"
                      title="Copiar mensagem pró-ativa"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
