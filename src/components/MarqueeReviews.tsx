import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";
import { AvatarCircles } from "@/components/ui/avatar-circles";

const reviews = [
  {
    name: "Abhishek",
    username: "@dev_abhishek",
    body: "Just used Chintu for my Uber interview. The screen reading is magic. Cleared it!",
    img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=3540&auto=format&fit=crop",
  },
  {
    name: "Priya",
    username: "@tech_queen",
    body: "100% success rate with Chintu's JD analysis. Meta here I come! Best tool ever.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3540&auto=format&fit=crop",
  },
  {
    name: "Rohan",
    username: "@backend_ninja",
    body: "The protected mode is actually undetectable. Proctoring didn't stand a chance. Highly recommend.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
  },
  {
    name: "Sneha",
    username: "@frontend_guru",
    body: "Best $29 I ever spent. Got a $150k offer thanks to the real-time snippets and live hints.",
    img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=3540&auto=format&fit=crop",
  },
  {
    name: "Karan",
    username: "@system_designer",
    body: "High-level design hints are spot on. It read my diagrams perfectly. Essential for senior roles.",
    img: "https://images.unsplash.com/photo-1480429370139-e0132c086e2a?q=80&w=3540&auto=format&fit=crop",
  },
  {
    name: "Anjali",
    username: "@interview_prep",
    body: "Chintu is the GOAT. No more anxiety during live coding. It felt like a pair programming session.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
  },
  { name: "Arjun", username: "@arjun_codes", body: "Chintu is a beast. Cleared 3 rounds in 2 days. 🚀", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop" },
  { name: "Sofia", username: "@sofia_tech", body: "The UI is so clean, and the responses are instant. Worth every penny.", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=3540&auto=format&fit=crop" },
  { name: "Ahmed", username: "@ahmed_dev", body: "I was skeptical, but the vision engine is actually insane. 10/10.", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop" },
  { name: "Deepika", username: "@deepika_dev", body: "Helping me bridge the gap between junior and senior roles. Amazing.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3540&auto=format&fit=crop" },
  { name: "Vikram", username: "@vikram_backend", body: "Python, Go, Rust - Chintu knows it all. My new secret weapon.", img: "https://images.unsplash.com/photo-1506803682981-6e718a9dd3ee?q=80&w=3540&auto=format&fit=crop" },
  { name: "Zara", username: "@zara_growth", body: "Behavioral questions are no longer a nightmare. Thanks Chintu!", img: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=3540&auto=format&fit=crop" },
  { name: "Rahul", username: "@rahul_hacks", body: "Protected overlay is legit. Didn't trigger any alerts. Perfect.", img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=3540&auto=format&fit=crop" },
  { name: "Nina", username: "@nina_apps", body: "Got my dream job at Meta. Chintu was the edge I needed.", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=3540&auto=format&fit=crop" },
  { name: "Leo", username: "@leo_builds", body: "System design made easy. The diagrams are crystal clear now.", img: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3540&auto=format&fit=crop" },
  { name: "Hana", username: "@hana_cloud", body: "AWS certs? Done. Technical rounds? Done. Chintu is key.", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3540&auto=format&fit=crop" },
  { name: "Chris", username: "@chris_infra", body: "Kubernetes questions? Chintu handled them like a pro.", img: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=3540&auto=format&fit=crop" },
  { name: "Sita", username: "@sita_ui", body: "Tailwind, React, Next.js - the suggestions are always spot on.", img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=3540&auto=format&fit=crop" },
  { name: "Omar", username: "@omar_sec", body: "Security protocols were a breeze. Chintu is incredibly fast.", img: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=3540&auto=format&fit=crop" },
  { name: "Eva", username: "@eva_ml", body: "Pytorch and TensorFlow experts would be proud of Chintu's logic.", img: "https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?q=80&w=3540&auto=format&fit=crop" },
  { name: "Jack", username: "@jack_devops", body: "CI/CD pipelines explained perfectly. Instant success.", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=3540&auto=format&fit=crop" },
  { name: "Maya", username: "@maya_web3", body: "Smart contracts and solidity? No problem for Chintu.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3540&auto=format&fit=crop" },
  { name: "Ken", username: "@ken_soft", body: "Best investment in my career so far. Highly recommend.", img: "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=3540&auto=format&fit=crop" },
  { name: "Lara", username: "@lara_qa", body: "Testing logic is solid. Chintu catches every edge case.", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop" },
  { name: "Ben", username: "@ben_mobile", body: "Swift and Kotlin suggestions were perfect. Got the job!", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop" },
  { name: "Ruby", username: "@ruby_fullstack", body: "The most versatile AI assistant I've ever used. 💎", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=3540&auto=format&fit=crop" },
  { name: "Sasha", username: "@sasha_code", body: "Chintu's logic for complex algorithms is better than most seniors.", img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=3540&auto=format&fit=crop" },
  { name: "Ivan", username: "@ivan_dev", body: "Secured a role at Yandex. Chintu's competitive mode is ⚡.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=3540&auto=format&fit=crop" },
  { name: "Aria", username: "@aria_ux", body: "Even the UI feedback is helpful. Chintu is a total package.", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=3540&auto=format&fit=crop" },
  { name: "Noah", username: "@noah_cloud", body: "Terraform and Ansible support is surprisingly deep. Love it.", img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=3540&auto=format&fit=crop" },
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
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4 transition-all duration-300",
        "border-[var(--glass-border)] bg-[var(--panel-bg)] hover:bg-[var(--glass-bg)]"
      )}
    >
      <div className="flex flex-row items-center gap-2">
        <Image
          className="rounded-full h-8 w-8 object-cover"
          width={32}
          height={32}
          alt={name}
          src={img}
          loading="lazy"
          unoptimized
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-[var(--text-main)]">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-[var(--text-dim)]">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm text-[var(--text-dim)] leading-relaxed italic">&quot;{body}&quot;</blockquote>
    </figure>
  );
};

export function MarqueeReviews() {
  return (
    <section className="py-3 sm:py-6 relative flex w-full flex-col items-center overflow-hidden border-t border-[var(--glass-border)]">
      <div className="text-center mb-3 sm:mb-4 px-6">
        <h2 className="text-[10px] font-black text-teal-500 uppercase tracking-[0.5em] mb-4">Wall of Dominance</h2>
        <p className="text-3xl font-black tracking-tight text-[var(--text-main)] uppercase">Real Feedback. <span className="text-teal-600">Real Offers.</span></p>

        <div className="mt-8 flex flex-col items-center gap-4">
          <AvatarCircles
            numPeople={99}
            avatarUrls={[
              {
                imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
              {
                imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
              {
                imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
              {
                imageUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
              {
                imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
              {
                imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=3540&auto=format&fit=crop",
                profileUrl: "#",
              },
            ]}
          />
          <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest">Trusted by 99+ Elite Developers</p>
        </div>
      </div>

      <Marquee pauseOnHover className="[--duration:60s]">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="[--duration:60s] mt-4">
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </Marquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[var(--bg-app)] to-transparent"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[var(--bg-app)] to-transparent"></div>
    </section>
  );
}
