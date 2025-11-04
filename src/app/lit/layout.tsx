import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lit Protocol Test'
}

export default function LitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
