import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import GSDDashboard from "@/components/GSD/GSDDashboard";

export default async function GSDPage() {
  // Protect route - only authenticated users can access GSD
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <GSDDashboard />
    </div>
  );
}
