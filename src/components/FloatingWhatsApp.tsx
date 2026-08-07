import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/5521999999999?text=Ol%C3%A1,%20gostaria%20de%20um%20or%C3%A7amento!"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#00A86B] text-white rounded-full shadow-lg hover:bg-emerald-600 transition-all transform hover:scale-110 hover:shadow-emerald-900/30 animate-bounce-slow"
      aria-label="Falar conosco no WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </a>
  );
}
