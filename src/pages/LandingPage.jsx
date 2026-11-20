import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import ExampleLedger from '../components/landing/ExampleLedger';
import Features from '../components/landing/Features';
import AudienceSection from '../components/landing/AudienceSection';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ExampleLedger />
        <Features />
        <AudienceSection />
      </main>
      <Footer />
    </>
  );
}

