import Image from "next/image";

interface PageBannerProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageBanner({ eyebrow, title, description }: PageBannerProps) {
  return (
    <section className="relative bg-[#060E18] border-b-[3px] border-[#5CAFD6] py-16 overflow-hidden">
      {/* Background photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-arctic.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-20"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060E18] via-[#060E18]/85 to-[#060E18]/50" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6">
        {eyebrow && (
          <div className="flex items-center gap-3 mb-5">
            <div className="h-[2px] w-6 bg-[#5CAFD6]" />
            <span className="text-[#5CAFD6] text-[11px] font-black uppercase tracking-[0.22em]">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black text-white leading-[1.05]">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
