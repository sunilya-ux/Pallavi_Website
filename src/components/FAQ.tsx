import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'What happens during a coaching session?',
      answer: 'Each session is personalized to your needs. We focus on identifying your challenges, clarifying your goals, and creating actionable steps toward building your business. Sessions include guided exercises, mindset work, and practical strategies to help you transition from employee to entrepreneur. You\'ll also receive worksheets and homework to reinforce your progress.',
    },
    {
      question: 'How many sessions do I need?',
      answer: 'Most clients see significant transformation within 3-6 months. The journey varies based on your starting point and goals. During our discovery call, we\'ll assess your situation and recommend a timeline. Many clients continue beyond the initial program because they love the ongoing support and accountability.',
    },
    {
      question: 'Is coaching confidential?',
      answer: 'Absolutely. Everything you share during our sessions is completely confidential. I maintain strict professional ethics and privacy standards. Your trust is paramount, and you can speak freely about your career concerns, personal challenges, and business aspirations without any worry.',
    },
    {
      question: 'Do you guarantee results?',
      answer: 'I guarantee 100% dedication and proven strategies that have worked for 5000+ women. However, your success depends on your commitment to implementing the tools and taking action. Clients who actively participate, complete assignments, and take consistent steps see remarkable transformations. This is a partnership where your effort meets my expertise.',
    },
    {
      question: 'What if I\'m not sure coaching is right for me?',
      answer: 'That\'s completely normal! That\'s why I offer a free 20-minute discovery call. We\'ll discuss your situation, challenges, and goals with no pressure or obligation. You\'ll get clarity on whether coaching is the right step for you, and I\'ll be honest about whether I can help. Many clients were skeptical at first but found coaching to be exactly what they needed.',
    },
    {
      question: 'Do you provide WhatsApp support?',
      answer: 'Yes! Continuous support is a key part of my coaching. Between sessions, you\'ll have access to me via WhatsApp for check-ins, quick questions, and accountability. This ongoing connection ensures you stay motivated and on track. Many clients say this support makes all the difference in their transformation journey.',
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know about starting your transformation journey
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border-2 border-slate-100 hover:border-emerald-200 transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between gap-4 text-left group"
              >
                <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-6 h-6 text-emerald-600 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-8 pb-6">
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-2xl p-8 md:p-12 text-center border border-emerald-100">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-lg text-slate-600 mb-6">
            Book a free discovery call and I'll answer all your questions personally
          </p>
          <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105">
            Schedule Free Call
          </button>
        </div>
      </div>
    </section>
  );
}
