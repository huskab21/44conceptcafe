import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Бүртгүүлэх" };

export default function SignupPage() {
  return (
    <AuthShell
      image="/images/cheers.webp"
      imageAlt="Найзууд кофе уух нь"
      quote={<>44-ийн гэр бүлд <em className="text-gold">нэгдээрэй.</em></>}
    >
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthShell>
  );
}
