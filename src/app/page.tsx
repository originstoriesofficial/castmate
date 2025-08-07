/* eslint-disable @next/next/no-img-element */
import { Clock, Mic, Ear } from "lucide-react";

// Color palette based on mascot image
const CREAM = '#f5eddd';
const RETRO_RED = '#a13d2d';

// --- Hero Section ---
function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-24 gap-8 text-center" style={{ background: CREAM }}>
      <div className="flex flex-col md:flex-row items-center gap-12">
        <img
          src="https://www.shutterstock.com/image-vector/micropho…-mascot-illustration-cartoon-600nw-2475995729.jpg" // Place your mascot image at public/mascot.png
          alt="Retro Mascot"
          className="w-64 h-64 object-contain rounded-2xl border-4 border-[#a13d2d] bg-[#f5eddd] shadow-xl"
        />
        <div>
          <h1 className="text-6xl sm:text-8xl font-black leading-tight" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
            No reader?<br />
            <span style={{ color: RETRO_RED, fontStyle: 'italic' }}>No problem.</span>
          </h1>
          <p className="text-xl sm:text-2xl max-w-2xl mx-auto mt-8 mb-8" style={{ color: RETRO_RED, fontFamily: 'monospace' }}>
            Self tape without a reader & run lines any time with your new AI line reader.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#get-started"
              className="px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors"
            >
              Get 3 Free Auditions
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors"
            >
              How it works
            </a>
          </div>
          <p className="text-lg mt-4 font-medium" style={{ color: RETRO_RED, fontFamily: 'monospace' }}>
            Join thousands of actors. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}

// --- Testimonials Row Section ---
function TestimonialsRow() {
  return (
    <section className="w-full py-12 flex flex-col items-center" style={{ background: CREAM }}>
      <div className="flex flex-col md:flex-row gap-6 justify-center max-w-6xl w-full">
        <div className="bg-[#a13d2d] rounded-2xl p-6 flex-1 max-w-xs text-[#f5eddd] shadow-lg">
          <div className="font-bold text-lg mb-2" style={{ fontFamily: 'serif' }}>Chris van Rensburg</div>
          <div className="font-mono">Way better than ColdRead. The function to let it mimic my voice is pure genius!</div>
        </div>
        <div className="bg-[#a13d2d] rounded-2xl p-6 flex-1 max-w-xs text-[#f5eddd] shadow-lg">
          <div className="font-bold text-lg mb-2" style={{ fontFamily: 'serif' }}>Junie Hoang</div>
          <div className="font-mono">Holy cow, your app is amazing. 6 pages of dialogue and the AI whipped through it!</div>
        </div>
        <div className="bg-[#a13d2d] rounded-2xl p-6 flex-1 max-w-xs text-[#f5eddd] shadow-lg">
          <div className="font-bold text-lg mb-2" style={{ fontFamily: 'serif' }}>David Guenaga</div>
          <div className="font-mono">Amazing…thank you love the app!</div>
        </div>
      </div>
    </section>
  );
}

