import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, Inbox, ArrowRight, MessageCircle } from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';

interface OverviewProps {
  user: User;
  onNavigateToQuoteRequests?: () => void;
}

export default function Overview({ user, onNavigateToQuoteRequests }: OverviewProps) {
  const [faturamento, setFaturamento] = useState(0);
  const [orcamentosFechados, setOrcamentosFechados] = useState(0);
  const [osPendentes, setOsPendentes] = useState(0);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [pendingQuoteRequests, setPendingQuoteRequests] = useState<any[]>([]);

  useEffect(() => {
    // Listen to pending public quote requests from landing page
    const requestsQuery = query(
      collection(db, 'quoteRequests'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      const pending: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pendente' || !data.status) {
          pending.push({ id: doc.id, ...data });
        }
      });
      setPendingQuoteRequests(pending);
    }, (error) => {
      // Non-fatal if offline
      console.warn('Quote requests error:', error);
    });

    return () => unsubscribeRequests();
  }, []);

  useEffect(() => {
    if (!user) return;

    const pathForQuotes = 'quotes';
    const q = query(
      collection(db, pathForQuotes),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let faturamentoTotal = 0;
      let fechados = 0;
      let pendentes = 0;
      const agendaItems: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const createdMillis = data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now();
        const updatedMillis = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || createdMillis);
        const daysElapsed = (Date.now() - updatedMillis) / (1000 * 60 * 60 * 24);
        const isExpired = data.status === 'pendente' && daysElapsed > 5;
        const effectiveStatus = isExpired ? 'recusado' : (data.status || 'pendente');

        if (effectiveStatus === 'concluido') {
          faturamentoTotal += (data.total || 0);
          fechados += 1;
        } else if (effectiveStatus === 'aprovado') {
          fechados += 1;
          pendentes += 1;
        } else if (effectiveStatus === 'pendente') {
          pendentes += 1;
        }

        agendaItems.push({
          id: doc.id,
          time: new Date(createdMillis).toLocaleDateString('pt-BR'),
          client: data.customerName,
          service: data.service,
          status: effectiveStatus
        });
      });

      setFaturamento(faturamentoTotal);
      setOrcamentosFechados(fechados);
      setOsPendentes(pendentes);
      setAgenda(agendaItems.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathForQuotes);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#333333]">Resumo</h1>
      </div>

      {/* Banner de Pedidos de Orçamento Pendentes */}
      {pendingQuoteRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white rounded-xl p-5 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shrink-0">
                <Inbox className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg">
                    {pendingQuoteRequests.length} {pendingQuoteRequests.length === 1 ? 'Novo Pedido de Orçamento' : 'Novos Pedidos de Orçamento'}
                  </span>
                  <span className="bg-white text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Site / Landing Page
                  </span>
                </div>
                <p className="text-amber-100 text-sm mt-0.5 max-w-xl">
                  Última solicitação de <strong>{pendingQuoteRequests[0]?.name}</strong>: "{pendingQuoteRequests[0]?.service}"
                </p>
              </div>
            </div>

            {onNavigateToQuoteRequests && (
              <button
                onClick={onNavigateToQuoteRequests}
                className="inline-flex items-center justify-center gap-2 bg-white text-amber-900 hover:bg-amber-50 px-5 py-2.5 rounded-lg font-bold text-xs shadow-md transition-all shrink-0"
              >
                Atender Solicitações
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#005B96]/10 text-[#005B96] rounded-full flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium leading-tight">Faturamento do Mês</p>
          </div>
          <p className="text-3xl font-bold text-[#333333]">R$ {faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-[#00A86B] rounded-full flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium leading-tight">Orçamentos Fechados</p>
          </div>
          <p className="text-3xl font-bold text-[#333333]">{orcamentosFechados}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm text-gray-500 font-medium leading-tight">OS Pendentes</p>
          </div>
          <p className="text-3xl font-bold text-[#333333]">{osPendentes}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#333333]">Agenda de Hoje</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {agenda.map((item) => (
            <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start sm:items-center gap-4">
                <div className="bg-[#005B96]/10 text-[#005B96] font-bold px-3 py-1.5 rounded-lg text-sm">
                  {item.time}
                </div>
                <div>
                  <p className="font-bold text-[#333333] text-lg">{item.client}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                     {item.service}
                  </p>
                </div>
              </div>
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === 'concluido' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : item.status === 'aprovado'
                      ? 'bg-blue-100 text-blue-800'
                      : item.status === 'recusado'
                        ? 'bg-gray-100 text-gray-600 border border-gray-200'
                        : 'bg-amber-100 text-amber-800'
                }`}>
                  {item.status === 'concluido' ? 'Concluído' : item.status === 'aprovado' ? 'Aprovado' : item.status === 'recusado' ? 'Recusado' : 'Pendente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
