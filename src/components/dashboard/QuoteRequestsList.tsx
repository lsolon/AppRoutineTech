import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, addDoc, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { 
  Inbox, MessageCircle, Clock, CheckCircle2, Trash2, 
  User as UserIcon, Phone, Mail, FileText, ArrowRight, Sparkles, Filter, Search, UserPlus
} from 'lucide-react';

interface QuoteRequestsListProps {
  user: User;
  onConvertToQuote?: (customerName: string, phone: string, serviceDescription: string) => void;
}

export default function QuoteRequestsList({ user, onConvertToQuote }: QuoteRequestsListProps) {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pendente' | 'atendido'>('pendente');
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  useEffect(() => {
    const path = 'quoteRequests';
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        list.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setRequests(list);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registerCustomerFromRequest = async (item: any) => {
    if (!user) return false;
    try {
      const q = query(
        collection(db, 'customers'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      
      const cleanPhone = item.whatsapp ? item.whatsapp.replace(/\D/g, '') : '';
      const exists = snapshot.docs.some(d => {
        const data = d.data();
        const existingPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
        return (
          data.name?.toLowerCase().trim() === item.name?.toLowerCase().trim() ||
          (cleanPhone && existingPhone && cleanPhone === existingPhone)
        );
      });

      if (!exists) {
        await addDoc(collection(db, 'customers'), {
          userId: user.uid,
          name: item.name,
          phone: item.whatsapp,
          email: item.email || '',
          referralSource: item.referralSource || '',
          address: item.email ? `E-mail: ${item.email}` : '',
          lastService: item.service || 'Solicitação do Site',
          createdAt: serverTimestamp()
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Erro ao cadastrar cliente no CRM:', err);
      return false;
    }
  };

  const handleUpdateStatus = async (item: any, newStatus: string) => {
    try {
      const docRef = doc(db, 'quoteRequests', item.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: Date.now()
      });

      if (newStatus === 'atendido' || newStatus === 'convertido') {
        const wasCreated = await registerCustomerFromRequest(item);
        if (wasCreated) {
          setNotificationMessage(`Cliente "${item.name}" foi cadastrado automaticamente no CRM!`);
        } else {
          setNotificationMessage(`Solicitação marcada como ${newStatus}. (Cliente já constava no CRM)`);
        }
        setTimeout(() => setNotificationMessage(null), 4000);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `quoteRequests/${item.id}`);
      alert('Erro ao atualizar status do pedido.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta solicitação?')) return;
    try {
      await deleteDoc(doc(db, 'quoteRequests', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `quoteRequests/${id}`);
      alert('Erro ao excluir solicitação.');
    }
  };

  const handleOpenWhatsApp = (item: any) => {
    const phone = item.whatsapp ? item.whatsapp.replace(/\D/g, '') : '';
    const text = `Olá ${item.name}, tudo bem? Vi seu pedido de orçamento no nosso site para o serviço:\n\n*"${item.service}"*\n\nComo posso ajudar você hoje?`;
    const url = phone 
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const pendingCount = requests.filter(r => r.status === 'pendente' || !r.status).length;
  const attendedCount = requests.filter(r => r.status === 'atendido' || r.status === 'convertido').length;

  const filteredRequests = requests.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.whatsapp?.includes(searchTerm);
    if (!matchesSearch) return false;

    if (activeFilter === 'pendente') return item.status === 'pendente' || !item.status;
    if (activeFilter === 'atendido') return item.status === 'atendido' || item.status === 'convertido';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#333333]">Pedidos de Orçamento Recebidos</h1>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 animate-pulse">
                {pendingCount} {pendingCount === 1 ? 'Novo Pedido' : 'Novos Pedidos'}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Solicitações preenchidas pelos visitantes no formulário da Landing Page do site.
          </p>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMessage && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-sm font-bold">{notificationMessage}</span>
          </div>
          <button 
            onClick={() => setNotificationMessage(null)}
            className="text-emerald-200 hover:text-white text-xs font-bold underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('pendente')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'pendente' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Novos / Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('atendido')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'atendido' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Atendidos ({attendedCount})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeFilter === 'all' ? 'bg-white text-[#005B96] shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos ({requests.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, serviço ou telefone..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#005B96] outline-none"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          Carregando solicitações de orçamento...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-800 text-base">Nenhuma solicitação encontrada.</p>
          <p className="text-sm text-gray-400 mt-1">
            {activeFilter === 'pendente' 
              ? 'Nenhum novo pedido pendente no momento!' 
              : 'Nenhum registro encontrado para a busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((item) => {
            const isPending = item.status === 'pendente' || !item.status;
            const dateObj = item.createdAt?.toMillis ? new Date(item.createdAt.toMillis()) : (typeof item.createdAt === 'number' ? new Date(item.createdAt) : new Date());
            const formattedDate = dateObj.toLocaleDateString('pt-BR') + ' às ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                  isPending 
                    ? 'border-amber-200 bg-amber-50/20' 
                    : 'border-gray-100 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info Column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-[#333333] text-lg">{item.name}</span>
                      
                      {isPending ? (
                        <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Novo Pedido
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {item.status === 'convertido' ? 'Convertido em Orçamento' : 'Atendido'}
                        </span>
                      )}

                      <span className="text-xs text-gray-400">
                        • {formattedDate}
                      </span>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm text-gray-800 font-medium">
                      <div className="text-xs text-gray-500 font-bold uppercase mb-1">Serviço Solicitado:</div>
                      "{item.service}"
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        WhatsApp: <strong className="text-gray-800">{item.whatsapp}</strong>
                      </span>
                      {item.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          E-mail: <strong className="text-gray-800">{item.email}</strong>
                        </span>
                      )}
                      {item.referralSource && (
                        <span className="flex items-center gap-1 bg-blue-50 text-[#005B96] font-semibold px-2 py-0.5 rounded border border-blue-100">
                          <Search className="w-3 h-3 text-[#005B96]" />
                          Origem: <strong className="text-[#005B96]">{item.referralSource}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-wrap md:flex-col items-stretch justify-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-5">
                    {/* Convert to Quote */}
                    {onConvertToQuote && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(item, 'convertido');
                          onConvertToQuote(item.name, item.whatsapp, item.service);
                        }}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-[#005B96] hover:bg-[#004b7d] text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors"
                        title="Criar um orçamento oficial para este cliente (Cadastra no CRM automaticamente)"
                      >
                        <FileText className="w-4 h-4" />
                        Gerar Orçamento Oficial
                      </button>
                    )}

                    {/* WhatsApp Direct */}
                    <button
                      onClick={() => handleOpenWhatsApp(item)}
                      className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1eb857] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      title="Chamar no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                      Falar no WhatsApp
                    </button>

                    {/* Manual Customer Registration Button */}
                    <button
                      onClick={async () => {
                        const created = await registerCustomerFromRequest(item);
                        if (created) {
                          setNotificationMessage(`"${item.name}" foi cadastrado no CRM com sucesso!`);
                        } else {
                          setNotificationMessage(`"${item.name}" já constava no CRM de clientes.`);
                        }
                        setTimeout(() => setNotificationMessage(null), 4000);
                      }}
                      className="inline-flex items-center justify-center gap-1.5 text-xs text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors font-bold"
                      title="Cadastrar manualmente este solicitante no CRM de clientes"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                      Cadastrar no CRM
                    </button>

                    {/* Status Toggle & Delete */}
                    <div className="flex items-center gap-2 mt-1">
                      {isPending ? (
                        <button
                          onClick={() => handleUpdateStatus(item, 'atendido')}
                          className="flex-1 text-xs text-gray-600 hover:text-emerald-700 bg-gray-100 hover:bg-emerald-50 px-2.5 py-1 rounded border border-gray-200 transition-colors font-medium"
                          title="Marcar como atendido e cadastrar no CRM"
                        >
                          Marcar Atendido
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(item, 'pendente')}
                          className="flex-1 text-xs text-gray-600 hover:text-amber-700 bg-gray-100 hover:bg-amber-50 px-2.5 py-1 rounded border border-gray-200 transition-colors font-medium"
                        >
                          Marcar Pendente
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Excluir Solicitação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
