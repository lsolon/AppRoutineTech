import { Monitor, Network, ShieldCheck, Server, HardDrive, Cpu, Globe } from 'lucide-react';

const services = [
  {
    icon: Monitor,
    title: 'Suporte Técnico & Manutenção',
    description: 'Atendimento presencial e remoto para computadores e notebooks. Formatação, troca de SSD/RAM, diagnóstico de hardware e otimização de sistema.',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  {
    icon: Network,
    title: 'Redes & Wi-Fi Corporativo',
    description: 'Projeto, instalação e configuração de cabeamento estruturado, roteadores, switches e redes Wi-Fi Mesh de alta performance.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  {
    icon: ShieldCheck,
    title: 'Segurança & Backup em Nuvem',
    description: 'Proteção contra vírus e ransomware, implementação de firewalls e rotinas de backup automático em nuvem para proteção total dos seus dados.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50'
  },
  {
    icon: Server,
    title: 'Servidores & Cloud Computing',
    description: 'Configuração e gerenciamento de servidores locais e em nuvem, controle de acessos (Active Directory) e virtualização de sistemas.',
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
  {
    icon: HardDrive,
    title: 'Contratos de Suporte Mensal',
    description: 'Gestão preventiva e preventiva de TI para empresas, garantindo estabilidade operacional, canal de chamados e suporte continuado.',
    color: 'text-amber-600',
    bg: 'bg-amber-50'
  },
  {
    icon: Cpu,
    title: 'Consultoria e Projetos de TI',
    description: 'Planejamento de infraestrutura tecnológica, dimensionamento de equipamentos e orientação profissional para modernização dos seus sistemas.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50'
  },
  {
    icon: Globe,
    title: 'Criação de Sites',
    description: 'Desenvolvimento de sites profissionais, responsivos e otimizados, voltados para diversos segmentos.',
    color: 'text-rose-600',
    bg: 'bg-rose-50'
  }
];

export default function Services() {
  return (
    <section id="servicos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4">Especialidades & Serviços de TI</h2>
          <p className="text-lg text-gray-600">
            Oferecemos soluções completas em Tecnologia da Informação para residências, escritórios e empresas, 
            garantindo alta disponibilidade, segurança e agilidade no seu dia a dia.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl flex items-center justify-center mb-6`}>
                <service.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-3">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
