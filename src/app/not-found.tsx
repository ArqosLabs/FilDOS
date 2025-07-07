import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Home, FileQuestion, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/FILDOS.png" alt="FILDOS Logo" width={32} height={32} className="w-8 h-8" />
              <h1 className="text-2xl font-bold text-primary tracking-tight">
                FILDOS
              </h1>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Back Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Animated 404 Icon */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse"></div>
              <div className="absolute inset-4 bg-primary/20 rounded-full animate-ping"></div>
              <div className="absolute inset-8 bg-primary/30 rounded-full flex items-center justify-center">
                <FileQuestion className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 animate-bounce">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="absolute -bottom-2 -left-6 animate-float">
              <div className="w-6 h-6 bg-primary rounded-full opacity-60"></div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
              404 - Page Not Found
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
              Oops! Lost in the
              <span className="text-primary block">Semantic Space</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed">
              The page you&apos;re looking for doesn&apos;t exist yet, but our AI-native storage revolution is 
              <span className="font-semibold text-primary"> coming soon!</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <Link href="/get-started">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Help Text */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Looking for something specific? Try our{" "}
              <Link href="/" className="text-primary hover:underline font-medium">
                semantic search
              </Link>{" "}
              or explore our{" "}
              <Link href="/dashboard" className="text-primary hover:underline font-medium">
                dashboard
              </Link>
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}
