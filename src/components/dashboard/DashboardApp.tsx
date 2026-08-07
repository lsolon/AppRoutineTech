import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Calculator, Menu, X, LogOut, FileText, TrendingUp, Wrench, Bell, Inbox, Building2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Overview from './Overview';
import Customers from './Customers';
import NewQuote from './NewQuote';
import QuoteList from './QuoteList';
import FinancialAnalysis from './FinancialAnalysis';
import ServiceTypes from './ServiceTypes';
import MaintenanceAlerts, { RECURRENCE_MONTHS } from './MaintenanceAlerts';
import QuoteRequestsList from './QuoteRequestsList';
import CompanySettings from './CompanySettings';

interface DashboardAppProps {
  onLogout: () => void;
  user: User;
}

export default function DashboardApp({ onLogout, user }: DashboardAppProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Conversion pre-filled state for new quote
  const [convertedClientName, setConvertedClientName] = useState('');
  const [convertedServiceDetails, setConvertedServiceDetails] = useState('');

  // Monitor quoteRequests for pending badge count
  useEffect(() => {
    const q = query(collection(db, 'quoteRequests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pendente' || !data.status) {
          count++;
        }
      });
      setPendingRequestsCount(count);
    }, (error) => {
      console.warn('Quote requests error:', error);
    });
    return () => unsubscribe();
  }, []);

  // Monitor overdue count for notification badge
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'quotes'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      const now = Date.now();
      snapshot.forEach((doc) => {
        const data = doc.data();
        if ((data.status === 'concluido' || data.status === 'aprovado') && data.recurrencePeriod && RECURRENCE_MONTHS[data.recurrencePeriod]) {
          const months = RECURRENCE_MONTHS[data.recurrencePeriod];
          const updatedMillis = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (typeof data.updatedAt === 'number' ? data.updatedAt : (data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now()));
          const dueDateMillis = updatedMillis + (months * 30 * 24 * 60 * 60 * 1000);
          if (now >= dueDateMillis) {
            count++;
          }
        }
      });
      setOverdueCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'company-settings', label: 'Dados da Empresa', icon: Building2 },
    { id: 'quote-requests', label: 'Pedidos do Site', icon: Inbox, badge: pendingRequestsCount },
    { id: 'customers', label: 'Clientes (CRM)', icon: Users },
    { id: 'quote', label: 'Novo Orçamento', icon: Calculator },
    { id: 'quotes-list', label: 'Orçamentos', icon: FileText },
    { id: 'service-types', label: 'Catálogo de Serviços', icon: Wrench },
    { id: 'alerts', label: 'Alertas Preventivos', icon: Bell, badge: overdueCount },
    { id: 'financial', label: 'Análise Financeira', icon: TrendingUp },
  ];

  const handleConvertToQuote = (customerName: string, phone: string, serviceDescription: string) => {
    setConvertedClientName(customerName);
    setConvertedServiceDetails(`Solicitação do site: ${serviceDescription} (WhatsApp: ${phone})`);
    setActiveTab('quote');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Overview user={user} onNavigateToQuoteRequests={() => setActiveTab('quote-requests')} />;
      case 'company-settings':
        return <CompanySettings user={user} />;
      case 'quote-requests':
        return <QuoteRequestsList user={user} onConvertToQuote={handleConvertToQuote} />;
      case 'customers':
        return <Customers user={user} />;
      case 'quote':
        return (
          <NewQuote 
            user={user} 
            initialClientName={convertedClientName} 
            initialServiceDetails={convertedServiceDetails} 
          />
        );
      case 'quotes-list':
        return <QuoteList user={user} />;
      case 'service-types':
        return <ServiceTypes user={user} />;
      case 'alerts':
        return <MaintenanceAlerts user={user} onNavigateToQuote={() => setActiveTab('quote')} />;
      case 'financial':
        return <FinancialAnalysis user={user} />;
      default:
        return <Overview user={user} onNavigateToQuoteRequests={() => setActiveTab('quote-requests')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans text-[#333333] pb-16 md:pb-0">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm z-10 shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#005B96] rounded-md flex items-center justify-center text-white font-bold text-sm">
              CT
            </div>
            <span className="font-bold text-[#005B96] text-lg tracking-tight">AppRoutineTech</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-[#005B96]/10 text-[#005B96]' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#333333]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[#005B96]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Mobile Header Sticky */}
      <div className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#005B96] rounded-md flex items-center justify-center text-white font-bold text-sm">
            CT
          </div>
          <span className="font-bold text-[#005B96] text-base tracking-tight">AppRoutineTech</span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-2 bg-blue-50 text-[#005B96] px-3 py-1.5 rounded-lg border border-blue-100 font-semibold text-xs relative"
          aria-label="Abrir Menu do Sistema"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>Menu</span>
          {overdueCount > 0 && !isMobileMenuOpen && (
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
          )}
        </button>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-72 bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#005B96] rounded text-white font-bold text-xs flex items-center justify-center">
                    CT
                  </div>
                  <span className="font-bold text-[#005B96] text-sm">Navegação do Sistema</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="py-3 px-3 space-y-1">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-[#005B96] text-white font-bold shadow-xs' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-rose-600' : 'bg-rose-500 text-white'}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around z-30 px-2 shadow-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
            activeTab === 'dashboard' ? 'text-[#005B96]' : 'text-gray-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('quote-requests')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold relative ${
            activeTab === 'quote-requests' ? 'text-[#005B96]' : 'text-gray-500'
          }`}
        >
          <Inbox className="w-5 h-5" />
          <span>Pedidos</span>
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-1 right-2 bg-amber-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('quote')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
            activeTab === 'quote' ? 'text-[#005B96]' : 'text-gray-500'
          }`}
        >
          <Calculator className="w-5 h-5" />
          <span>Orçar</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold relative ${
            activeTab === 'alerts' ? 'text-[#005B96]' : 'text-gray-500'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alertas</span>
          {overdueCount > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-gray-500"
        >
          <Menu className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
}
