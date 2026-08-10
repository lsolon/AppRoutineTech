import { ExternalLink } from 'lucide-react';

const portfolioItems = [
  {
    title: 'Magic Library',
    description: 'Um sistema encantador para gestão de biblioteca ou catálogo de livros.',
    url: 'https://approutinetech.duckdns.org/magic-library',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tags: ['Catálogo', 'Web App']
  },
  {
    title: 'Pintura e Manutenção',
    description: 'Site institucional focado em serviços de pintura e manutenção residencial/comercial.',
    url: 'https://approutinetech.duckdns.org/pintura-e-manutencao',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    tags: ['Institucional', 'Serviços']
  }
];

export default function Portfolio() {
  return (
    <section id="portfolio" className="py-20 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-[#333333] mb-4 tracking-tight">Nosso Portfólio</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Confira alguns dos sites e sistemas desenvolvidos pela nossa equipe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {portfolioItems.map((item, index) => (
            <div key={index} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white flex flex-col">
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-[#005B96]/0 group-hover:bg-[#005B96]/20 transition-colors duration-300"></div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-blue-50 text-[#005B96] text-xs font-semibold rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="text-2xl font-bold text-[#333333] mb-3">{item.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{item.description}</p>
                
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#005B96] font-semibold hover:text-[#004A7A] transition-colors group/link"
                >
                  Visitar projeto
                  <ExternalLink className="w-4 h-4 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
