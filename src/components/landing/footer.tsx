import Image from "next/image";
import { Separator } from "../ui/separator";
import Link from "next/link";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

export function LandingFooter() {
    return (
        <>
            {/* CTA Section */}
            <section className="py-20 bg-primary text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to Experience the Future of Storage?
                    </h2>
                    <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                        Join the semantic revolution and start organizing your files by meaning, not by cryptic identifiers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/get-started">
                            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                                Get Started Now
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link href="/dashboard">
                            <Button size="lg" className="border border-white text-white hover:bg-white hover:text-primary">
                                Try Dashboard
                            </Button>
                        </Link>
                    </div>
                    <iframe width="560" height="315" src="https://www.youtube.com/embed/Qr5B9RzHYEs?si=RUzJAYfpcBvDzMIa" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="flex justify-center m-6 mx-auto border border-white"></iframe>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white pt-12 pb-4">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <Image src="/FILDOS.png" alt="FilDOS Logo" width={32} height={32} className="w-8 h-8" />

                                <h3 className="text-xl font-bold">FilDOS</h3>
                            </div>
                            <p className="text-gray-400">
                                The future of decentralized storage. Semantic, secure, and AI-native.
                            </p>
                        </div>

                        <div className="md:text-right">
                            <h4 className="font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link href="/get-started" className="hover:text-white transition-colors">Get Started</Link></li>
                                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                            </ul>
                        </div>
                    </div>

                    <Separator className="mt-8 mb-4 bg-gray-800" />

                    <div className="text-center text-gray-400">
                        <p>&copy; 2025 FilDOS. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}