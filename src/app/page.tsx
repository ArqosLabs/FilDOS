"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { 
  Search, 
  Brain, 
  Shield, 
  Folder, 
  Bot, 
  Package, 
  FileText, 
  Users, 
  Lock, 
  ArrowRight,
  Database,
  Cpu,
  Globe
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Image src="/FILDOS.png" alt="FILDOS Logo" width={32} height={32} className="w-8 h-8" />
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                FILDOS
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="#features" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Features
              </Link>
              <Link href="#architecture" className="text-gray-600 hover:text-primary transition-colors font-medium">
                Architecture
              </Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors font-medium">
                How It Works
              </Link>
              <ConnectButton accountStatus="avatar" />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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
              <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-1 shadow border border-white/30">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill="#0295f6" fillOpacity="0.12"/><path d="M8 14h12M14 8v12" stroke="#0295f6" strokeWidth="2" strokeLinecap="round"/></svg>
                <span className="font-mono text-primary text-sm">Semantic Search</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-1 shadow border border-white/30">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="6" fill="#0295f6" fillOpacity="0.12"/><path d="M9 14h10M14 9v10" stroke="#9AD5fb" strokeWidth="2" strokeLinecap="round"/></svg>
                <span className="font-mono text-primary text-sm">NFT Folders</span>
              </div>
              <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-1 shadow border border-white/30">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="14" rx="12" ry="8" fill="#0295f6" fillOpacity="0.10"/><ellipse cx="14" cy="14" rx="7" ry="4" fill="#9AD5fb" fillOpacity="0.18"/></svg>
                <span className="font-mono text-primary text-sm">AI-Native</span>
              </div>
            </div>
            <p className="text-xl md:text-2xl text-white/90 mb-6 max-w-2xl text-center animate-fade-in-up delay-200">
              <span className="italic text-white/70">&ldquo;Forget CIDs. Access your files like you think &mdash; by meaning.&rdquo;</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
              <Link href="/get-started">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg px-8 py-4 text-lg font-semibold">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" className="border border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold">
                  Go to Dashboard
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

      {/* What Is It Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">What Is It?</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              <strong>FILDOS</strong> is a decentralized drive built on Filecoin that lets users{" "}
              <span className="font-semibold text-primary">store, search, and share files by meaning</span>, not by raw identifiers like CIDs.
            </p>
            <br />
            <p className="text-lg text-gray-600 leading-relaxed">
              It offers <strong>AI-native</strong>, and{" "}
              <strong>agent-compatible</strong> file access — turning decentralized storage into a{" "}
              <span className="font-semibold text-primary">human-first semantic memory layer.</span>
            </p>
          </div>
        </div>
      </section>

      {/* Core Innovations */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Core Innovations</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Revolutionary features that make FILDOS the future of decentralized storage
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Folder className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">NFT-Based Folders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Folders are NFTs with metadata, embedding indexes, and access logic — enabling true ownership, composability, and programmable access.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Meaning-First Search</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Users search semantically: &ldquo;photo of a village,&rdquo; powered by auto-generated embeddings (CLIP/Sentence Transformers) and vector search.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Agent & AI-Native</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  AI agents can own folders, generate content, and respond to natural language queries.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">Drive Capsules</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Every file becomes a capsule: encrypted data + metadata + embeddings — enabling portability and provenance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Architecture Stack */}
      <section id="architecture" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Architecture Stack</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built on cutting-edge decentralized technologies for maximum security and performance
            </p>
          </div>
          <Image src="/Archi.jpeg" alt="Architecture Diagram" width={1200} height={600} className="mx-auto mb-12 rounded-lg" />
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Storage</h3>
                  <p className="text-gray-600">Filecoin</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Folders</h3>
                  <p className="text-gray-600">ERC-721 NFTs</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Embedding</h3>
                  <p className="text-gray-600">Sentence Transformers / CLIP</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Search Index</h3>
                  <p className="text-gray-600">Local + Optional zk-ANN</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-6 bg-gray-50 rounded-lg md:col-span-2">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Distribution</h3>
                  <p className="text-gray-600">FileCDN</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FolderNFT Section */}
      <section className="py-20 bg-secondary/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">FolderNFT: Web3-Native File Org</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Folders are not just file paths — they are <strong>NFTs with embedded logic</strong>
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-6 h-6 text-primary" />
                    <CardTitle>Ownership</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">NFT defines who controls folder</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-6 h-6 text-secondary" />
                    <CardTitle>Access</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">View/edit based on ownership or delegation</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-primary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-6 h-6 text-primary" />
                    <CardTitle>Programmability</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Smart contract logic for share, revoke, publish</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-6 h-6 text-secondary" />
                    <CardTitle>Metadata</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Tags, summaries, embedding index</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">Flow of Interaction</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to get your semantic storage up and running
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "User buys storage → creates FolderNFTs",
                  icon: Users,
                  color: "bg-primary"
                },
                {
                  step: "2", 
                  title: "Upload file → client encrypts → pushes to Filecoin Storage Providers",
                  icon: Shield,
                  color: "bg-secondary"
                },
                {
                  step: "3",
                  title: "Generates embeddings, tags",
                  icon: Brain,
                  color: "bg-primary"
                },
                {
                  step: "4",
                  title: "FolderNFT metadata updates with file entry",
                  icon: Folder,
                  color: "bg-secondary"
                },
                {
                  step: "5",
                  title: "Search via query like: notes from DAO call",
                  icon: Search,
                  color: "bg-primary"
                }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-6 p-6 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white font-bold`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-6 h-6 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Experience the Future of Storage?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join the semantic revolution and start organizing your files by meaning, not by cryptic identifiers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/get-started">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" className="border border-white text-white hover:bg-white hover:text-primary">
                Try Dashboard
              </Button>
            </Link>
          </div>
          <iframe width="560" height="315" src="https://www.youtube.com/embed/Qr5B9RzHYEs?si=RUzJAYfpcBvDzMIa" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="flex justify-center m-6 mx-auto border border-white"></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/FILDOS.png" alt="FILDOS Logo" width={32} height={32} className="w-8 h-8" />
              
                <h3 className="text-xl font-bold">FILDOS</h3>
              </div>
              <p className="text-gray-400">
                The future of decentralized storage. Semantic, secure, and AI-native.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/get-started" className="hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#architecture" className="hover:text-white transition-colors">Architecture</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Technology</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Built on Filecoin</li>
                <li>ERC-721 NFTs</li>
                <li>AI-Powered Search</li>
                <li>FilCDN</li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8 bg-gray-800" />
          
          <div className="text-center text-gray-400">
            <p>&copy; 2025 FILDOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
