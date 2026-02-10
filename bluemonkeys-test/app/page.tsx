import { Header } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { LogoCloud } from "@/components/sections/LogoCloud";
import { Testimonial } from "@/components/sections/Testimonial";
import { Features } from "@/components/sections/Features";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <LogoCloud />
        <Testimonial />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
