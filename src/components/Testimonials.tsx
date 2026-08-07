import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Carlos Mendes',
    role: 'Diretor Administrativo',
    text: 'Serviço de suporte em TI excepcional! Organizaram nosso servidor, reestruturaram a rede Wi-Fi corporativa e o suporte remoto atende nossos funcionários quase instantaneamente.',
  },
  {
    name: 'Ana Carolina',
    role: 'Gerente Geral de Escritório',
    text: 'Estávamos com problema de lentidão nos computadores e constantes quedas na internet. A equipe fez a manutenção preventiva de todos os equipamentos e resolveu em definitivo.',
  },
  {
    name: 'Roberto Silveira',
    role: 'Profissional Autônomo',
    text: 'Precisei de um upgrade urgente de SSD e backup completo no meu computador de trabalho. Serviço rápido, seguro e transparente. Recomendo fortemente.',
  }
];

export default function Testimonials() {
  return (
    <section id="depoimentos" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center gap-1 mb-4">
             {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
             ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4">Nota 5.0 no Google</h2>
          <p className="text-lg text-gray-600">
            Veja o que nossos clientes dizem sobre o nosso trabalho e pontualidade.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                 <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                 </div>
                 <p className="text-gray-700 italic mb-6 leading-relaxed">
                   "{testimonial.text}"
                 </p>
              </div>
              <div>
                 <p className="font-bold text-[#333333]">{testimonial.name}</p>
                 <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
