import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="anic-theme flex min-h-screen flex-col bg-[#eeeeee] text-[#333333]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <AskAI />
    </div>
  );
}

