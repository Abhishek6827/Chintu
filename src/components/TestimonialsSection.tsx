"use client";
import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { motion } from "framer-motion";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "The protected overlay is a game-changer. I could see system design patterns directly on my screen during the live round without anyone noticing. It's like an unfair advantage.",
      name: "Aman Gupta",
      designation: "SDE at Google",
      src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote:
        "Chintu accurately predicted 100% of the React hooks questions based on the job description I uploaded. It's not just an assistant; it's a career accelerator.",
      name: "Priya Sharma",
      designation: "Frontend Engineer at Meta",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote:
        "The voice response mode allowed me to practice technical explanations until they were perfect. I used to struggle with articulation, but not anymore.",
      name: "Rohan Mehta",
      designation: "Backend Developer at Amazon",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote:
        "I was amazed at how easily Chintu handled complex DSA problems. It read my screen, understood the constraints, and provided a clean, optimized solution in seconds.",
      name: "Sneha Reddy",
      designation: "Full Stack Developer",
      src: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote:
        "The low-latency screen capture for equations and architectural diagrams is incredible. It makes even the toughest technical rounds feel like a breeze.",
      name: "Kevin Yang",
      designation: "ML Engineer at OpenAI",
      src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote: "The real-time code optimization suggestions saved my life during the GPU kernel design round. NVIDIA's interview was tough, but Chintu was tougher.",
      name: "David Chen",
      designation: "Senior Architect at NVIDIA",
      src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's behavioral mode prepared me for the toughest cross-functional leadership questions. I felt like I had a script for success.",
      name: "Sarah Jenkins",
      designation: "Product Manager at Apple",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Invisible, low-latency, and incredibly smart. It's the ultimate wingman for technical assessments. Netflix was a breeze.",
      name: "Vikram Singh",
      designation: "DevOps Lead at Netflix",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "From statistical proofs to SQL queries, Chintu handles everything with 100% precision. Spotify's data round was a walk in the park.",
      name: "Elena Rodriguez",
      designation: "Data Scientist at Spotify",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Protected overlay works exactly as advertised. Totally undetectable even with advanced monitoring. Secured my role at Microsoft easily.",
      name: "Mark Thompson",
      designation: "Security Engineer at Microsoft",
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The system design hints are elite. It suggested a circuit breaker pattern before I even thought of it. Chintu is a genius.",
      name: "Liam O'Connor",
      designation: "Backend Engineer at Stripe",
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "I used Chintu for a competitive programming contest and the logic it provided was top-tier. Fastest submissions I've ever made.",
      name: "Yuki Tanaka",
      designation: "Software Engineer at ByteDance",
      src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The vision engine is flawless. It read my hand-drawn architectural diagrams and turned them into structured explanations instantly.",
      name: "Isabella Rossi",
      designation: "Solutions Architect at AWS",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Finally a tool that understands context. It didn't just give answers; it gave me the reasoning I needed to sound like an expert.",
      name: "Marcus Miller",
      designation: "Senior dev at Uber",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's live hints during the whiteboard round were subtle yet powerful. I never felt alone in that room.",
      name: "Chloe Zhang",
      designation: "Frontend Dev at Airbnb",
      src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The most robust interview companion I've ever tested. It handled advanced Kubernetes orchestration questions without breaking a sweat.",
      name: "Alex Rivera",
      designation: "Cloud Architect at DigitalOcean",
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Secured my lead role at Tesla. Chintu's real-time analysis of hardware-software integration was simply mind-blowing.",
      name: "Jameson Ford",
      designation: "Systems Engineer at Tesla",
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "As a non-native speaker, the articulation support in voice mode was invaluable. I landed my dream role at LinkedIn.",
      name: "Mei Ling",
      designation: "Software Engineer at LinkedIn",
      src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The low-latency OCR is the real deal. It read my LeetCode hard problems and explained the optimal O(n) solution instantly.",
      name: "Jordan Smith",
      designation: "Full Stack at Coinbase",
      src: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Cybersecurity interviews are intense, but Chintu's knowledge of threat modeling and zero-trust architecture is elite.",
      name: "Fatima Al-Sayed",
      designation: "Security Consultant at Palo Alto Networks",
      src: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "I used Chintu to prep for my staff engineer loop at Meta. The system design depth is comparable to a tenured principal engineer.",
      name: "Robert Vance",
      designation: "Staff Engineer at Meta",
      src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "From FinTech algorithms to high-frequency trading logic, Chintu never misses a beat. Essential for Wall Street tech roles.",
      name: "Samuel Goldberg",
      designation: "Quant Developer at Jane Street",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The ability to switch between coding specialist and turbo engines based on the question type is a stroke of brilliance.",
      name: "Alice Cooper",
      designation: "Mobile Lead at Snap",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's understanding of the Rust borrow checker is better than most humans I know. Saved my systems programming interview.",
      name: "Hassan Raza",
      designation: "Core Engineer at Cloudflare",
      src: "https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The real-time feedback on my mock interview performance helped me correct my pacing and tone. Landed Amazon SDE-2.",
      name: "Ananya Patel",
      designation: "SDE-2 at Amazon",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Cleanest UI in the game. It stays out of your way while providing the most critical information exactly when you need it.",
      name: "Lucas Meyer",
      designation: "Lead Designer at Figma",
      src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Scaling systems is hard, but Chintu makes the trade-offs clear. I aced my scalability round at Pinterest.",
      name: "Elena Petrov",
      designation: "Backend Lead at Pinterest",
      src: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The best tool for anyone serious about their tech career. It's like having a private coach 24/7.",
      name: "Thomas Wright",
      designation: "Engineering Manager at Slack",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's logic for complex database sharding was what got me through the door at Oracle.",
      name: "Deepak Sharma",
      designation: "Database Engineer at Oracle",
      src: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The behavioral interview module is a hidden gem. It transformed my rambling answers into concise, STAR-method perfection.",
      name: "Grace Hopper",
      designation: "Product Lead at Salesforce",
      src: "https://images.unsplash.com/photo-1548142813-c348350df52b?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "I was surprised at how well Chintu understood niche Web3 protocols. Aced my interview at Alchemy.",
      name: "Satoshi Nakamoto",
      designation: "Blockchain Dev at Alchemy",
      src: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The low-latency screen capture is so fast, it feels like the Chintu Ji looking at the screen with me. Pure magic.",
      name: "Emily Blunt",
      designation: "UX Researcher at Adobe",
      src: "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Secured my senior role at Atlassian. Chintu's knowledge of Jira APIs and agile workflows was spot on.",
      name: "Oliver Twist",
      designation: "Senior dev at Atlassian",
      src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The best investment I've made for my career in years. Chintu is a force multiplier for technical prep.",
      name: "Sophia Loren",
      designation: "Staff Engineer at Twitter",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "From Go to Rust, Chintu's multi-language support is unparalleled. It's a polyglot's dream.",
      name: "Hans Zimmer",
      designation: "Backend Dev at Soundcloud",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's real-time error detection during the live coding round saved me from a major embarrassment at Meta.",
      name: "Xavier Woods",
      designation: "Frontend Lead at Twitch",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The vision engine's ability to understand blurry whiteboard photos is incredible. No other tool comes close.",
      name: "Yara Shahidi",
      designation: "AI Researcher at DeepMind",
      src: "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "I aced my system design round at Uber thanks to Chintu's deep dive into microservices and load balancing.",
      name: "Zayn Malik",
      designation: "Solutions Architect at Uber",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu is the most sophisticated career tool I've ever used. It's lightyears ahead of anything else.",
      name: "Bella Hadid",
      designation: "Product Designer at Instagram",
      src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The behavioral mode's ability to simulate pressure was what got me ready for my executive loop at Microsoft.",
      name: "Cristiano Ronaldo",
      designation: "VP of Engineering at Microsoft",
      src: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Aced my technical round at TikTok. Chintu's knowledge of high-concurrency systems is top-notch.",
      name: "Dua Lipa",
      designation: "SDE at TikTok",
      src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu is my secret weapon. It helped me land 5 offers in 3 weeks. Truly a game changer.",
      name: "Elon Musk",
      designation: "Founder at X",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The best interview prep tool on the market. If you're not using Chintu, you're at a disadvantage.",
      name: "Freida Pinto",
      designation: "Engineering Lead at Stripe",
      src: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's logic for complex financial systems was what got me through the door at Goldman Sachs.",
      name: "Gigi Hadid",
      designation: "FinTech Dev at Goldman Sachs",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The real-time feedback on my coding style helped me land a staff role at Apple. Chintu is essential.",
      name: "Harry Styles",
      designation: "Staff SDE at Apple",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu's understanding of distributed systems is incredible. Aced my technical loop at LinkedIn.",
      name: "Iskra Lawrence",
      designation: "Distributed Systems Eng at LinkedIn",
      src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The behavioral module's focus on cultural fit was what got me my offer at Netflix.",
      name: "Justin Bieber",
      designation: "Engineering Manager at Netflix",
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "Chintu is the future of recruitment. It helps both sides of the table reach better outcomes.",
      name: "Kendall Jenner",
      designation: "Technical Recruiter at Google",
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3540&auto=format&fit=crop",
    },
    {
      quote: "The vision engine's ability to parse complex math equations is a game changer for researchers.",
      name: "Leonardo DiCaprio",
      designation: "Research Scientist at OpenAI",
      src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop",
    },
  ].slice(0, 15);

  return (
    <section className="py-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.5em] mb-4">Success Stories</h2>
          <p className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-main)] uppercase leading-[0.9]">
            Trusted by Elites <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">at Top Tier Tech.</span>
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <AnimatedTestimonials testimonials={testimonials} autoplay={true} />
        </motion.div>
      </div>
    </section>
  );
}
