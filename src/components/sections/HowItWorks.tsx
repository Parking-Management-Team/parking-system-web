'use client'

const steps = [
  {
    number: '01',
    title: 'Choose Building',
    description: 'Select your preferred parking building from our network of smart facilities'
  },
  {
    number: '02',
    title: 'Book Your Spot',
    description: 'Enter your vehicle details and choose your preferred time duration'
  },
  {
    number: '03',
    title: 'Pay & Park',
    description: 'Complete secure payment and receive your virtual parking pass'
  }
]

export default function HowItWorks() {
  return (
    <section className="section-padding bg-zinc-950 text-white relative overflow-hidden">
      {/* Subtle decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl md:text-5xl font-bold font-heading mb-4 text-white">How It Works</h2>
          <p className="text-emerald-400 text-xl font-light">
            Three simple steps to secure your parking spot
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-16 md:gap-8 lg:gap-16">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              <div className="absolute -top-10 left-0 text-7xl lg:text-8xl font-black font-mono text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-300">
                {step.number}
              </div>
              <div className="pt-8">
                <h3 className="text-2xl font-bold font-heading mb-4 text-white group-hover:text-emerald-400 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
