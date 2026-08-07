import { useState } from 'react';
import { MessageCircle, LogIn, Menu, X } from 'lucide-react';
import { useCompanyInfo } from '../hooks/useCompanyInfo';

export default function Navbar({ onLogin }: { onLogin?: () => void }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { companyInfo, getWhatsAppUrl } = useCompanyInfo();

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#005B96] rounded-lg flex items-center justify-center text-white font-bold text-xl">
            {companyInfo.companyName.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-bold text-[#005B96] text-xl tracking-tight">{companyInfo.companyName}</span>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <a href="#servicos" className="text-[#333333] hover:text-[#005B96] font-medium transition-colors">Serviços</a>
          <a href="#diferenciais" className="text-[#333333] hover:text-[#005B96] font-medium transition-colors">Diferenciais</a>
          <a href="#depoimentos" className="text-[#333333] hover:text-[#005B96] font-medium transition-colors">Depoimentos</a>
          {onLogin && (
            <button 
              onClick={onLogin}
              className="text-[#005B96] hover:text-blue-800 font-medium transition-colors flex items-center gap-1.5 ml-4 bg-blue-50 px-3.5 py-2 rounded-lg border border-blue-100"
            >
              <LogIn className="w-4 h-4" /> Acessar Sistema
            </button>
          )}
        </nav>

        <a 
          href={getWhatsAppUrl(`Ol%C3%A1%20${companyInfo.companyName},%20gostaria%20de%20um%20or%C3%A7amento!`)}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:flex items-center gap-2 bg-[#00A86B] hover:bg-emerald-600 text-white px-5 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 shadow-sm"
        >
          <MessageCircle className="w-5 h-5" />
          Falar no WhatsApp
        </a>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          {onLogin && (
            <button 
              onClick={onLogin}
              className="bg-[#005B96] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" /> Entrar
            </button>
          )}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-700 hover:text-[#005B96] focus:outline-none"
            aria-label="Abrir Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <a 
            href="#servicos" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Serviços
          </a>
          <a 
            href="#diferenciais" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Diferenciais
          </a>
          <a 
            href="#depoimentos" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
          >
            Depoimentos
          </a>
          
          {onLogin && (
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogin();
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#005B96] text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              Acessar Painel de TI
            </button>
          )}

          <a 
            href={getWhatsAppUrl(`Ol%C3%A1%20${companyInfo.companyName},%20gostaria%20de%20um%20or%C3%A7amento!`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-[#00A86B] text-white py-2.5 rounded-lg font-semibold text-sm shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Falar no WhatsApp
          </a>
        </div>
      )}
    </header>
  );
}
