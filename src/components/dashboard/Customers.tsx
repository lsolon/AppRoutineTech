import { useState, useEffect } from 'react';
import { UserPlus, Search, MessageCircle, X } from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';

interface CustomersProps {
  user: User;
}

export default function Customers({ user }: CustomersProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const path = 'customers';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        customersList.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email || '',
          referralSource: data.referralSource || '',
          lastService: data.lastService || 'Novo',
          date: new Date(data.createdAt?.toMillis() || Date.now()).toLocaleDateString(),
        });
      });
      setCustomers(customersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSaveCustomer = async () => {
    if (!newName || !newPhone) {
      alert("Preencha o nome e o telefone do cliente.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'customers'), {
        userId: user.uid,
        name: newName,
        phone: newPhone,
        address: newAddress,
        createdAt: serverTimestamp()
      });
      
      setShowForm(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'customers');
      alert("Erro ao salvar cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#333333]">Clientes</h1>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="bg-[#005B96] text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          {showForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold text-[#333333] mb-4">Cadastrar Novo Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none" 
                placeholder="Ex: João da Silva" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input 
                type="text" 
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none" 
                placeholder="(21) 90000-0000" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Opcional)</label>
              <input 
                type="text" 
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none" 
                placeholder="Rua, Número, Bairro" 
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSaveCustomer}
              disabled={isSaving}
              className="bg-[#00A86B] disabled:bg-gray-400 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              {isSaving ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-sm text-gray-500">
                <th className="px-6 py-4 font-medium">Nome</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Último Serviço</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#333333]">
                    {customer.name}
                    {customer.referralSource && (
                      <span className="block text-xs font-normal text-gray-400 mt-0.5">
                        Origem: {customer.referralSource}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div>{customer.phone}</div>
                    {customer.email && (
                      <div className="text-xs text-gray-400">{customer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-sm">
                      {customer.lastService}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{customer.date}</td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(customer.name)},%20tudo%20bem?`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-[#00A86B]/10 text-[#00A86B] hover:bg-[#00A86B] hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chamar
                    </a>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
