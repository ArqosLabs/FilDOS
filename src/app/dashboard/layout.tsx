import Sidebar from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
            <div className="flex h-screen">
            <Sidebar />
                {children}
            </div>
  );
}
