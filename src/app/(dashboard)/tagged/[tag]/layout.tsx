import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> }
): Promise<Metadata> {
  const { tag } = await params;
  
  return {
    title: `Tagged: ${decodeURIComponent(tag)}`
  }
}

export default function TagLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
