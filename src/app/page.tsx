/* eslint-disable @next/next/no-img-element */
import { Clock, Mic, Ear } from "lucide-react";

const CREAM = "#f5eddd";
const RETRO_RED = "#a13d2d";

// --- Hero Section ---
function Hero() {
  return (
    <section
      className="w-full flex flex-col items-center justify-center py-24 gap-8 text-center"
      style={{ background: CREAM }}
    >
      <div className="flex flex-col md:flex-row items-center gap-12">
        <img
          src="/mascot.jpg"
          alt="Retro Mascot"
          className="w-64 h-64 object-contain rounded-2xl border-4 border-[#a13d2d] bg-[#f5eddd] shadow-xl"
        />
        <div>
          <h1
            className="text-6xl sm:text-8xl font-black leading-tight"
            style={{ color: RETRO_RED, fontFamily: "serif" }}
          >
            Your 24/7
            <br />
            <span style={{ color: RETRO_RED, fontStyle: "italic" }}>
              Castmate.
            </span>
          </h1>
          <p
            className="text-xl sm:text-2xl max-w-2xl mx-auto mt-8 mb-8"
            style={{ color: RETRO_RED, fontFamily: "monospace" }}
          >
            Record the perfect self-tape and rehearse lines anytime with our
            top-notch AI readers.
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
              Learn More
            </a>
          </div>
          <p
            className="text-lg mt-4 font-medium"
            style={{ color: RETRO_RED, fontFamily: "monospace" }}
          >
            Try Castmate. No credit card required.
          </p>
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
    <section
      className={`w-full py-24 flex flex-col lg:flex-row ${
        reverse ? "lg:flex-row-reverse" : ""
      } gap-12 items-center justify-center`}
      style={{
        background: CREAM,
        padding:
          title === "Meet Your Co-Star" ||
          title === "Realistic Voices" ||
          title === "Listens & Responds"
            ? "3rem 2rem"
            : undefined,
      }}
    >
      {/* Text */}
      <div className="flex-1 flex flex-col gap-6 max-w-lg">
        <div className="flex items-center mb-4">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-xl border-2 border-[#a13d2d] mr-4"
            style={{ background: CREAM }}
          >
            <span className="text-3xl" style={{ color: RETRO_RED }}>
              {icon}
            </span>
          </div>
          <h2
            className="text-5xl font-serif font-black"
            style={{ color: RETRO_RED }}
          >
            {title}
          </h2>
        </div>
        <p
          className="text-lg font-mono"
          style={{ color: RETRO_RED, whiteSpace: "pre-line" }}
        >
          {desc}
        </p>
      </div>
      {/* Sticky Image */}
      <div className="flex-1 flex justify-center w-full">
        <div className="sticky top-24 rounded-3xl overflow-hidden shadow-2xl border-4 border-[#a13d2d] bg-[#f5eddd] p-4 w-full max-w-2xl">
          <img
            src="/mascot.jpg"
            alt={title}
            className="w-full h-auto rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}

// --- HowToUse Section ---
function HowToUse() {
  return (
    <section
      className="w-full py-24 flex flex-col items-center"
      style={{ background: CREAM }}
    >
      <h2
        className="text-5xl font-black mb-12"
        style={{ color: RETRO_RED, fontFamily: "serif" }}
      >
        How to use <span style={{ fontStyle: "italic" }}>Castmate</span>
      </h2>
      <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#a13d2d] bg-[#f5eddd] p-4 max-w-4xl w-full flex justify-center">
        <img
          src="/mascot.jpg"
          alt="How to use Castmate"
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
      icon: "📤",
      title: "Upload your script",
      desc: "Upload sides from Actors Access, Casting Networks or any other PDF.",
    },
    {
      icon: "🎭",
      title: "Choose a reader",
      desc: "Tell us who you're playing and select the perfect reader for your audition.",
    },
    {
      icon: "🎬",
      title: "Run the scene",
      desc: "Hit play and start reading your lines. Castmate will read the rest.",
    },
  ];
  return (
    <section
      className="w-full py-24 flex flex-col items-center"
      style={{ background: CREAM }}
    >
      <h2
        className="text-5xl font-black mb-16"
        style={{ color: RETRO_RED, fontFamily: "serif" }}
      >
        How it works
      </h2>
      <div className="flex flex-col md:flex-row gap-12 justify-center w-full max-w-6xl">
        {steps.map((step, i) => (
          <div
            key={i}
            className="flex flex-col items-center text-center flex-1 max-w-xs"
          >
            <div className="text-7xl mb-6" style={{ color: RETRO_RED }}>
              {step.icon}
            </div>
            <h3
              className="font-bold text-2xl mb-4"
              style={{ color: RETRO_RED, fontFamily: "serif" }}
            >
              {step.title}
            </h3>
            <p className="text-lg font-mono" style={{ color: RETRO_RED }}>
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <Hero />
      <FeatureWithImage
        title="Available 24/7"
        desc={`Run line 24/7.\nFocus without relying on someone else's help.`}
        icon={<Clock size={36} strokeWidth={2.5} />}
        image="/mascot.jpg"
      />
      <FeatureWithImage
        title="Realistic Voices"
        desc={`Clear, natural sounding voices just like a human reader.\n\n Additional features coming soon to help you get the results you want.`}
        icon={<Mic size={36} strokeWidth={2.5} />}
        image="/mascot.jpg"
        reverse
      />
      <FeatureWithImage
        title="Listens & Responds"
        desc={`Castmate is intuitive and responsive.\n\n Your reader listens and responds in real time, so you can focus on getting the tape.`}
        icon={<Ear size={36} strokeWidth={2.5} />}
        image="/mascot.jpg"
      />
      <HowToUse />
      <HowItWorksSteps />
    </div>
  );
}
