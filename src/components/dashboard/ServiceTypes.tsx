import { useState, useEffect, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { Wrench, Plus, Edit2, Trash2, Check, X, Clock, RefreshCw, DollarSign, Sparkles } from 'lucide-react';

interface ServiceTypesProps {
  user: User;
}

export const DEFAULT_SERVICE_TYPES = [
  {
    name: 'Suporte Técnico & Manutenção de Computadores',
    description: 'Formatação, remoção de vírus, otimização, troca de peças, substituição por SSD e limpeza física.',
    defaultRecurrence: '6_meses',
    defaultHours: 2,
    defaultHourlyRate: 90,
  },
  {
    name: 'Instalação & Configuração de Redes e Wi-Fi',
    description: 'Configuração de roteadores, switches, cabeamento estruturado, rede Mesh e otimização de sinal Wi-Fi.',
    defaultRecurrence: '12_meses',
    defaultHours: 3,
    defaultHourlyRate: 100,
  },
  {
    name: 'Contrato de Suporte em TI Mensal (Empresas)',
    description: 'Atendimento preventivo e corretivo presencial/remoto para empresas, monitoramento e suporte a usuários.',
    defaultRecurrence: '3_meses',
    defaultHours: 10,
    defaultHourlyRate: 85,
  },
  {
    name: 'Backup em Nuvem & Segurança da Informação',
    description: 'Implementação de rotinas de backup automatizado, antivírus corporativo, firewall e prevenção de ransomware.',
    defaultRecurrence: '6_meses',
    defaultHours: 2.5,
    defaultHourlyRate: 110,
  },
  {
    name: 'Configuração de Servidores & Cloud',
    description: 'Instalação e gerenciamento de servidores Windows/Linux, Active Directory, virtualização e integração cloud.',
    defaultRecurrence: '6_meses',
    defaultHours: 4,
    defaultHourlyRate: 120,
  },
];

export const RECURRENCE_LABELS: Record<string, string> = {
  '': 'Sem recorrência (Pontual)',
  '3_meses': 'A cada 3 Meses (Trimestral)',
  '6_meses': 'A cada 6 Meses (Semestral)',
  '12_meses': 'A cada 12 Meses (Anual)',
};

export default function ServiceTypes({ user }: ServiceTypesProps) {
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultRecurrence, setDefaultRecurrence] = useState('6_meses');
  const [defaultHours, setDefaultHours] = useState<number | ''>(2);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number | ''>(75);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const path = 'serviceTypes';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((document) => {
        list.push({
          id: document.id,
          ...document.data()
        });
      });

      // Seed initial default types if database is empty for this user
      if (list.length === 0 && !snapshot.metadata.hasPendingWrites) {
        try {
          for (const item of DEFAULT_SERVICE_TYPES) {
            await addDoc(collection(db, 'serviceTypes'), {
              userId: user.uid,
              ...item,
              createdAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.error('Error seeding default service types:', e);
        }
      }

      setServiceTypes(list);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDefaultRecurrence('6_meses');
    setDefaultHours(2);
    setDefaultHourlyRate(75);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingId(item.id);
    setName(item.name || '');
    setDescription(item.description || '');
    setDefaultRecurrence(item.defaultRecurrence || '');
    setDefaultHours(item.defaultHours ?? 2);
    setDefaultHourlyRate(item.defaultHourlyRate ?? 75);
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do serviço.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const docRef = doc(db, 'serviceTypes', editingId);
        await updateDoc(docRef, {
          name: name.trim(),
          description: description.trim(),
          defaultRecurrence,
          defaultHours: Number(defaultHours) || 0,
          defaultHourlyRate: Number(defaultHourlyRate) || 0,
          updatedAt: Date.now()
        });
      } else {
        await addDoc(collection(db, 'serviceTypes'), {
          userId: user.uid,
          name: name.trim(),
          description: description.trim(),
          defaultRecurrence,
          defaultHours: Number(defaultHours) || 0,
          defaultHourlyRate: Number(defaultHourlyRate) || 0,
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      setName('');
      setDescription('');
    } catch (error) {
      handleFirestoreError(
        error, 
        editingId ? OperationType.UPDATE : OperationType.CREATE, 
        editingId ? `serviceTypes/${editingId}` : 'serviceTypes'
      );
      alert('Erro ao salvar tipo de serviço.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este tipo de serviço?')) return;
    try {
      await deleteDoc(doc(db, 'serviceTypes', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `serviceTypes/${id}`);
      alert('Erro ao excluir tipo de serviço.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#333333]">Catálogo & Tipos de Serviços</h1>
          <p className="text-gray-500 text-sm mt-1">
            Cadastre e edite os tipos de serviços oferecidos predefinindo a tempo de recorrência técnica e valores padrão.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 bg-[#005B96] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#004b7d] transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Tipo de Serviço
        </button>
      </div>

      {/* Grid of Service Types */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          Carregando catálogo de serviços...
        </div>
      ) : serviceTypes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Nenhum serviço cadastrado.</p>
          <p className="text-sm text-gray-400 mt-1">Clique no botão acima para adicionar o primeiro serviço.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {serviceTypes.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-[#005B96]/10 text-[#005B96] flex items-center justify-center font-bold">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-[#333333] text-base leading-snug">{item.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-gray-400 hover:text-[#005B96] hover:bg-gray-100 rounded-lg transition-colors"
                      title="Editar Serviço"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir Serviço"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {item.description && (
                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">{item.description}</p>
                )}

                <div className="space-y-2 pt-3 border-t border-gray-100 text-xs">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 text-[#005B96]" />
                      Recorrência Recomendada:
                    </span>
                    <span className="font-bold text-[#005B96] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {RECURRENCE_LABELS[item.defaultRecurrence] || 'Sem recorrência'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Estimativa Padrão:
                    </span>
                    <span className="font-semibold text-gray-800">
                      {item.defaultHours || 0}h @ R$ {item.defaultHourlyRate || 0}/h
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center text-xs font-bold text-gray-700">
                <span>Valor Base de Mão de Obra:</span>
                <span className="text-[#00A86B] text-sm">
                  R$ {((item.defaultHours || 0) * (item.defaultHourlyRate || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR TIPO DE SERVIÇO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#005B96]" />
                <h2 className="font-bold text-lg text-[#333333]">
                  {editingId ? 'Editar Tipo de Serviço' : 'Cadastrar Novo Tipo de Serviço'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Higienização Completa de Ar Condicionado"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descrição do Escopo / Detalhes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Limpeza com pulverização bactericida, higienização das aletas e teste de dreno."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Recorrência Recomendada (Alerta Preventivo)
                </label>
                <select
                  value={defaultRecurrence}
                  onChange={(e) => setDefaultRecurrence(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none bg-white"
                >
                  {Object.entries(RECURRENCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  O sistema gerará um alerta automático após este tempo contado a partir da conclusão do serviço.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Horas Padrão
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={defaultHours}
                    onChange={(e) => setDefaultHours(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Valor Hora (R$)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={defaultHourlyRate}
                    onChange={(e) => setDefaultHourlyRate(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#005B96] text-white rounded-lg text-sm font-semibold hover:bg-[#004b7d] transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Tipo de Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
