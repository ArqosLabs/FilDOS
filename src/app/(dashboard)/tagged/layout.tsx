import { ReactNode } from "react";
import type { Metadata } from 'next'

interface TaggedLayoutProps {
  children: ReactNode;
}

export async function generateMetadata(
  { params }: { params: Promise<{ tag: string }> }
): Promise<Metadata> {
  const { tag } = await params;
  
  return {
    title: `Tagged: ${decodeURIComponent(tag)}`
  }
}

export default function TaggedLayout({ children }: TaggedLayoutProps) {
  return <>{children}</>;
}