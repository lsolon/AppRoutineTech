import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, query, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface CompanyInfo {
  companyName: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  city: string;
  pixKey: string;
  notes: string;
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  companyName: 'TechRoutine TI Especializada',
  phone: '21999998888',
  email: 'contato@techroutine.com.br',
  cnpj: '12.345.678/0001-90',
  address: 'Av. das Américas, 3500 - Barra da Tijuca',
  city: 'Rio de Janeiro - RJ',
  pixKey: '12.345.678/0001-90',
  notes: 'Especialistas em suporte de TI, redes, servidores e consultoria tecnológica.'
};

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(DEFAULT_COMPANY_INFO);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to companyInfo collection (first record or 'main' doc)
    const q = query(collection(db, 'companyInfo'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as CompanyInfo;
        setCompanyInfo({
          companyName: data.companyName || DEFAULT_COMPANY_INFO.companyName,
          phone: data.phone || DEFAULT_COMPANY_INFO.phone,
          email: data.email || DEFAULT_COMPANY_INFO.email,
          cnpj: data.cnpj || DEFAULT_COMPANY_INFO.cnpj,
          address: data.address || DEFAULT_COMPANY_INFO.address,
          city: data.city || DEFAULT_COMPANY_INFO.city,
          pixKey: data.pixKey || DEFAULT_COMPANY_INFO.pixKey,
          notes: data.notes || DEFAULT_COMPANY_INFO.notes,
        });
      }
      setIsLoading(false);
    }, (error) => {
      console.warn('Company info listener error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Format clean WhatsApp phone digits for URL (e.g. 55 + digits)
  const getWhatsAppNumber = () => {
    let cleanDigits = companyInfo.phone.replace(/\D/g, '');
    if (!cleanDigits) cleanDigits = '5521999999999';
    // If user typed 10 or 11 digits without 55 country code, append 55
    if (cleanDigits.length === 10 || cleanDigits.length === 11) {
      cleanDigits = '55' + cleanDigits;
    }
    return cleanDigits;
  };

  const getWhatsAppUrl = (customText?: string) => {
    const text = customText || 'Olá! Gostaria de solicitar um orçamento para serviços e suporte em TI.';
    return `https://wa.me/${getWhatsAppNumber()}?text=${encodeURIComponent(text)}`;
  };

  return { companyInfo, isLoading, getWhatsAppNumber, getWhatsAppUrl };
}
