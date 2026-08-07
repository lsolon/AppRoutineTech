import { Zap, Shield, Award, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Atendimento Ágil & Remoto',
    description: 'Atendimento presencial emergencial e suporte remoto imediato com total agilidade.'
  },
  {
    icon: Shield,
    title: 'Garantia de 90 Dias',
    description: 'Todos os nossos serviços e peças contam com garantia formal para sua total tranquilidade.'
  },
  {
    icon: Award,
    title: 'Especialistas Certificados',
    description: 'Profissionais altamente capacitados em redes, servidores, segurança e suporte avançado.'
  },
  {
    icon: CreditCard,
    title: 'Facilidade de Pagamento',
    description: 'Aceitamos Pix, Boleto faturado para empresas e parcelamento no Cartão de Crédito.'
  }
];

export default function Features() {
  return (
    <section id="diferenciais" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-6">Por que nos escolher?</h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Trabalhamos com transparência, agilidade e altos padrões de segurança. Nosso compromisso é manter seus sistemas operando sem interrupções e com o máximo desempenho.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#005B96]/10 text-[#005B96] rounded-xl flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#333333] mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600" 
                alt="Rack de redes e servidores"
                className="rounded-2xl w-full h-48 object-cover md:h-64 mt-8 shadow-md"
              />
              <img 
                src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=600" 
                alt="Manutenção de hardware de computador"
                className="rounded-2xl w-full h-48 object-cover md:h-64 shadow-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
