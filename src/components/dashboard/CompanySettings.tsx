import { useState, useEffect, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { 
  Building2, Phone, Mail, MapPin, FileText, 
  CreditCard, Save, CheckCircle2, MessageCircle, AlertCircle, Sparkles
} from 'lucide-react';

interface CompanySettingsProps {
  user: User;
}

export default function CompanySettings({ user }: CompanySettingsProps) {
  const { companyInfo: currentInfo, getWhatsAppUrl } = useCompanyInfo();

  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [notes, setNotes] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (currentInfo) {
      setCompanyName(currentInfo.companyName || '');
      setPhone(currentInfo.phone || '');
      setEmail(currentInfo.email || '');
      setCnpj(currentInfo.cnpj || '');
      setAddress(currentInfo.address || '');
      setCity(currentInfo.city || '');
      setPixKey(currentInfo.pixKey || '');
      setNotes(currentInfo.notes || '');
    }
  }, [currentInfo]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Por favor, informe o Nome da Empresa.');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor, informe o Telefone / WhatsApp da empresa.');
      return;
    }

    setIsSaving(true);
    setShowSuccess(false);

    try {
      // Save or overwrite main companyInfo doc
      const docRef = doc(db, 'companyInfo', 'main');
      await setDoc(docRef, {
        userId: user.uid,
        companyName: companyName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        cnpj: cnpj.trim(),
        address: address.trim(),
        city: city.trim(),
        pixKey: pixKey.trim(),
        notes: notes.trim(),
        updatedAt: Date.now()
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'companyInfo/main');
      alert('Erro ao salvar os dados da empresa. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#005B96]" />
            <h1 className="text-2xl font-bold text-[#333333]">Dados da Empresa</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Configure as informações oficiais da sua empresa. O telefone cadastrado aqui atualiza automaticamente os botões de WhatsApp em todo o site.
          </p>
        </div>
      </div>

      {/* WhatsApp Sync Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-xs rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6 text-white fill-white/30" />
          </div>
          <div>
            <div className="font-extrabold text-base flex items-center gap-1.5">
              <span>Integração WhatsApp da Landing Page</span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              O número do WhatsApp salvo nesta tela é direcionado para todos os botões de orçamento da página inicial.
            </p>
          </div>
        </div>

        <a
          href={getWhatsAppUrl('Olá, estou testando o botão do WhatsApp cadastrado!')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-lg font-bold text-xs shrink-0 shadow-sm transition-colors"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-700 text-emerald-700" />
          Testar Botão WhatsApp Atual
        </a>
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">
            Dados da empresa salvos com sucesso! O número de WhatsApp foi atualizado na Landing Page.
          </span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Nome Fantasia */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Nome da Empresa / Nome Fantasia *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: TechRoutine TI Especializada"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none"
              />
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>Telefone / WhatsApp (Com DDD) *</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                Usado na Landing Page
              </span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (21) 99999-8888 ou 21999998888"
                className="w-full pl-10 pr-4 py-3 border border-emerald-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-emerald-50/20"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Os visitantes do site serão direcionados diretamente para este número.
            </p>
          </div>

          {/* E-mail Comercial */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              E-mail Comercial
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@techroutine.com.br"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
              />
            </div>
          </div>

          {/* CNPJ / CPF */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              CNPJ ou CPF Comercial
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="Ex: 12.345.678/0001-90"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
              />
            </div>
          </div>

          {/* Chave PIX */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Chave PIX (Para Recebimentos)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Ex: CNPJ, E-mail ou Celular PIX"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Logradouro e Número
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. das Américas, 3500 - Bloco 2"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
              />
            </div>
          </div>

          {/* Cidade / Estado */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Cidade / Estado
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Rio de Janeiro - RJ"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
            />
          </div>

          {/* Observações / Termos de Garantia */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Termos de Serviço & Garantia Padrão
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Garantia de 90 dias para mão de obra de instalação. Atendimento de segunda a sábado das 08h às 18h."
              className="w-full p-3.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 bg-[#005B96] hover:bg-[#004b7d] text-white px-8 py-3.5 rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando Alterações...' : 'Salvar Cadastro da Empresa'}
          </button>
        </div>
      </form>
    </div>
  );
}
