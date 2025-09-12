'use client';

import React from 'react';
import Link from 'next/link';
import { getString } from '../lib/utils';
import { ArrowRight, Heart, Award, Users, Sparkles, Star } from 'lucide-react';

const AboutSection: React.FC = () => {
  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-slate-50/30 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-gradient-to-br from-rose-100/30 to-pink-100/20 rounded-full translate-x-48 blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-[350px] h-[350px] bg-gradient-to-tr from-amber-100/20 to-yellow-100/30 rounded-full -translate-x-32 blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Section Header */}
        <div className="text-center mb-20 lg:mb-24">
          <div className="inline-flex items-center bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl border border-slate-200/50 mb-8 hover:shadow-2xl transition-all duration-300">
            <Sparkles className="w-5 h-5 text-slate-600 mr-3" />
            <span className="text-sm font-bold text-slate-800 tracking-wider uppercase">Notre Histoire</span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-extralight text-slate-900 mb-8 tracking-tighter leading-tight">
            {getString('homepage.about.title')}
          </h2>
          <p className="text-xl lg:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
            {getString('homepage.about.subtitle')}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center mb-24">
          {/* Enhanced Text Content */}
          <div className="space-y-10">
            <div className="space-y-8">
              <p className="text-lg lg:text-xl text-slate-700 leading-relaxed font-light tracking-wide">
                {getString('homepage.about.story1')}
              </p>
              <p className="text-lg lg:text-xl text-slate-700 leading-relaxed font-light tracking-wide">
                {getString('homepage.about.story2')}
              </p>
              <p className="text-lg lg:text-xl text-slate-700 leading-relaxed font-light tracking-wide">
                {getString('homepage.about.story3')}
              </p>
            </div>

            {/* Premium Call to Action */}
            <div className="pt-8">
              <Link 
                href="/categories" 
                className="group inline-flex items-center gap-4 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white px-10 py-5 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-500 hover:scale-105 tracking-wide border border-slate-600/20 backdrop-blur-sm"
              >
                <span className="relative">
                  {getString('homepage.about.viewProducts')}
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Premium Visual Content */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <div className="aspect-[4/3] bg-gradient-to-br from-rose-50 via-white to-amber-50 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Enhanced background patterns */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-100/20 via-transparent to-amber-100/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-200/30 to-pink-200/20 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-amber-200/30 to-yellow-200/20 rounded-full translate-y-14 -translate-x-14 blur-2xl"></div>
                
                {/* Main visual element */}
                <div className="relative w-64 h-64 bg-gradient-to-br from-white via-slate-50 to-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white/60 backdrop-blur-sm group-hover:scale-105 transition-all duration-500">
                  <div className="text-8xl animate-float">🧸</div>
                  
                  {/* Floating sparkles */}
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-400/30"></div>
                  <div className="absolute top-1/4 -left-3 w-3 h-3 bg-rose-400 rounded-full animate-pulse delay-500 shadow-lg shadow-rose-400/30"></div>
                  <div className="absolute -bottom-1 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-1000 shadow-lg shadow-blue-400/30"></div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Floating Elements */}
            <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-rose-200/40 to-pink-200/30 rounded-2xl animate-float shadow-lg backdrop-blur-sm border border-white/30"></div>
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-amber-200/40 to-yellow-200/30 rounded-2xl animate-float delay-1000 shadow-lg backdrop-blur-sm border border-white/30"></div>
            <div className="absolute top-1/2 -right-10 w-12 h-12 bg-gradient-to-br from-blue-200/40 to-sky-200/30 rounded-2xl animate-float delay-500 shadow-lg backdrop-blur-sm border border-white/30"></div>
          </div>
        </div>

        {/* Premium Brand Values */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          <div className="group text-center p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-rose-50 via-white to-rose-50/50 border border-slate-200/60 hover:border-slate-300/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg">
              <Heart className="w-10 h-10 text-rose-600" />
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-4 tracking-wide">Passion</h3>
            <p className="text-slate-600 leading-relaxed font-light text-lg">
              Créées avec amour pour accompagner les plus beaux moments de l&apos;enfance
            </p>
          </div>

          <div className="group text-center p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/50 border border-slate-200/60 hover:border-slate-300/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-20 h-20 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg">
              <Award className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-4 tracking-wide">Qualité</h3>
            <p className="text-slate-600 leading-relaxed font-light text-lg">
              Matériaux premium et finitions soignées pour une durabilité exceptionnelle
            </p>
          </div>

          <div className="group text-center p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50/50 border border-slate-200/60 hover:border-slate-300/60 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-100 to-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-all duration-500 shadow-lg">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-4 tracking-wide">Confiance</h3>
            <p className="text-slate-600 leading-relaxed font-light text-lg">
              Plus de 15 000 familles nous font confiance pour leurs achats
            </p>
          </div>
        </div>

        {/* Premium Stats Section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 bg-gradient-to-r from-white via-slate-50 to-white backdrop-blur-sm rounded-2xl px-10 py-6 shadow-xl border border-slate-200/50 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-amber-400 fill-current" />
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">4.8/5</div>
                <div className="text-sm text-slate-600 font-medium">Satisfaction</div>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-rose-400 fill-current" />
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">15k+</div>
                <div className="text-sm text-slate-600 font-medium">Clients</div>
              </div>
            </div>
            <div className="w-px h-12 bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              <div className="text-left">
                <div className="text-2xl font-bold text-slate-900">2020</div>
                <div className="text-sm text-slate-600 font-medium">Fondé en</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection; 