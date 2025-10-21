'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, MessageCircle, Truck, Shield, RefreshCw, CreditCard, Package } from 'lucide-react';
import { getString } from '../lib/utils';

interface SupportFAQProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FAQItem {
  id: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
}

const SupportFAQ: React.FC<SupportFAQProps> = ({ isOpen, onClose }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: ''
  });

  const faqItems: FAQItem[] = [
    {
      id: 'delivery',
      icon: <Truck className="w-5 h-5 text-[#FF9900]" />,
      question: getString('support.faq.deliveryTime.question'),
      answer: getString('support.faq.deliveryTime.answer')
    },
    {
      id: 'returns',
      icon: <RefreshCw className="w-5 h-5 text-[#FF9900]" />,
      question: getString('support.faq.returns.question'),
      answer: getString('support.faq.returns.answer')
    },
    {
      id: 'warranty',
      icon: <Shield className="w-5 h-5 text-[#FF9900]" />,
      question: getString('support.faq.warranty.question'),
      answer: getString('support.faq.warranty.answer')
    },
    {
      id: 'payment',
      icon: <CreditCard className="w-5 h-5 text-[#FF9900]" />,
      question: getString('support.faq.payment.question'),
      answer: getString('support.faq.payment.answer')
    },
    {
      id: 'tracking',
      icon: <Package className="w-5 h-5 text-[#FF9900]" />,
      question: getString('support.faq.tracking.question'),
      answer: getString('support.faq.tracking.answer')
    }
  ];

  const subjectOptions = [
    { value: 'order', label: getString('support.contact.subjects.order') },
    { value: 'refund', label: getString('support.contact.subjects.refund') },
    { value: 'exchange', label: getString('support.contact.subjects.exchange') },
    { value: 'quality', label: getString('support.contact.subjects.quality') },
    { value: 'delivery', label: getString('support.contact.subjects.delivery') },
    { value: 'other', label: getString('support.contact.subjects.other') }
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subject = subjectOptions.find(opt => opt.value === contactForm.subject)?.label || contactForm.subject;
    const message = `${getString('support.contact.whatsappTemplate')}\n\n${getString('support.contact.subject')}: ${subject}\n${getString('support.contact.email')}: ${contactForm.email}\n\n${getString('support.contact.message')}:\n${contactForm.message}`;
    
    const whatsappUrl = `https://wa.me/33750883227?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Reset form
    setContactForm({ subject: '', message: '', email: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#232F3E] to-[#37475A] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <h2 className="text-2xl font-light">{getString('support.title')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-[#DDD6C1] mt-2">{getString('support.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-120px)]">
          {/* FAQ Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-[#DDD6C1]">
            <h3 className="text-xl font-medium text-[#232F3E] mb-6">{getString('support.faq.title')}</h3>
            
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className="border border-[#DDD6C1] rounded-xl overflow-hidden hover:border-[#FF9900] transition-colors">
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-[#F7F5F0] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium text-[#232F3E]">{item.question}</span>
                    </div>
                    {expandedFAQ === item.id ? (
                      <ChevronUp className="w-5 h-5 text-[#FF9900]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#FF9900]" />
                    )}
                  </button>
                  
                  {expandedFAQ === item.id && (
                    <div className="p-4 bg-[#F7F5F0] border-t border-[#DDD6C1]">
                      <p className="text-[#232F3E] leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <h3 className="text-xl font-medium text-[#232F3E] mb-6">{getString('support.contact.title')}</h3>
            
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#232F3E] mb-2">
                  {getString('support.contact.subjectLabel')}
                </label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#DDD6C1] rounded-xl focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
                >
                  <option value="">{getString('support.contact.subjectPlaceholder')}</option>
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#232F3E] mb-2">
                  {getString('support.contact.emailLabel')}
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-[#DDD6C1] rounded-xl focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all"
                  placeholder={getString('support.contact.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#232F3E] mb-2">
                  {getString('support.contact.messageLabel')}
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-[#DDD6C1] rounded-xl focus:ring-2 focus:ring-[#FF9900] focus:border-transparent transition-all resize-none"
                  placeholder={getString('support.contact.messagePlaceholder')}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#FF9900] hover:bg-[#E8890E] text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{getString('support.contact.sendWhatsApp')}</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-[#232F3E]">
                  {getString('support.contact.whatsappResponse')}
                  <br />
                  <span className="font-medium text-[#FF9900]">+33 750 883227</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportFAQ; 