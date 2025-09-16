import { Bot, Brain, Cpu, FileText, Folder, Lock, Package, Search, Shield, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export function LandingAbout() {
    return (
        <>
            <section className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold mb-6 text-gray-900">What Is It?</h2>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            <strong>FilDOS</strong> is a decentralized drive built on Filecoin that lets users{" "}
                            <span className="font-semibold text-primary">store, search, and share files by meaning</span>, not by raw identifiers like CIDs.
                        </p>
                        <br />
                        <p className="text-lg text-gray-600 leading-relaxed">
                            It offers <strong>AI-native</strong>, and{" "}
                            <strong>agent-compatible</strong> file access — turning decentralized storage into a{" "}
                            <span className="font-semibold text-primary">human-first semantic memory layer.</span>
                        </p>
                    </div>
                </div>
            </section>

            <section id="features" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">What makes us different?</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Revolutionary features that make FilDOS the future of decentralized storage
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <Card className="border-2 border-secondary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Folder className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-xl">NFT-Based Folders</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm">
                                    Folders are NFTs with metadata, embedding indexes, and access logic — enabling true ownership, composability, and programmable access.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-xl">Meaning-First Search</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm">
                                    Users search semantically: &ldquo;photo of a village,&rdquo; powered by auto-generated embeddings (CLIP/Sentence Transformers) and vector search.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-secondary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bot className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-xl">Agent & AI-Native</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm">
                                    Programmatic access for AI systems to organise, access and tag files — turning FilDOS into a semantic memory layer.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <CardTitle className="text-xl">User Experience</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm">
                                    Abstracts away complexity of decentralized storage with a sleek, intuitive web interface and seamless wallet integration.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>


            {/* FolderNFT Section */}
            <section className="py-20 bg-secondary/10">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">FolderNFT: Web3-Native File Organization</h2>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Folders are not just file paths — they are <strong>NFTs with embedded logic</strong>
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <Shield className="w-6 h-6 text-primary" />
                                        <CardTitle>Ownership</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">NFT defines who controls folder</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <Lock className="w-6 h-6 text-primary" />
                                        <CardTitle>Access</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">View/edit based on ownership or delegation</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <Cpu className="w-6 h-6 text-primary" />
                                        <CardTitle>Programmability</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">Smart contract logic for share, revoke, publish</p>
                                </CardContent>
                            </Card>

                            <Card className="border-2 border-secondary/20 bg-white/80 backdrop-blur-sm">
                                <CardHeader>
                                    <div className="flex items-center space-x-2">
                                        <FileText className="w-6 h-6 text-primary" />
                                        <CardTitle>Metadata</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">Tags, summaries, embedding index</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4 text-gray-900">Flow of Interaction</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Simple steps to get your semantic storage up and running
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-3">
                            {[
                                {
                                    step: "1",
                                    title: "User buys storage → creates FolderNFTs",
                                    icon: Users,
                                    color: "bg-primary"
                                },
                                {
                                    step: "2",
                                    title: "Upload file → client encrypts → pushes to Filecoin Storage Providers",
                                    icon: Shield,
                                    color: "bg-secondary"
                                },
                                {
                                    step: "3",
                                    title: "Generates embeddings, tags",
                                    icon: Brain,
                                    color: "bg-primary"
                                },
                                {
                                    step: "4",
                                    title: "FolderNFT metadata updates with file entry",
                                    icon: Folder,
                                    color: "bg-secondary"
                                },
                                {
                                    step: "5",
                                    title: "Search via query like: notes from DAO call",
                                    icon: Search,
                                    color: "bg-primary"
                                }
                            ].map((item, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white font-bold`}>
                                        {item.step}
                                    </div>
                                        <div className="flex items-center align-middle my-auto space-x-3">
                                            <item.icon className="w-6 h-6 text-gray-600" />
                                            <h3 className="text-sm text-gray-900">{item.title}</h3>
                                        </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}