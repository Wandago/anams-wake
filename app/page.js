import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DeathComes from "@/components/DeathComes";
import Cast from "@/components/Cast";
import Trailer from "@/components/Trailer";
import Footer from "@/components/Footer";
import SoundToggle from "@/components/SoundToggle";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <DeathComes />
      <Cast />
      <Trailer />
      <Footer />
      <SoundToggle />
    </main>
  );
}
