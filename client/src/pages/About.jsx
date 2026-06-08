import React from 'react';
import { HiOutlineHome, HiOutlineShieldCheck, HiOutlineUserGroup, HiOutlineTrendingUp } from 'react-icons/hi';

export default function About() {
  return (
    <div className='bg-slate-50/50 min-h-screen text-slate-700'>
      
      {/* 🚀 1. Hero Section (قسم العنوان الرئيسي) */}
      <div className='bg-white border-b border-slate-100 py-20 px-4 text-center relative overflow-hidden'>
        <div className='max-w-3xl mx-auto flex flex-col gap-4 relative z-10'>
          <span className='text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full inline-block mx-auto'>
            Our Journey
          </span>
          <h1 className='text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight'>
            About <span className='text-blue-600 underline decoration-blue-200 decoration-wavy'>Sahand</span> Estate
          </h1>
          <p className='text-sm md:text-base text-slate-500 max-w-xl mx-auto leading-relaxed mt-2'>
            We are dedicated to making the process of buying, renting, and selling real estate simple, transparent, and seamless for everyone.
          </p>
        </div>
        {/* تأثير خلفية ناعم */}
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-3xl -z-0 pointer-events-none'></div>
      </div>

      {/* 📊 2. Stats Section (لوحة الأرقام والإحصائيات) */}
      <div className='max-w-6xl mx-auto px-4 -mt-10 relative z-20 mb-16'>
        <div className='bg-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y-2 md:divide-y-0 md:divide-x divide-slate-800'>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>12K+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>Properties Ready</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>8K+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>Happy Customers</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>150+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>Expert Agents</span>
          </div>
          <div className='flex flex-col gap-1.5 pt-6 md:pt-0'>
            <span className='text-3xl md:text-4xl font-extrabold text-blue-400'>10+</span>
            <span className='text-xs text-slate-400 font-medium uppercase tracking-wider'>Years Experience</span>
          </div>
        </div>
      </div>

      {/* 🏛️ 3. Our Story Section (قصتنا ورؤيتنا) */}
      <div className='max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16'>
        <div className='flex flex-col gap-5'>
          <h2 className='text-2xl md:text-3xl font-bold text-slate-900 tracking-tight'>
            Our Mission & Vision
          </h2>
          <p className='text-sm text-slate-500 leading-relaxed'>
            Sahand Estate is a leading real estate agency that specializes in helping clients buy, sell, and rent properties in the most desirable neighborhoods. Our team of experienced agents is dedicated to providing exceptional service.
          </p>
          <p className='text-sm text-slate-500 leading-relaxed'>
            Our mission is to help our clients achieve their real estate goals by providing expert advice, personalized service, and a deep understanding of the local market. Whether you are looking to buy, sell, or rent a property, we are here to help you every step of the way.
          </p>
        </div>
        
        {/* بطاقة الرؤية الجانبية */}
        <div className='bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-6'>
          <div className='w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm'>
            <HiOutlineTrendingUp size={24} />
          </div>
          <h3 className='text-xl font-bold text-slate-900'>Why Choose Us?</h3>
          <p className='text-sm text-slate-500 leading-relaxed'>
            Our team of agents has a wealth of experience and knowledge in the real estate industry, and we are committed to providing the highest level of service to our clients. We believe that buying or selling a home should be an exciting and rewarding experience.
          </p>
        </div>
      </div>

      {/* 🛡️ 4. Values Section (قيمنا الأساسية) */}
      <div className='max-w-6xl mx-auto px-4 pb-24'>
        <div className='text-center max-w-xl mx-auto flex flex-col gap-2 mb-12'>
          <h2 className='text-2xl font-bold text-slate-900'>Our Core Values</h2>
          <p className='text-sm text-slate-400'>The pillars that define our service and daily interaction.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* كرت 1 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-600 group-hover:text-white'>
              <HiOutlineShieldCheck size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>Uncompromising Trust</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              We prioritize complete transparency and legal security in every transaction to guarantee your peace of mind.
            </p>
          </div>

          {/* كرت 2 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-emerald-600 group-hover:text-white'>
              <HiOutlineHome size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>Premium Properties</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              Every listing on our platform undergoes rigorous checking to ensure it matches the highest living standards.
            </p>
          </div>

          {/* كرت 3 */}
          <div className='bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4 group'>
            <div className='w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center transition-colors group-hover:bg-amber-600 group-hover:text-white'>
              <HiOutlineUserGroup size={20} />
            </div>
            <h4 className='font-bold text-slate-900 text-base'>Client-Centric Care</h4>
            <p className='text-xs text-slate-500 leading-relaxed'>
              Our relationship doesn't end at signing. We provide end-to-end support for all your maintenance and logistics needs.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}