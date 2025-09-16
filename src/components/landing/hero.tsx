import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export function LandingHero() {
    return (
        <section className="relative overflow-hidden py-24 md:py-32 flex items-center justify-center bg-primary">
            {/* Abstract SVG Illustration */}
            <div className="absolute inset-0 -z-10 pointer-events-none">
                {/* Layered, animated, and more complex SVG background */}
                <svg width="100%" height="100%" viewBox="0 0 1440 700" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full absolute inset-0">
                    <defs>
                        <radialGradient id="hero-gradient" cx="50%" cy="50%" r="80%" fx="50%" fy="50%" gradientTransform="rotate(10)">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="60%" stopColor="#9AD5fb" stopOpacity="0.08" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="wave1" x1="0" y1="0" x2="1440" y2="700" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#ffffff" stopOpacity="0.08" />
                            <stop offset="1" stopColor="#9AD5fb" stopOpacity="0.06" />
                        </linearGradient>
                        <linearGradient id="wave2" x1="0" y1="0" x2="1440" y2="700" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#9AD5fb" stopOpacity="0.08" />
                            <stop offset="1" stopColor="#ffffff" stopOpacity="0.06" />
                        </linearGradient>
                    </defs>
                    <ellipse cx="720" cy="350" rx="900" ry="350" fill="url(#hero-gradient)" />
                    <ellipse cx="300" cy="120" rx="180" ry="80" fill="#ffffff" fillOpacity="0.08" />
                    <ellipse cx="1200" cy="600" rx="220" ry="90" fill="#9AD5fb" fillOpacity="0.10" />
                    <ellipse cx="1100" cy="100" rx="120" ry="40" fill="#ffffff" fillOpacity="0.06" />
                    {/* Animated wave shapes */}
                    <path d="M0 600 Q 360 500 720 600 T 1440 600 V 700 H 0 Z" fill="url(#wave1)" className="animate-wave1" />
                    <path d="M0 650 Q 480 550 960 650 T 1440 650 V 700 H 0 Z" fill="url(#wave2)" className="animate-wave2" />
                </svg>
                {/* Dotted mesh, now larger and with a subtle rotation */}
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 animate-spin-slower" width="900" height="400" viewBox="0 0 900 400" fill="none">
                    <defs>
                        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="2" fill="#ffffff" />
                        </pattern>
                    </defs>
                    <rect width="900" height="400" fill="url(#dots)" />
                </svg>
                {/* Extra: floating hexagons for a futuristic/AI vibe */}
                <svg className="absolute left-1/3 top-1/4 animate-float-medium" width="60" height="52" viewBox="0 0 60 52" fill="none">
                    <polygon points="30,4 56,18 56,44 30,58 4,44 4,18" fill="#ffffff" fillOpacity="0.08" />
                    <polygon points="30,12 48,22 48,40 30,50 12,40 12,22" fill="#9AD5fb" fillOpacity="0.10" />
                </svg>
                <svg className="absolute right-1/4 bottom-10 animate-float" width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="#ffffff" fillOpacity="0.06" />
                </svg>
                {/* Network nodes and connections */}
                <svg className="absolute left-10 top-10 animate-pulse-glow" width="150" height="100" viewBox="0 0 150 100" fill="none">
                    <circle cx="20" cy="20" r="4" fill="#ffffff" fillOpacity="0.4" />
                    <circle cx="80" cy="30" r="3" fill="#9AD5fb" fillOpacity="0.5" />
                    <circle cx="130" cy="50" r="4" fill="#ffffff" fillOpacity="0.4" />
                    <circle cx="40" cy="70" r="3" fill="#9AD5fb" fillOpacity="0.5" />
                    <line x1="20" y1="20" x2="80" y2="30" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
                    <line x1="80" y1="30" x2="130" y2="50" stroke="#9AD5fb" strokeWidth="1" strokeOpacity="0.2" />
                    <line x1="80" y1="30" x2="40" y2="70" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" />
                </svg>
                {/* Geometric constellation */}
                <svg className="absolute right-10 top-20 animate-spin-slower" width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="20" r="3" fill="#ffffff" fillOpacity="0.3" />
                    <circle cx="100" cy="60" r="3" fill="#9AD5fb" fillOpacity="0.4" />
                    <circle cx="60" cy="100" r="3" fill="#ffffff" fillOpacity="0.3" />
                    <circle cx="20" cy="60" r="3" fill="#9AD5fb" fillOpacity="0.4" />
                    <polygon points="60,20 100,60 60,100 20,60" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.2" fill="none" />
                    <circle cx="60" cy="60" r="15" stroke="#9AD5fb" strokeWidth="1" strokeOpacity="0.2" fill="none" />
                </svg>
                {/* Data flow streams */}
                <svg className="absolute left-1/2 top-10 -translate-x-1/2 animate-wave1" width="200" height="80" viewBox="0 0 200 80" fill="none">
                    <path d="M0 40 Q 50 20 100 40 T 200 40" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.2" fill="none" strokeDasharray="5,5" />
                    <path d="M0 50 Q 50 30 100 50 T 200 50" stroke="#9AD5fb" strokeWidth="2" strokeOpacity="0.2" fill="none" strokeDasharray="3,3" />
                </svg>
            </div>
            <div className="container mt-16 mx-auto px-6 flex flex-col items-center justify-center relative z-10">
                <div className="flex flex-col items-center gap-8">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-center text-white drop-shadow-xl animate-fade-in-up">
                        A Secure, AI-Native, <span className="text-secondary">Meaning-First</span> Decentralized Drive
                    </h1>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-center animate-fade-in-up delay-100">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1 shadow border border-white/30">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#0295f6" fillOpacity="0.12" /><path d="M8 14h12M14 8v12" stroke="#0295f6" strokeWidth="2" strokeLinecap="round" /></svg>
                            <span className="font-mono text-primary text-sm">Semantic Search</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1 shadow border border-white/30">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="6" fill="#0295f6" fillOpacity="0.12" /><path d="M9 14h10M14 9v10" stroke="#9AD5fb" strokeWidth="2" strokeLinecap="round" /></svg>
                            <span className="font-mono text-primary text-sm">NFT Folders</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1 shadow border border-white/30">
                            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="14" rx="12" ry="8" fill="#0295f6" fillOpacity="0.10" /><ellipse cx="14" cy="14" rx="7" ry="4" fill="#9AD5fb" fillOpacity="0.18" /></svg>
                            <span className="font-mono text-primary text-sm">AI-Native</span>
                        </div>
                    </div>
                    <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-2xl text-center animate-fade-in-up delay-200">
                        <span className="italic">&ldquo;Forget CIDs. Access your files like you think &mdash; by meaning.&rdquo;</span>
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
                        <Link href="/get-started">
                            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 py-4 text-lg font-semibold">
                                Get Started
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
                {/* 3D/abstract floating shapes and extra crazy illustrations */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -z-10 animate-float-slow">
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <circle cx="60" cy="60" r="60" fill="#ffffff" fillOpacity="0.12" />
                        <circle cx="60" cy="60" r="40" fill="#9AD5fb" fillOpacity="0.18" />
                    </svg>
                </div>
                <div className="absolute right-0 top-1/3 -z-10 animate-float">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <rect x="0" y="0" width="80" height="80" rx="24" fill="#ffffff" fillOpacity="0.10" />
                        <rect x="20" y="20" width="40" height="40" rx="12" fill="#9AD5fb" fillOpacity="0.18" />
                    </svg>
                </div>
                <div className="absolute left-1/4 bottom-0 -z-10 animate-float-medium">
                    <svg width="100" height="60" viewBox="0 0 100 60" fill="none">
                        <ellipse cx="50" cy="30" rx="50" ry="30" fill="#ffffff" fillOpacity="0.10" />
                    </svg>
                </div>
                {/* Extra crazy illustration: a wireframe cube */}
                <div className="absolute right-1/4 top-1/4 -z-10 animate-spin-slow">
                    <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                        <rect x="10" y="10" width="70" height="70" rx="16" stroke="#ffffff" strokeWidth="2" fill="none" />
                        <rect x="25" y="25" width="40" height="40" rx="8" stroke="#9AD5fb" strokeWidth="2" fill="none" />
                        <line x1="10" y1="10" x2="25" y2="25" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="80" y1="10" x2="65" y2="25" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="10" y1="80" x2="25" y2="65" stroke="#ffffff" strokeWidth="1.5" />
                        <line x1="80" y1="80" x2="65" y2="65" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                </div>
                {/* Extra crazy illustration: a floating polygon */}
                <div className="absolute left-1/2 bottom-10 -translate-x-1/2 -z-10 animate-float-medium">
                    <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                        <polygon points="35,5 65,35 35,65 5,35" fill="#ffffff" fillOpacity="0.08" />
                        <polygon points="35,15 55,35 35,55 15,35" fill="#9AD5fb" fillOpacity="0.13" />
                    </svg>
                </div>
                {/* Additional floating tech elements */}
                <div className="absolute right-10 bottom-20 animate-float-slow">
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <circle cx="40" cy="40" r="30" stroke="#0295f6" strokeWidth="2" fill="none" strokeOpacity="0.3" strokeDasharray="10,5" />
                        <circle cx="40" cy="40" r="20" stroke="#9AD5fb" strokeWidth="1" fill="none" strokeOpacity="0.4" />
                        <circle cx="40" cy="40" r="3" fill="#0295f6" fillOpacity="0.6" />
                    </svg>
                </div>
                <div className="absolute left-10 bottom-1/4 animate-spin-slow">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                        <rect x="20" y="20" width="20" height="20" rx="4" stroke="#9AD5fb" strokeWidth="2" fill="none" strokeOpacity="0.4" />
                        <circle cx="30" cy="10" r="2" fill="#0295f6" fillOpacity="0.5" />
                        <circle cx="50" cy="30" r="2" fill="#9AD5fb" fillOpacity="0.5" />
                        <circle cx="30" cy="50" r="2" fill="#0295f6" fillOpacity="0.5" />
                        <circle cx="10" cy="30" r="2" fill="#9AD5fb" fillOpacity="0.5" />
                        <line x1="30" y1="10" x2="30" y2="20" stroke="#0295f6" strokeWidth="1" strokeOpacity="0.3" />
                        <line x1="50" y1="30" x2="40" y2="30" stroke="#9AD5fb" strokeWidth="1" strokeOpacity="0.3" />
                        <line x1="30" y1="50" x2="30" y2="40" stroke="#0295f6" strokeWidth="1" strokeOpacity="0.3" />
                        <line x1="10" y1="30" x2="20" y2="30" stroke="#9AD5fb" strokeWidth="1" strokeOpacity="0.3" />
                    </svg>
                </div>
            </div>
        </section>
    )
}