"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <Image 
            src="/FILDOS.png" 
            alt="FilDOS" 
            width={48} 
            height={48}
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">FilDOS</h1>
            <p className="text-xs text-muted-foreground">Filecoin Drive OS</p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <ConnectButton accountStatus="avatar" />
        </div>
      </div>
    </nav>
  );
}
