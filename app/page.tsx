import Link from "next/link"
import { ArrowRight, Zap, Shield, Clock, Users } from "lucide-react"

function HeroSection() {
  return (
    <header className="min-h-screen flex flex-col justify-end pb-20 px-6 lg:px-16 relative border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-border pb-8 mb-8">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-2 block">
              Shift Trading Platform
            </span>
            <h1 className="font-display text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] uppercase text-foreground">
              Shift
              <br />
              Swap
            </h1>
          </div>
          <div className="max-w-md pb-4 md:text-right mt-8 md:mt-0">
            <p className="text-lg md:text-xl font-light text-foreground leading-relaxed">
              Trade shifts instantly.
              <br />
              <span className="text-muted-foreground">
                No more group chat chaos.
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-between text-sm text-muted-foreground font-mono">
          <div className="flex gap-4">
            <span>[ POST ]</span>
            <span>[ CLAIM ]</span>
            <span>[ APPROVE ]</span>
          </div>
          <div className="text-primary flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            LIVE
          </div>
        </div>
      </div>
    </header>
  )
}

function AboutSection() {
  return (
    <section className="px-6 lg:px-16 py-24 border-b border-border">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        <div className="lg:col-span-4">
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-4 block">
            The Problem
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-foreground text-balance">
            Shift swaps are{" "}
            <span className="text-muted-foreground">broken.</span>
          </h2>
        </div>
        <div className="lg:col-span-8">
          <p className="text-xl md:text-2xl font-light leading-relaxed text-muted-foreground mb-8">
            Workers use WhatsApp groups and SMS threads to trade shifts. Messages
            get buried. Opportunities get missed. Managers waste time mediating
            disputes.{" "}
            <span className="text-foreground">
              ShiftSwap replaces the chaos with a single, clear board.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      label: "01 // Speed",
      title: "One-Tap\nClaim",
      description:
        "See an open shift? Tap to claim it instantly. No back-and-forth messaging needed.",
    },
    {
      icon: Shield,
      label: "02 // Compliance",
      title: "Auto\nValidation",
      description:
        "System blocks double-bookings and flags consecutive 7-day streaks before they happen.",
    },
    {
      icon: Clock,
      label: "03 // Real-time",
      title: "Live\nBoard",
      description:
        "The shift board updates in real-time. When someone claims a shift, everyone sees it instantly.",
    },
    {
      icon: Users,
      label: "04 // Approval",
      title: "Manager\nDashboard",
      description:
        "Managers get a single approve/deny view. No more mediating group chat disputes.",
    },
  ]

  return (
    <section className="border-b border-border">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {features.map((feature, i) => (
          <div
            key={feature.label}
            className={`p-10 lg:p-16 flex flex-col justify-between min-h-[50vh] border-b md:border-b-0 border-border transition-colors hover:bg-card group ${
              i % 2 === 0 ? "md:border-r border-border" : ""
            } ${i < 2 ? "md:border-b border-border" : ""}`}
          >
            <div>
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-6 block">
                {feature.label}
              </span>
              <h3 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors whitespace-pre-line mb-6">
                {feature.title}
              </h3>
              <p className="text-muted-foreground font-light max-w-md leading-relaxed">
                {feature.description}
              </p>
            </div>
            <div className="mt-8">
              <feature.icon className="h-6 w-6 text-primary" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center text-center px-6 lg:px-16 border-b border-border">
      <div>
        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4 block">
          Ready to swap?
        </span>
        <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter uppercase text-foreground mb-8">
          Get Started
        </h2>
        <p className="text-muted-foreground font-light max-w-lg mx-auto mb-12 leading-relaxed">
          Create your account and start posting or claiming shifts in seconds.
          Your team will thank you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-sm uppercase tracking-[0.2em] font-display font-semibold hover:brightness-110 transition-all rounded-md"
          >
            Create Account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 border border-border px-8 py-4 text-sm uppercase tracking-[0.2em] font-display font-semibold text-foreground hover:bg-card hover:border-muted-foreground/30 transition-all rounded-md"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="px-6 lg:px-16 py-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="font-display text-sm font-bold tracking-tight">
          SHIFT<span className="text-primary">SWAP</span>
        </div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest">
          Shift trading for modern teams
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <main>
      <nav className="fixed top-0 w-full px-6 lg:px-16 py-6 flex justify-between items-center z-50 mix-blend-difference">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight uppercase text-foreground"
        >
          SHIFT<span className="text-primary">SWAP</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/auth/login"
            className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground hover:text-primary transition-colors hidden md:block"
          >
            Sign In
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-xs uppercase tracking-[0.2em] font-semibold border border-foreground/10 px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
