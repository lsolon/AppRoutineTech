/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import QuoteRequestForm from './components/QuoteRequestForm';
import Services from './components/Services';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import DashboardApp from './components/dashboard/DashboardApp';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      alert('Erro ao realizar login.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isAuthChecking) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]"><div className="w-8 h-8 border-4 border-[#005B96] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (user) {
    return <DashboardApp onLogout={handleLogout} user={user} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-[#333333] selection:bg-[#005B96] selection:text-white">
      <Navbar onLogin={handleLogin} />
      <main>
        <Hero />
        <QuoteRequestForm />
        <Services />
        <Features />
        <Testimonials />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

