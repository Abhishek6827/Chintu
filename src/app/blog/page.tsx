"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { Meteors } from '@/components/magicui/meteors';
import GlobalFooter from '@/components/GlobalFooter';

const blogPosts = [
  {
    id: 1,
    title: "Introducing Chintu Desktop App",
    excerpt: "Experience the power of Chintu Intelligence with our native desktop application. Seamless integration, real-time feedback, and stealth mode for ultimate interview preparation.",
    date: "May 2026",
    readTime: "3 min read",
    category: "Product",
    gradient: "from-indigo-500 to-purple-500",
    screenshot: "/blog_desktop_app.png"
  },
  {
    id: 2,
    title: "Mastering Technical Interviews with AI",
    excerpt: "Learn how Chintu Intelligence helps you crack FAANG interviews with real-time feedback and strategic insights.",
    date: "May 2024",
    readTime: "5 min read",
    category: "Strategy",
    gradient: "from-indigo-500 to-purple-500",
    screenshot: "/blog_mastering_interviews.png"
  },
  {
    id: 3,
    title: "The Future of AI-Powered Interview Prep",
    excerpt: "Explore how artificial intelligence is revolutionizing the way candidates prepare for technical interviews.",
    date: "April 2024",
    readTime: "4 min read",
    category: "Technology",
    gradient: "from-purple-500 to-pink-500",
    screenshot: "/blog_future_ai_prep.png"
  },
  {
    id: 4,
    title: "Elite vs Premium: Choosing Your Path",
    excerpt: "A comprehensive guide to understanding the differences between Chintu's subscription tiers and which one fits your goals.",
    date: "March 2024",
    readTime: "6 min read",
    category: "Guide",
    gradient: "from-pink-500 to-orange-500",
    screenshot: "/blog_elite_vs_premium_plan.png"
  },
  {
    id: 5,
    title: "Energy Sync: Maximizing Your Credits",
    excerpt: "Tips and tricks to optimize your Energy Sync credits and get the most out of every session.",
    date: "February 2024",
    readTime: "3 min read",
    category: "Tips",
    gradient: "from-orange-500 to-yellow-500",
    screenshot: "/blog_energy_sync_credits_tips.png"
  },
  {
    id: 6,
    title: "Building Your AI Profile",
    excerpt: "How to customize your AI profile in Chintu to receive personalized interview questions tailored to your experience.",
    date: "January 2024",
    readTime: "5 min read",
    category: "Tutorial",
    gradient: "from-yellow-500 to-green-500",
    screenshot: "/blog_building_ai_profile_tutorial.png"
  },
  {
    id: 7,
    title: "Chintu v2.5: What's New",
    excerpt: "Discover the latest features in Chintu Intelligence v2.5 including Hyper-Intelligence mode and enhanced analytics.",
    date: "December 2023",
    readTime: "7 min read",
    category: "Updates",
    gradient: "from-green-500 to-teal-500",
    screenshot: "/blog_chintu_v2_5_updates.png"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] selection:bg-indigo-500/20 flex flex-col relative overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Meteors number={20} />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/20 blur-[120px] rounded-full animate-pulse [animation-delay:700ms]" />
      </div>

      <main className="relative z-10 flex-1">
        {/* Header */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4 sm:mb-6">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400" />
              <span className="text-[8px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Knowledge Base</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter uppercase leading-[0.9] mb-4 sm:mb-6 px-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Chintu</span> Blog
            </h1>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-[var(--text-dim)] font-bold uppercase tracking-wider sm:tracking-widest max-w-2xl mx-auto px-4">
              Insights, strategies, and updates to elevate your interview game
            </p>
          </motion.div>
        </section>

        {/* Blog Grid */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {blogPosts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative bg-[var(--panel-bg)] border border-[var(--glass-border)] rounded-2xl sm:rounded-3xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10"
                >
                  {post.screenshot ? (
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <Image
                        src={post.screenshot}
                        alt={post.title}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent opacity-30" />
                    </div>
                  ) : (
                    <div className={`h-24 sm:h-32 bg-gradient-to-br ${post.gradient} opacity-20 group-hover:opacity-30 transition-opacity`} />
                  )}
                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-indigo-400">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-black uppercase tracking-tight mb-2 sm:mb-3 text-[var(--text-main)] group-hover:text-indigo-500 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-dim)] font-bold leading-relaxed mb-4 sm:mb-6 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-[var(--glass-border)] gap-2 sm:gap-0">
                      <div className="flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-[var(--text-dim)] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {post.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest group-hover:gap-3 transition-all self-start sm:self-auto">
                        Read <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-24 px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl sm:rounded-[3rem] p-6 sm:p-8 md:p-12 lg:p-16"
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-400 mx-auto mb-4 sm:mb-6 animate-pulse" />
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-3 sm:mb-4 text-[var(--text-main)] px-2">
              Ready to Elevate Your Interview Strategy?
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[var(--text-dim)] font-bold uppercase tracking-wider sm:tracking-widest mb-6 sm:mb-8 max-w-xl mx-auto px-4">
              Join thousands of candidates who&apos;ve mastered technical interviews with Chintu Intelligence
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 sm:gap-3 bg-indigo-600 text-white text-[10px] sm:text-[11px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all"
            >
              Get Started Free <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </motion.div>
        </section>
      </main>

      <GlobalFooter />
    </div>
  );
}
