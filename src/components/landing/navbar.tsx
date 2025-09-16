import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import Link from "next/link";

export function LandingNavbar() {
    return (<header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Image src="/FILDOS.png" alt="FilDOS Logo" width={32} height={32} className="w-8 h-8" />
                    <h1 className="text-2xl font-bold text-primary tracking-tight">
                        FilDOS
                    </h1>
                </div>
                <nav className="hidden md:flex items-center space-x-6">
                    <Link href="#features" className="text-gray-600 hover:text-primary transition-colors font-medium">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors font-medium">
                        How It Works
                    </Link>
                    <ConnectButton accountStatus="avatar" />
                </nav>
            </div>
        </div>
    </header>
    );
}