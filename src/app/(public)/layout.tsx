import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { AskAI } from "@/components/public/AskAI";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#050E1C]">
      <PublicHeader />
      <main className="flex-1 pt-[56px]">{children}</main>
      <PublicFooter />
      <AskAI />
    </div>
  );
}