// --- FeatureWithImage Section ---
function FeatureWithImage({
  title,
  desc,
  icon,
  image,
  reverse,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  image: string;
  reverse?: boolean;
}) {
  return (
    <section className={`w-full py-24 flex flex-col lg:flex-row ${reverse ? 'lg:flex-row-reverse' : ''} gap-12 items-center justify-center`} style={{ background: CREAM, padding: title === 'Available 24/7' || title === 'Realistic Voices' || title === 'Listens & Responds' ? '3rem 2rem' : undefined }}>
      {/* Text */}
      <div className="flex-1 flex flex-col gap-6 max-w-lg">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-[#a13d2d] mr-4" style={{ background: CREAM }}>
            <span className="text-3xl" style={{ color: RETRO_RED }}>{icon}</span>
          </div>
          <h2 className="text-5xl font-serif font-black" style={{ color: RETRO_RED }}>{title}</h2>
        </div>
        <p className="text-lg font-mono" style={{ color: RETRO_RED, whiteSpace: 'pre-line' }}>{desc}</p>
      </div>
      {/* Sticky Image */}
      <div className="flex-1 flex justify-center w-full">
        <div className="sticky top-24 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#a13d2d] bg-[#f5eddd] p-4 w-full max-w-2xl">
          <img src={image} alt={title} className="w-full h-auto rounded-2xl object-cover" />
        </div>
      </div>
    </section>
  );
}

// --- HowToUse Section ---
function HowToUse() {
  return (
    <section className="w-full py-24 flex flex-col items-center" style={{ background: CREAM }}>
      <h2 className="text-5xl font-black mb-12" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
        How to use <span style={{ fontStyle: 'italic' }}>ScenePartner</span>
      </h2>
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#a13d2d] bg-[#f5eddd] p-4 max-w-4xl w-full flex justify-center">
        {/* Placeholder for video or image */}
        <img
          src="https://www.shutterstock.com/image-vector/micropho…-mascot-illustration-cartoon-600nw-2475995729.jpg"
          alt="How to use ScenePartner"
          className="w-full h-auto rounded-2xl object-cover"
        />
      </div>
    </section>
  );
}

// --- HowItWorksSteps Section ---
function HowItWorksSteps() {
  const steps = [
    {
      icon: '📤',
      title: 'Upload your script',
      desc: 'Upload sides from Actors Access, Casting Networks or any other PDF.',
    },
    {
      icon: '🎭',
      title: 'Choose a reader',
      desc: "Tell us who you're playing and select the perfect reader for your audition.",
    },
    {
      icon: '🎬',
      title: 'Run the scene',
      desc: 'Hit play and start reading your lines. ScenePartner will read the rest.',
    },
  ];
  return (
    <section className="w-full py-24 flex flex-col items-center" style={{ background: CREAM }}>
      <h2 className="text-5xl font-black mb-16" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
        How it works
      </h2>
      <div className="flex flex-col md:flex-row gap-12 justify-center w-full max-w-6xl">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center text-center flex-1 max-w-xs">
            <div className="text-7xl mb-6" style={{ color: RETRO_RED }}>{step.icon}</div>
            <h3 className="font-bold text-2xl mb-4" style={{ color: RETRO_RED, fontFamily: 'serif' }}>{step.title}</h3>
            <p className="text-lg font-mono" style={{ color: RETRO_RED }}>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- DramaPrograms Section ---
function DramaPrograms() {
  const logos = [
    'Berkeley', 'CALARTS', 'NYU', 'Yale', 'AMDA', 'RISD', 'USC'
  ];
  return (
    <section className="w-full py-24 flex flex-col items-center" style={{ background: CREAM }}>
      <h2 className="text-5xl font-black mb-16" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
        Used at Top Drama Programs
      </h2>
      <div className="flex flex-wrap justify-center gap-8 mb-8 w-full max-w-5xl">
        {logos.map((name, i) => (
          <div key={i} className="w-40 h-20 flex items-center justify-center bg-gray-200 rounded-xl text-xl font-bold" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
            {name}
          </div>
        ))}
      </div>
      <div className="text-center mb-6">
        <span className="font-mono text-lg" style={{ color: RETRO_RED }}>
          Students get 50% off with a school email address.
        </span>
      </div>
      <div className="flex gap-6">
        <button className="px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors">
          For Educators
        </button>
        <button className="px-8 py-4 rounded-full font-bold text-lg shadow-md border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors">
          For Students
        </button>
      </div>
    </section>
  );
}

// --- Pricing Section ---
function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      period: 'per year',
      features: [
        '3 Free Auditions',
        '24/7 access to AI reader',
        'Unlimited takes per audition',
        'Smiley Yorick Mascot',
      ],
      button: 'Continue with Free',
    },
    {
      name: 'Plus',
      price: '80',
      period: 'per year',
      features: [
        '10 new auditions each month',
        '24/7 access to AI reader',
        'Unlimited takes per audition',
        'Friendly US support',
      ],
      button: 'Get started',
    },
    {
      name: 'Pro',
      price: '288',
      period: 'per year',
      features: [
        'Everything in Basic',
        '100 Auditions per month',
        'More Character Voices (Coming Soon)',
        'Early Access to New Features',
      ],
      button: 'Get Started',
    },
  ];
  return (
    <section className="w-full py-24 flex flex-col items-center" style={{ background: CREAM }}>
      <h2 className="text-6xl font-black mb-4" style={{ color: RETRO_RED, fontFamily: 'serif', fontStyle: 'italic' }}>
        Dead <span style={{ fontStyle: 'normal' }}>simple</span> pricing
      </h2>
      <div className="flex gap-4 mb-12">
        <button className="px-6 py-2 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#f5eddd] text-[#a13d2d] hover:bg-[#a13d2d] hover:text-[#f5eddd] transition-colors">Monthly</button>
        <button className="px-6 py-2 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors">Yearly (20% off)</button>
      </div>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl justify-center">
        {plans.map((plan, i) => (
          <div key={i} className="flex flex-col items-center bg-[#f5eddd] border-4 border-[#a13d2d] rounded-2xl p-8 flex-1 min-w-[260px] max-w-xs shadow-xl">
            <h3 className="text-3xl font-black mb-2" style={{ color: RETRO_RED, fontFamily: 'serif' }}>{plan.name}</h3>
            <div className="flex items-end mb-4">
              <span className="text-4xl font-black" style={{ color: RETRO_RED, fontFamily: 'serif' }}>${plan.price}</span>
              <span className="ml-2 text-base font-mono" style={{ color: RETRO_RED }}>/ {plan.period}</span>
            </div>
            <ul className="mb-6 text-left">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center mb-2 text-lg font-mono" style={{ color: RETRO_RED }}>
                  <span className="mr-2">✓</span> {f}
                </li>
              ))}
            </ul>
            <button className="w-full px-6 py-3 rounded-full font-bold text-lg border-2 border-[#a13d2d] bg-[#a13d2d] text-[#f5eddd] hover:bg-[#f5eddd] hover:text-[#a13d2d] transition-colors">
              {plan.button}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- RetroFooter Section ---
function RetroFooter() {
  return (
    <footer className="w-full pt-12 pb-6 border-t-4" style={{ background: CREAM, borderColor: RETRO_RED }}>
      <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-4 gap-8">
        {/* Mascot and App Name */}
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-[#a13d2d] bg-[#f5eddd]">
            <Mic size={40} color={RETRO_RED} />
          </span>
          <span className="text-2xl font-black" style={{ color: RETRO_RED, fontFamily: 'serif' }}>iReader</span>
        </div>
        {/* Navigation Links */}
        <nav className="flex flex-wrap gap-6 justify-center">
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Pricing</a>
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>How It Works</a>
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Blog</a>
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>For Educators</a>
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>FAQ</a>
          <a href="#" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Feedback</a>
        </nav>
        {/* Meet the team */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-bold text-lg" style={{ color: RETRO_RED, fontFamily: 'serif' }}>Meet the team!</span>
          <div className="flex gap-2 mt-1">
            <img src="/avatar1.png" alt="Team 1" className="w-10 h-10 rounded-full border-2 border-[#a13d2d] bg-[#f5eddd]" />
            <img src="/avatar2.png" alt="Team 2" className="w-10 h-10 rounded-full border-2 border-[#a13d2d] bg-[#f5eddd]" />
            <img src="/avatar3.png" alt="Team 3" className="w-10 h-10 rounded-full border-2 border-[#a13d2d] bg-[#f5eddd]" />
          </div>
        </div>
      </div>
      <div className="text-center mt-8 font-mono text-base" style={{ color: RETRO_RED }}>
        ©{new Date().getFullYear()} iReader.ai
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <Hero />
      <TestimonialsRow />
      <FeatureWithImage
        title="Available 24/7"
        desc={`Run lines any day, any time.\n\nNo more begging roommates, flaky friends, or scheduling drama.`}
        icon={<Clock size={36} strokeWidth={2.5} />}
        image="https://www.shutterstock.com/image-vector/micropho…-mascot-illustration-cartoon-600nw-2475995729.jpg"
      />
      <FeatureWithImage
        title="Realistic Voices"
        desc={`Choose from natural sounding voices indistinguishable from a human reader.\n\nControl timing, speed and emotional inflection for the results you want.`}
        icon={<Mic size={36} strokeWidth={2.5} />}
        image="https://www.shutterstock.com/image-vector/micropho…-mascot-illustration-cartoon-600nw-2475995729.jpg"
        reverse
      />
      <FeatureWithImage
        title="Listens & Responds"
        desc={`Forget about recording and timing your lines.\n\nScenePartner listens to you and responds in real time, just like a live reader.`}
        icon={<Ear size={36} strokeWidth={2.5} />}
        image="https://www.shutterstock.com/image-vector/micropho…-mascot-illustration-cartoon-600nw-2475995729.jpg"
      />
      <HowToUse />
      <HowItWorksSteps />
      <DramaPrograms />
      <Pricing />
     
      <RetroFooter />
    </div>
  );
}
