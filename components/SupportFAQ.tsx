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
      icon: <Truck className="w-5 h-5 text-blue-600" />,
      question: getString('support.faq.deliveryTime.question'),
      answer: getString('support.faq.deliveryTime.answer')
    },
    {
      id: 'returns',
      icon: <RefreshCw className="w-5 h-5 text-green-600" />,
      question: getString('support.faq.returns.question'),
      answer: getString('support.faq.returns.answer')
    },
    {
      id: 'warranty',
      icon: <Shield className="w-5 h-5 text-purple-600" />,
      question: getString('support.faq.warranty.question'),
      answer: getString('support.faq.warranty.answer')
    },
    {
      id: 'payment',
      icon: <CreditCard className="w-5 h-5 text-orange-600" />,
      question: getString('support.faq.payment.question'),
      answer: getString('support.faq.payment.answer')
    },
    {
      id: 'tracking',
      icon: <Package className="w-5 h-5 text-indigo-600" />,
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
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
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
          <p className="text-white/90 mt-2">{getString('support.subtitle')}</p>
        </div>

        <div className="flex flex-col lg:flex-row max-h-[calc(90vh-120px)]">
          {/* FAQ Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto border-r border-gray-100">
            <h3 className="text-xl font-medium text-gray-900 mb-6">{getString('support.faq.title')}</h3>
            
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(item.id)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span className="font-medium text-gray-900">{item.question}</span>
                    </div>
                    {expandedFAQ === item.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                  
                  {expandedFAQ === item.id && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto">
            <h3 className="text-xl font-medium text-gray-900 mb-6">{getString('support.contact.title')}</h3>
            
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getString('support.contact.subjectLabel')}
                </label>
                <select
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                >
                  <option value="">{getString('support.contact.selectSubject')}</option>
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getString('support.contact.emailLabel')}
                </label>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
                  placeholder={getString('support.contact.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getString('support.contact.messageLabel')}
                </label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
                  placeholder={getString('support.contact.messagePlaceholder')}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>{getString('support.contact.sendWhatsApp')}</span>
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {getString('support.contact.whatsappInfo')}
                  <br />
                  <span className="font-medium text-gray-900">+33 750 883227</span>
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