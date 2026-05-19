"use client";

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, HelpCircle, ArrowRight, Zap, Shield, CreditCard } from 'lucide-react';

const Meteors = dynamic(() => import('@/components/magicui/meteors').then(mod => mod.Meteors), { ssr: false });

const faqData = [
  {
    category: "Getting Started",
    icon: <Sparkles className="w-5 h-5" />,
    questions: [
      {
        q: "What is Chintu Ji?",
        a: "Chintu Ji is an AI-powered interview preparation platform that helps you master technical interviews through real-time feedback, strategic insights, and personalized question generation based on your experience level and target companies."
      },
      {
        q: "How do I get started?",
        a: "Simply sign up for a free account, complete your AI profile with your experience and target roles, and start practicing with our intelligent interview system. Free users get limited credits to explore the platform."
      },
      {
        q: "What are Energy Sync credits?",
        a: "Energy Sync credits are the currency used in Chintu. Each interview session consumes credits based on complexity. Premium and Elite plans include monthly credit allowances, while free users can purchase additional credits as needed."
      }
    ]
  },
  {
    category: "Pricing & Plans",
    icon: <CreditCard className="w-5 h-5" />,
    questions: [
      {
        q: "What&apos;s the difference between Free, Premium, and Elite?",
        a: "Free gives you basic access with limited credits. Premium unlocks advanced features, more credits, and priority support. Elite includes unlimited credits, exclusive features, Hyper-Intelligence mode, and dedicated account management."
      },
      {
        q: "Can I upgrade or downgrade my plan?",
        a: "Yes, you can change your plan at any time from your subscription portal. Upgrades take effect immediately, and downgrades apply at the end of your current billing cycle."
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards, debit cards, and UPI (for Indian users). All payments are processed securely through Razorpay or Stripe depending on your region."
      }
    ]
  },
  {
    category: "Features & Usage",
    icon: <Zap className="w-5 h-5" />,
    questions: [
      {
        q: "How does the AI generate interview questions?",
        a: "Our AI analyzes your profile, target companies, and experience level to generate relevant technical questions. It adapts to your performance, adjusting difficulty and focus areas to optimize your preparation."
      },
      {
        q: "Can I use Chintu for different types of interviews?",
        a: "Yes! Chintu supports various interview types including system design, coding, behavioral, and domain-specific interviews. Customize your profile to match your target role."
      },
      {
        q: "Is my data secure?",
        a: "Absolutely. We use industry-standard encryption and security practices. Your interview data is private and never shared with third parties. See our Privacy Policy for details."
      }
    ]
  },
  {
    category: "Account & Support",
    icon: <Shield className="w-5 h-5" />,
    questions: [
      {
        q: "How do I reset my password?",
        a: "Click &apos;Forgot Password&apos; on the sign-in page, and we&apos;ll send a reset link to your registered email. Follow the instructions to create a new password."
      },
      {
        q: "How do I contact support?",
        a: "Premium and Elite users have access to priority support via the Support page. Free users can reach us through our contact form, and we typically respond within 24-48 hours."
      },
      {
        q: "Can I cancel my subscription?",
        a: "Yes, you can cancel anytime from your subscription portal. Your access continues until the end of your current billing period. No refunds are provided for partial months."
      }
    ]
  }
];

export default function FAQPage() {
  const [openCategory, setOpenCategory] = useState<number | null>(null);
  const [openQuestion, setOpenQuestion] = useState<{ category: number; question: number } | null>(null);

  const toggleCategory = (index: number) => {
    setOpenCategory(openCategory === index ? null : index);
    setOpenQuestion(null);
  };

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    setOpenQuestion(
      openQuestion?.category === categoryIndex && openQuestion?.question === questionIndex
        ? null
        : { category: categoryIndex, question: questionIndex }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-teal-500/20 flex flex-col relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Meteors number={20} />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
      </div>

      <main className="relative z-10 flex-1">
        {/* Header */}
        <section className="py-16 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-full mb-6">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-[0.3em]">Help Center</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-500">Frequently</span> Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-dim)] font-bold uppercase tracking-widest max-w-2xl mx-auto">
              Everything you need to know about Chintu Ji
            </p>
          </motion.div>
        </section>

        {/* FAQ Accordion */}
        <section className="px-6 pb-24">
          <div className="max-w-4xl mx-auto space-y-4">
            {faqData.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className="bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-3xl overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryIndex)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[var(--glass-bg)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400">
                      {category.icon}
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--text-main)]">
                      {category.category}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: openCategory === categoryIndex ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[var(--text-dim)]" />
                  </motion.div>
                </button>

                {/* Questions */}
                <AnimatePresence>
                  {openCategory === categoryIndex && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 space-y-2">
                        {category.questions.map((item, questionIndex) => (
                          <div
                            key={questionIndex}
                            className="bg-[var(--bg-app)] border border-[var(--glass-border)] rounded-2xl overflow-hidden"
                          >
                            <button
                              onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                              className="w-full px-5 py-4 flex items-start justify-between text-left"
                            >
                              <span className="text-xs font-bold text-[var(--text-main)] pr-4 leading-relaxed">
                                {item.q}
                              </span>
                              <motion.div
                                animate={{ rotate: openQuestion?.category === categoryIndex && openQuestion?.question === questionIndex ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-shrink-0 mt-1"
                              >
                                <ChevronDown className="w-4 h-4 text-[var(--text-dim)]" />
                              </motion.div>
                            </button>
                            <AnimatePresence>
                              {openQuestion?.category === categoryIndex && openQuestion?.question === questionIndex && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 pb-4 pt-0">
                                    <p className="text-xs text-[var(--text-dim)] font-medium leading-relaxed">
                                      {item.a}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-teal-500/10 to-teal-500/10 border border-teal-500/20 rounded-[3rem] p-12 sm:p-16"
          >
            <HelpCircle className="w-12 h-12 text-teal-400 mx-auto mb-6 animate-pulse" />
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4 text-[var(--text-main)]">
              Still Have Questions?
            </h2>
            <p className="text-[var(--text-dim)] font-bold uppercase tracking-widest mb-8 max-w-xl mx-auto">
              Our support team is here to help you succeed
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/support"
                className="inline-flex items-center gap-3 bg-teal-600 text-white text-[11px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl shadow-2xl shadow-teal-500/40 hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all"
              >
                Contact Support <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 bg-[var(--panel-bg)] border-2 border-[var(--glass-border)] text-teal-400 text-[11px] font-black uppercase tracking-[0.2em] px-10 py-5 rounded-2xl hover:border-teal-500 hover:bg-teal-500/10 hover:scale-105 active:scale-95 transition-all"
              >
                View Plans <Zap className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

    </div>
  );
}
