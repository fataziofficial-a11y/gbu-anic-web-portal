"use client";

import Image from "next/image";
import { Handshake } from "lucide-react";
import { useState } from "react";

interface PartnerLogoProps {
  src: string;
  name: string;
}

export function PartnerLogo({ src, name }: PartnerLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#1A3A6B]">
        <Handshake className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-full items-center justify-center">
      <Image
        src={src}
        alt={name}
        width={160}
        height={56}
        className="max-h-14 object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
