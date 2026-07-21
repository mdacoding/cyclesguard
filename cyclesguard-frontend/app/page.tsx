import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="glass-card p-12 max-w-2xl w-full flex flex-col items-center">
        <h1 className="font-display text-5xl md:text-7xl mb-6 text-gradient font-semibold">
          CyclesGuard
        </h1>
        <p className="text-xl md:text-2xl mb-12 text-cream/90 font-light max-w-lg">
          Deine Stärke beginnt mit dem Verstehen deines Körpers.
        </p>
        
        <Link 
          href="/player/dashboard" 
          className="bg-rose-gold text-navy px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(232,196,184,0.3)]"
        >
          Zum Dashboard
        </Link>
      </div>
    </div>
  );
}
