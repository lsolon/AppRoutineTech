import { MessageCircle, ShieldCheck, Clock, Star, FileText } from 'lucide-react';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

export default function Hero() {
  const { companyInfo, getWhatsAppUrl } = useCompanyInfo();

  return (
    <section className="bg-gradient-to-br from-[#005B96] to-blue-800 text-white py-16 lg:py-24 overflow-hidden relative">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
             <Star className="w-4 h-4 text-yellow-300 fill-current" />
             <span className="text-sm font-medium tracking-wide">Nota 5.0 no Google</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
            Suporte Técnico de TI, Redes e Manutenção com Rapidez e Segurança.
          </h1>
          
          <p className="text-lg md:text-xl text-blue-100 max-w-xl leading-relaxed">
            Profissionais especializados em TI para empresas e residências. Soluções completas em hardware, redes, servidores, backup e segurança!
          </p>
          
          <div className="pt-2 flex flex-col sm:flex-row gap-4">
            <a 
              href="#solicitar-orcamento"
              className="flex items-center justify-center gap-2 bg-white text-[#005B96] hover:bg-blue-50 px-7 py-4 rounded-full font-bold text-base transition-all transform hover:scale-105 shadow-lg"
            >
              <FileText className="w-5 h-5 text-[#005B96]" />
              Preencher Formulário de Orçamento
            </a>

            <a 
              href={getWhatsAppUrl(`Ol%C3%A1%20${companyInfo.companyName},%20gostaria%20de%20um%20or%C3%A7amento!`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#00A86B] hover:bg-emerald-500 text-white px-7 py-4 rounded-full font-bold text-base transition-all transform hover:scale-105 shadow-lg shadow-emerald-900/20"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#00A86B]" />
              Pedir pelo WhatsApp
            </a>
          </div>
          
          <div className="flex items-center gap-6 pt-2 text-sm font-medium text-blue-200">
             <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Garantia de 90 dias
             </div>
             <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Suporte Presencial & Remoto
             </div>
          </div>
        </div>
        
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] transform rotate-3 scale-105"></div>
          <img 
            src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=1000" 
            alt="Profissional de TI realizando manutenção e suporte técnico"
            className="rounded-[2rem] shadow-2xl relative z-10 object-cover h-[550px] w-full border-4 border-white/10"
          />
        </div>
      </div>
    </section>
  );
}
