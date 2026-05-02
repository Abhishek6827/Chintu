import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";

const reviews = [
  {
    name: "Abhishek",
    username: "@dev_abhishek",
    body: "Just used Chintu for my Uber interview. The screen reading is magic. Cleared it!",
    img: "https://avatar.vercel.sh/abhishek",
  },
  {
    name: "Priya",
    username: "@tech_queen",
    body: "100% success rate with Chintu's JD analysis. Meta here I come! Best tool ever.",
    img: "https://avatar.vercel.sh/priya",
  },
  {
    name: "Rohan",
    username: "@backend_ninja",
    body: "The ghost mode is actually undetectable. Proctoring didn't stand a chance. Highly recommend.",
    img: "https://avatar.vercel.sh/rohan",
  },
  {
    name: "Sneha",
    username: "@frontend_guru",
    body: "Best $29 I ever spent. Got a $150k offer thanks to the real-time snippets and live hints.",
    img: "https://avatar.vercel.sh/sneha",
  },
  {
    name: "Kevin",
    username: "@system_designer",
    body: "High-level design hints are spot on. It read my diagrams perfectly. Essential for senior roles.",
    img: "https://avatar.vercel.sh/kevin",
  },
  {
    name: "Anjali",
    username: "@interview_prep",
    body: "Chintu is the GOAT. No more anxiety during live coding. It felt like a pair programming session.",
    img: "https://avatar.vercel.sh/anjali",
  },
  { name: "Arjun", username: "@arjun_codes", body: "Chintu is a beast. Cleared 3 rounds in 2 days. 🚀", img: "https://avatar.vercel.sh/arjun" },
  { name: "Sofia", username: "@sofia_tech", body: "The UI is so clean, and the responses are instant. Worth every penny.", img: "https://avatar.vercel.sh/sofia" },
  { name: "Ahmed", username: "@ahmed_dev", body: "I was skeptical, but the vision engine is actually insane. 10/10.", img: "https://avatar.vercel.sh/ahmed" },
  { name: "Mia", username: "@mia_design", body: "Helping me bridge the gap between junior and senior roles. Amazing.", img: "https://avatar.vercel.sh/mia" },
  { name: "Lucas", username: "@lucas_backend", body: "Python, Go, Rust - Chintu knows it all. My new secret weapon.", img: "https://avatar.vercel.sh/lucas" },
  { name: "Zara", username: "@zara_growth", body: "Behavioral questions are no longer a nightmare. Thanks Chintu!", img: "https://avatar.vercel.sh/zara" },
  { name: "Tom", username: "@tom_hacks", body: "Ghost mode is legit. Didn't trigger any alerts. Perfect.", img: "https://avatar.vercel.sh/tom" },
  { name: "Nina", username: "@nina_apps", body: "Got my dream job at Meta. Chintu was the edge I needed.", img: "https://avatar.vercel.sh/nina" },
  { name: "Leo", username: "@leo_builds", body: "System design made easy. The diagrams are crystal clear now.", img: "https://avatar.vercel.sh/leo" },
  { name: "Hana", username: "@hana_cloud", body: "AWS certs? Done. Technical rounds? Done. Chintu is key.", img: "https://avatar.vercel.sh/hana" },
  { name: "Chris", username: "@chris_infra", body: "Kubernetes questions? Chintu handled them like a pro.", img: "https://avatar.vercel.sh/chris" },
  { name: "Sita", username: "@sita_ui", body: "Tailwind, React, Next.js - the suggestions are always spot on.", img: "https://avatar.vercel.sh/sita" },
  { name: "Omar", username: "@omar_sec", body: "Security protocols were a breeze. Chintu is incredibly fast.", img: "https://avatar.vercel.sh/omar" },
  { name: "Eva", username: "@eva_ml", body: "Pytorch and TensorFlow experts would be proud of Chintu's logic.", img: "https://avatar.vercel.sh/eva" },
  { name: "Jack", username: "@jack_devops", body: "CI/CD pipelines explained perfectly. Instant success.", img: "https://avatar.vercel.sh/jack" },
  { name: "Maya", username: "@maya_web3", body: "Smart contracts and solidity? No problem for Chintu.", img: "https://avatar.vercel.sh/maya" },
  { name: "Ken", username: "@ken_soft", body: "Best investment in my career so far. Highly recommend.", img: "https://avatar.vercel.sh/ken" },
  { name: "Lara", username: "@lara_qa", body: "Testing logic is solid. Chintu catches every edge case.", img: "https://avatar.vercel.sh/lara" },
  { name: "Ben", username: "@ben_mobile", body: "Swift and Kotlin suggestions were perfect. Got the job!", img: "https://avatar.vercel.sh/ben" },
  { name: "Ruby", username: "@ruby_fullstack", body: "The most versatile AI assistant I've ever used. 💎", img: "https://avatar.vercel.sh/ruby" },
  { name: "Sasha", username: "@sasha_code", body: "Chintu's logic for complex algorithms is better than most seniors.", img: "https://avatar.vercel.sh/sasha" },
  { name: "Ivan", username: "@ivan_dev", body: "Secured a role at Yandex. Chintu's competitive mode is ⚡.", img: "https://avatar.vercel.sh/ivan" },
  { name: "Aria", username: "@aria_ux", body: "Even the UI feedback is helpful. Chintu is a total package.", img: "https://avatar.vercel.sh/aria" },
  { name: "Noah", username: "@noah_cloud", body: "Terraform and Ansible support is surprisingly deep. Love it.", img: "https://avatar.vercel.sh/noah" },
  { name: "Zoe", username: "@zoe_react", body: "Hook dependencies solved in seconds. Chintu is a life saver.", img: "https://avatar.vercel.sh/zoe" },
  { name: "Finn", username: "@finn_go", body: "Goroutines and channels explained with live examples. Epic.", img: "https://avatar.vercel.sh/finn" },
  { name: "Lila", username: "@lila_java", body: "Spring Boot magic! Chintu knows the boilerplate I hate.", img: "https://avatar.vercel.sh/lila" },
  { name: "Milo", username: "@milo_rust", body: "Borrow checker issues? Chintu explains them like I'm five.", img: "https://avatar.vercel.sh/milo" },
  { name: "Eila", username: "@eila_dev", body: "Got through the Google onsite thanks to the system design mode.", img: "https://avatar.vercel.sh/eila" },
  { name: "Kael", username: "@kael_infra", body: "Monitoring and observability rounds were a breeze.", img: "https://avatar.vercel.sh/kael" },
  { name: "Nora", username: "@nora_web", body: "CSS Grid and Flexbox masterclass from Chintu. Perfect.", img: "https://avatar.vercel.sh/nora" },
  { name: "Axel", username: "@axel_sys", body: "Low-level C++ questions? Chintu is surprisingly accurate.", img: "https://avatar.vercel.sh/axel" },
  { name: "Iris", username: "@iris_data", body: "Pandas and Numpy logic is top-tier. Data rounds are easy.", img: "https://avatar.vercel.sh/iris" },
  { name: "Hugo", username: "@hugo_node", body: "Event loop explained perfectly during my Node.js interview.", img: "https://avatar.vercel.sh/hugo" },
  { name: "Jade", username: "@jade_vue", body: "Vue 3 composition API support is excellent. Highly recommend.", img: "https://avatar.vercel.sh/jade" },
  { name: "Theo", username: "@theo_dev", body: "GraphQL schemas generated on the fly. Chintu is a beast.", img: "https://avatar.vercel.sh/theo" },
  { name: "Rose", username: "@rose_qa", body: "Cypress and Playwright scripts are flawless. Great tool.", img: "https://avatar.vercel.sh/rose" },
  { name: "Liam", username: "@liam_swift", body: "iOS development rounds? Chintu has your back. 🍎", img: "https://avatar.vercel.sh/liam" },
  { name: "Emma", username: "@emma_android", body: "Jetpack Compose questions were handled perfectly.", img: "https://avatar.vercel.sh/emma" },
  { name: "Ryan", username: "@ryan_dev", body: "Chintu's speed is what sets it apart. No lag, just answers.", img: "https://avatar.vercel.sh/ryan" },
  { name: "Sara", username: "@sara_tech", body: "The best companion for live coding sessions. Truly magic.", img: "https://avatar.vercel.sh/sara" },
  { name: "Paul", username: "@paul_codes", body: "Refactored my entire solution during a break. Incredible.", img: "https://avatar.vercel.sh/paul" },
  { name: "Tina", username: "@tina_web", body: "Accessibility (a11y) tips are actually useful. Great job.", img: "https://avatar.vercel.sh/tina" },
  { name: "Will", username: "@will_dev", body: "Dockerizing apps on the fly. Chintu is my new best friend.", img: "https://avatar.vercel.sh/will" },
  { name: "Gabi", username: "@gabi_js", body: "TypeScript types solved instantly. No more 'any'!", img: "https://avatar.vercel.sh/gabi" },
  { name: "Seth", username: "@seth_api", body: "REST vs gRPC? Chintu explains the trade-offs perfectly.", img: "https://avatar.vercel.sh/seth" },
  { name: "Yara", username: "@yara_dev", body: "The most reliable tool in my tech stack right now.", img: "https://avatar.vercel.sh/yara" },
  { name: "Cole", username: "@cole_db", body: "SQL indexing and query optimization tips saved me. 💾", img: "https://avatar.vercel.sh/cole" },
  { name: "Vina", username: "@vina_cloud", body: "Multi-cloud strategies explained with zero fluff. Epic.", img: "https://avatar.vercel.sh/vina" },
  { name: "Kory", username: "@kory_dev", body: "Chintu is the future of interview prep. Period.", img: "https://avatar.vercel.sh/kory" },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string;
  name: string;
  username: string;
  body: string;
}) => {
  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]",
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Image className="rounded-full" width={32} height={32} alt="" src={img} />
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-gray-900 dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-400 dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">&quot;{body}&quot;</blockquote>
    </figure>
  );
};

export function MarqueeReviews() {
  return (
    <section className="py-24 relative flex w-full flex-col items-center justify-center overflow-hidden bg-white/30 border-t border-gray-100">
      <div className="reveal text-center mb-16 px-6">
        <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-4">Wall of Dominance</h2>
        <p className="text-3xl font-black tracking-tight text-gray-900 uppercase">Real Feedback. <span className="text-indigo-600">Real Offers.</span></p>
      </div>

      <Marquee pauseOnHover className="[--duration:20s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:20s] mt-4">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-background"></div>
    </section>
  );
}
