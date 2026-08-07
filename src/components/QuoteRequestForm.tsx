import { useState, FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import { Send, CheckCircle2, MessageCircle, FileText, User, Phone, Mail, Sparkles, Clock, Search } from 'lucide-react';

export default function QuoteRequestForm() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { companyInfo, getWhatsAppUrl } = useCompanyInfo();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim() || !service.trim()) {
      alert('Por favor, preencha os campos obrigatórios (Nome, WhatsApp e Serviço Solicitado).');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'quoteRequests'), {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        email: email.trim(),
        service: service.trim(),
        referralSource: referralSource.trim(),
        status: 'pendente',
        createdAt: serverTimestamp()
      });

      setIsSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'quoteRequests');
      alert('Ocorreu um erro ao enviar seu pedido. Tente novamente ou entre em contato pelo WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setName('');
    setWhatsapp('');
    setEmail('');
    setService('');
    setReferralSource('');
    setIsSubmitted(false);
  };

  const generateWhatsAppUrl = () => {
    const text = `Olá ${companyInfo.companyName}! Meu nome é *${name}*. Enviei um pedido de orçamento pelo site para o serviço:\n\n*"${service}"*\n\nMeu WhatsApp: ${whatsapp}\nE-mail: ${email || 'Não informado'}. Aguardo seu retorno!`;
    return getWhatsAppUrl(text);
  };

  return (
    <section id="solicitar-orcamento" className="py-16 bg-gradient-to-b from-slate-50 to-blue-50/50 border-y border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-10 relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#005B96] via-blue-500 to-[#00A86B]"></div>

          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#005B96] text-xs font-bold px-3 py-1 rounded-full mb-3 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-[#005B96]" />
              Atendimento Direto & Rápido
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#333333]">
              Solicite seu Orçamento Sem Compromisso
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Preencha o formulário abaixo com os detalhes do serviço desejado. Receberemos sua solicitação instantaneamente no sistema!
            </p>
          </div>

          {isSubmitted ? (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-bold text-emerald-900">
                Pedido Enviado com Sucesso!
              </h3>

              <p className="text-emerald-800 text-sm max-w-md mx-auto leading-relaxed">
                Obrigado, <strong className="text-emerald-950">{name}</strong>! Seu pedido de orçamento para <strong>"{service}"</strong> foi registrado. Nossa equipe técnica já recebeu a notificação.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={generateWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1eb857] text-white px-6 py-3 rounded-lg font-bold text-sm transition-colors shadow-sm"
                >
                  <MessageCircle className="w-5 h-5 fill-white text-[#25D366]" />
                  Acelerar Atendimento via WhatsApp
                </a>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto px-5 py-3 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  Enviar Outra Solicitação
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Seu Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Silva"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    WhatsApp / Celular com DDD *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Ex: (21) 99999-8888"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Seu E-mail (Opcional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: carlos@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow"
                    />
                  </div>
                </div>

                {/* Como nos conheceu? */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Como conheceu nossos serviços?
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={referralSource}
                      onChange={(e) => setReferralSource(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow appearance-none text-gray-700"
                    >
                      <option value="">Selecione uma opção (Opcional)</option>
                      <option value="Google / Pesquisa Web">Google / Pesquisa Web</option>
                      <option value="Instagram / Redes Sociais">Instagram / Redes Sociais</option>
                      <option value="Indicação de Amigos/Familiares">Indicação de Amigos ou Familiares</option>
                      <option value="Panfleto / Cartão de Visita">Panfleto / Cartão de Visita</option>
                      <option value="Fachada da Loja / Carro de Som">Fachada da Loja / Veículo</option>
                      <option value="Já sou cliente antigo">Já sou cliente antigo</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Serviço Solicitado */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descrição do Serviço Solicitado *
                </label>
                <textarea
                  rows={3}
                  required
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="Descreva o que você precisa. Ex: Formatação de 3 computadores do escritório, instalação de SSD, configuração de servidor ou contrato de suporte em TI."
                  className="w-full p-3.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#005B96] focus:border-[#005B96] outline-none transition-shadow"
                />
              </div>

              {/* Submit & WhatsApp Alternative */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Atendimento rápido no mesmo dia útil</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#005B96] hover:bg-[#004b7d] text-white px-8 py-3.5 rounded-lg font-bold text-sm shadow-md transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Enviando...' : 'Enviar Pedido ao Sistema'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
