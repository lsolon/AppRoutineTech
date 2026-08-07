import { Clock, MapPin, Phone, Mail, MessageCircle } from 'lucide-react';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

export default function Footer() {
  const { companyInfo, getWhatsAppUrl } = useCompanyInfo();

  return (
    <footer className="bg-[#005B96] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#005B96] font-bold text-xl">
                  {companyInfo.companyName.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-bold text-white text-xl tracking-tight">{companyInfo.companyName}</span>
             </div>
             <p className="text-blue-100 leading-relaxed text-sm">
                Especialistas em suporte técnico de TI, redes, servidores, backup e manutenção de computadores. Desempenho e segurança garantidos.
             </p>
          </div>
          
          <div>
             <h4 className="font-bold text-lg mb-6">Contato</h4>
             <ul className="space-y-4 text-blue-100 text-sm">
                <li className="flex items-center gap-3">
                   <Phone className="w-5 h-5 flex-shrink-0 text-emerald-300" />
                   <a 
                     href={getWhatsAppUrl(`Ol%C3%A1%20${companyInfo.companyName}`)} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="hover:underline flex items-center gap-1 font-semibold text-white"
                   >
                     <span>{companyInfo.phone}</span>
                     <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                   </a>
                </li>
                <li className="flex gap-3">
                   <Mail className="w-5 h-5 flex-shrink-0" />
                   <span>{companyInfo.email}</span>
                </li>
                <li className="flex gap-3">
                   <MapPin className="w-5 h-5 flex-shrink-0" />
                   <span>{companyInfo.address} - {companyInfo.city}</span>
                </li>
             </ul>
          </div>
          
          <div>
             <h4 className="font-bold text-lg mb-6">Horário de Atendimento</h4>
             <ul className="space-y-4 text-blue-100 text-sm">
                <li className="flex gap-3">
                   <Clock className="w-5 h-5 flex-shrink-0" />
                   <div>
                      <p className="font-bold text-white">Segunda a Sexta</p>
                      <p>08:00 às 18:00</p>
                   </div>
                </li>
                <li className="flex gap-3">
                   <Clock className="w-5 h-5 flex-shrink-0" />
                   <div>
                      <p className="font-bold text-white">Sábado</p>
                      <p>08:00 às 12:00 (Apenas emergências)</p>
                   </div>
                </li>
             </ul>
          </div>
          
          <div>
             <h4 className="font-bold text-lg mb-6">Serviços</h4>
             <ul className="space-y-2 text-blue-100 text-sm">
                <li><a href="#servicos" className="hover:text-white transition-colors">Suporte Técnico & Manutenção</a></li>
                <li><a href="#servicos" className="hover:text-white transition-colors">Infraestrutura de Redes & Wi-Fi</a></li>
                <li><a href="#servicos" className="hover:text-white transition-colors">Backup em Nuvem & Segurança</a></li>
                <li><a href="#servicos" className="hover:text-white transition-colors">Servidores & Contratos Mensais</a></li>
             </ul>
          </div>

        </div>
        
        <div className="border-t border-blue-400/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-blue-200">
           <p>© {new Date().getFullYear()} {companyInfo.companyName}. Todos os direitos reservados.</p>
           <p>CNPJ: {companyInfo.cnpj}</p>
        </div>
      </div>
    </footer>
  );
}
