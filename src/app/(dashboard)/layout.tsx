import Navbar from "@/components/Navbar";
import Sidebar from "@/components/sidebar";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Drive'
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
