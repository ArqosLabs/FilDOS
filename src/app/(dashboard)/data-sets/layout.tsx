import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Data Sets'
}

export default function DataSetsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
