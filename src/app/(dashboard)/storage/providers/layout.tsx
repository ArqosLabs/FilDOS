import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Storage Providers'
}

export default function StorageProvidersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
