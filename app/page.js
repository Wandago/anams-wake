import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Poster from "@/components/Poster";
import DeathComes from "@/components/DeathComes";
import Cast from "@/components/Cast";
import Gallery from "@/components/Gallery";
import Trailer from "@/components/Trailer";
import Footer from "@/components/Footer";
import SoundToggle from "@/components/SoundToggle";
import ScrollDots from "@/components/ScrollDots";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <ScrollDots />
      <Hero />
      <Poster />
      <DeathComes />
      <Cast />
      <Gallery />
      <Trailer />
      <Footer />
      <SoundToggle />
    </main>
  );
}
