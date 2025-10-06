'use client';

import React from 'react';
import { getString } from '../lib/utils';
import { 
  Shield, 
  Truck, 
  Headphones, 
  Award, 
  Check, 
  X,
  Star,
  Clock,
  Heart,
  Sparkles
} from 'lucide-react';

const WhyChooseUs: React.FC = () => {
  const advantages = [
    {
      icon: Award,
      title: getString('homepage.whyChoose.advantage1.title'),
      description: getString('homepage.whyChoose.advantage1.description'),
      gradient: 'from-amber-50 to-yellow-50',
      iconBg: 'bg-gradient-to-br from-amber-100 to-yellow-100',
      iconColor: 'text-amber-600'
    },
    {
      icon: Truck,
      title: getString('homepage.whyChoose.advantage2.title'),
      description: getString('homepage.whyChoose.advantage2.description'),
      gradient: 'from-blue-50 to-sky-50',
      iconBg: 'bg-gradient-to-br from-blue-100 to-sky-100',
      iconColor: 'text-blue-600'
    },
    {
      icon: Headphones,
      title: getString('homepage.whyChoose.advantage3.title'),
      description: getString('homepage.whyChoose.advantage3.description'),
      gradient: 'from-emerald-50 to-green-50',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-green-100',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Shield,
      title: getString('homepage.whyChoose.advantage4.title'),
      description: getString('homepage.whyChoose.advantage4.description'),
      gradient: 'from-violet-50 to-purple-50',
      iconBg: 'bg-gradient-to-br from-violet-100 to-purple-100',
      iconColor: 'text-violet-600'
    }
  ];

  const comparisonData = [
    {
      feature: getString('homepage.whyChoose.comparison.quality'),
      us: getString('homepage.whyChoose.comparison.quality'),
      others: getString('homepage.whyChoose.comparison.standardQuality'),
      usGood: true
    },
    {
      feature: getString('homepage.whyChoose.comparison.fastShipping'),
      us: getString('homepage.whyChoose.comparison.fastShipping'),
      others: getString('homepage.whyChoose.comparison.slowShipping'),
      usGood: true
    },
    {
      feature: getString('homepage.whyChoose.comparison.warranty'),
      us: getString('homepage.whyChoose.comparison.warranty'),
      others: getString('homepage.whyChoose.comparison.limitedWarranty'),
      usGood: true
    },
    {
      feature: getString('homepage.whyChoose.comparison.support'),
      us: getString('homepage.whyChoose.comparison.support'),
      others: getString('homepage.whyChoose.comparison.basicSupport'),
      usGood: true
    }
  ];

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-slate-50 via-white to-stone-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-slate-100/20 to-stone-100/10 rounded-full -translate-y-64 translate-x-64 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-stone-100/30 to-slate-100/20 rounded-full translate-y-48 -translate-x-48 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Section Header */}
        <div className="text-center mb-20 lg:mb-24">
          <div className="inline-flex items-center bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-slate-200/50 mb-8 hover:shadow-2xl transition-all duration-300">
            <Sparkles className="w-5 h-5 text-slate-600 mr-3" />
            <span className="text-sm font-bold text-slate-800 tracking-wider uppercase">{getString('homepage.whyChoose.advantage1.title')}</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-extralight text-slate-900 mb-8 tracking-tighter leading-tight">
            {getString('homepage.whyChoose.title')}
          </h2>
          <p className="text-xl lg:text-2xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light tracking-wide">
            {getString('homepage.whyChoose.subtitle')}
          </p>
        </div>

        {/* Premium Advantages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-24">
          {advantages.map((advantage, index) => {
            const IconComponent = advantage.icon;
            return (
              <div 
                key={index}
                className={`group text-center p-8 lg:p-10 rounded-3xl bg-gradient-to-br ${advantage.gradient} border border-slate-200/60 hover:border-slate-300/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden`}
                style={{
                  animationDelay: `${index * 150}ms`
                }}
              >
                {/* Subtle shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className={`relative w-20 h-20 ${advantage.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                  <IconComponent className={`w-10 h-10 ${advantage.iconColor}`} />
                </div>
                <h3 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-4 tracking-wide">
                  {advantage.title}
                </h3>
                <p className="text-slate-600 leading-relaxed font-light text-lg">
                  {advantage.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Premium Comparison Table */}
        <div className="bg-gradient-to-br from-white via-slate-50/50 to-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-10 lg:p-12 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-transparent to-slate-700/50"></div>
            <div className="relative">
              <h3 className="text-3xl lg:text-4xl font-extralight mb-6 tracking-wide">
                {getString('homepage.whyChoose.comparison.title')}
              </h3>
              <p className="text-slate-300 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                {getString('homepage.whyChoose.comparison.subtitle')}
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200/60">
                    <th className="text-left py-6 px-8 text-xl font-semibold text-slate-900 tracking-wide">
                      {getString('homepage.whyChoose.comparison.criteria')}
                    </th>
                    <th className="text-center py-6 px-8">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                          <Star className="w-6 h-6 text-white fill-current" />
                        </div>
                        <span className="text-xl font-semibold text-slate-900 tracking-wide">
                          {getString('homepage.whyChoose.comparison.us')}
                        </span>
                      </div>
                    </th>
                    <th className="text-center py-6 px-8">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-300 to-slate-400 rounded-2xl flex items-center justify-center shadow-lg">
                          <Clock className="w-6 h-6 text-slate-600" />
                        </div>
                        <span className="text-xl font-semibold text-slate-600 tracking-wide">
                          {getString('homepage.whyChoose.comparison.others')}
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-slate-100/80 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent transition-all duration-300">
                      <td className="py-8 px-8 font-semibold text-slate-900 text-lg tracking-wide">
                        {row.feature}
                      </td>
                      <td className="py-8 px-8 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center shadow-lg">
                            <Check className="w-6 h-6 text-emerald-600" />
                          </div>
                          <span className="text-slate-900 font-semibold text-lg tracking-wide">{row.us}</span>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-center">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-rose-100 rounded-xl flex items-center justify-center shadow-lg">
                            <X className="w-6 h-6 text-red-600" />
                          </div>
                          <span className="text-slate-600 font-medium text-lg">{row.others}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Premium Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 border border-slate-600/20 backdrop-blur-sm">
            <Heart className="w-6 h-6 fill-current text-rose-400" />
            <span className="tracking-wide">{getString('homepage.whyChoose.cta')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs; 