"use client";

import { useState } from "react";
import {
    useActiveProviders,
    useProvider,
    usePDPService,
    useIsProviderActive
} from "@/hooks/useSPRegistry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Server,
    MapPin,
    DollarSign,
    HardDrive,
    CheckCircle,
    XCircle,
    Database,
    Globe,
    Activity,
    ExternalLink
} from "lucide-react";
import { formatUnits } from "viem";
import type { ProviderInfo } from "@filoz/synapse-sdk/sp-registry";
import Link from "next/link";

export default function StorageProvidersPage() {
    const [selectedProviderId, setSelectedProviderId] = useState<number>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: providers, isLoading: providersLoading, error: providersError } = useActiveProviders();
    const { data: selectedProvider } = useProvider(selectedProviderId);
    const { data: pdpService } = usePDPService(selectedProviderId);
    const { data: isActive } = useIsProviderActive(selectedProviderId);

    const handleProviderClick = (provider: ProviderInfo) => {
        setSelectedProviderId(provider.id);
        setIsModalOpen(true);
    };

    const formatPrice = (price: bigint) => {
        const priceInUSDFC = Number(formatUnits(price, 18));
        return `${priceInUSDFC.toFixed(2)} USDFC/TiB/Month`;
    };

    const formatBytes = (bytes: bigint) => {
        const size = Number(bytes);
        if (size >= 1024 ** 4) return `${(size / 1024 ** 4).toFixed(2)} TiB`;
        if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GiB`;
        if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(2)} MiB`;
        if (size >= 1024) return `${(size / 1024).toFixed(2)} KiB`;
        return `${size} Bytes`;
    };

    return (
        <div className="flex-1 overflow-auto">
            <div className="max-w-7xl space-y-6 p-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    <Server className="h-6 w-6" />
                                    Storage Providers
                                </CardTitle>
                                <CardDescription>
                                    Browse and explore active storage providers on the Filecoin network
                                </CardDescription>
                            </div>
                            <Link href="/storage">
                                <Button variant="outline" size="sm">
                                    ← Back to Storage Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                {/* All Active Providers List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Active Providers
                        </CardTitle>
                        <CardDescription>
                            {providers?.length || 0} active storage providers available
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Badge variant="outline" className="mb-2">
                            Note: Additional cost may be required to use with CDN
                        </Badge>
                        {providersLoading && (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-sm text-muted-foreground">Loading providers...</p>
                                </div>
                            </div>
                        )}

                        {providersError && (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="pt-6">
                                    <div className="text-center py-4">
                                        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
                                        <p className="text-red-800 font-medium">Failed to load providers</p>
                                        <p className="text-sm text-red-700 mt-2">
                                            {providersError.message}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {providers && providers.length === 0 && (
                            <div className="text-center py-12">
                                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No active providers found</p>
                            </div>
                        )}

                        {providers && providers.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {providers.map((provider) => (
                                    <Card
                                        key={provider.id}
                                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                                        onClick={() => handleProviderClick(provider)}
                                    >
                                        <CardContent className="pt-4 pb-4">
                                            <div className="space-y-3">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-semibold text-base truncate">{provider.name || `Provider ${provider.id}`}</h3>
                                                            {provider.active && (
                                                                <Badge variant="default" className="text-xs flex-shrink-0">
                                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                                    Active
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Server className="h-3 w-3 flex-shrink-0" />
                                                            <span>ID: {provider.id}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Address */}
                                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                    <Globe className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                    <span className="font-mono break-all line-clamp-1">{provider.serviceProvider}</span>
                                                </div>

                                                {/* Description */}
                                                {provider.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {provider.description}
                                                    </p>
                                                )}

                                                {/* PDP Service Info & Button */}
                                                <div className="flex items-center justify-between gap-2 pt-1">
                                                    {provider.products.PDP && (
                                                        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                                                            <Badge variant="outline" className="text-xs">
                                                                <Database className="h-3 w-3 mr-1" />
                                                                PDP
                                                            </Badge>
                                                            {provider.products.PDP.data.storagePricePerTibPerMonth && (
                                                                <Badge variant="outline" className="text-xs truncate">
                                                                    {formatPrice(provider.products.PDP.data.storagePricePerTibPerMonth)}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Provider Details Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                Provider Details - ID: {selectedProviderId}
                            </DialogTitle>
                            <DialogDescription>
                                Detailed information about the storage provider
                            </DialogDescription>
                        </DialogHeader>

                        {selectedProvider ? (
                            <div className="space-y-6">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                    <span className="text-sm font-medium">Status</span>
                                    {isActive !== undefined && (
                                        <Badge variant={isActive ? "default" : "secondary"}>
                                            {isActive ? (
                                                <>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Inactive
                                                </>
                                            )}
                                        </Badge>
                                    )}
                                </div>

                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                            <span className="text-sm font-medium">Name</span>
                                            <span className="text-sm">{selectedProvider.name || "N/A"}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                            <span className="text-sm font-medium">Provider ID</span>
                                            <span className="text-sm font-mono">{selectedProvider.id}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between p-4 rounded-sm border bg-muted/30">
                                            <span className="text-sm font-medium">Provider Address</span>
                                            <span className="text-sm font-mono break-all text-right max-w-md">
                                                {selectedProvider.serviceProvider}
                                            </span>
                                        </div>
                                        <div className="flex items-start justify-between p-4 rounded-sm border bg-muted/30">
                                            <span className="text-sm font-medium">Payee Address</span>
                                            <span className="text-sm font-mono break-all text-right max-w-md">
                                                {selectedProvider.payee}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedProvider.description && (
                                        <div className="p-4 rounded-sm border bg-muted/30">
                                            <Label className="text-sm font-medium">Description</Label>
                                            <p className="text-sm mt-2 text-muted-foreground">{selectedProvider.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* PDP Service Details */}
                                {pdpService && (
                                    <>
                                        <Separator />
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                <Database className="h-5 w-5" />
                                                PDP Service Configuration
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Service URL</span>
                                                    </div>
                                                    <a
                                                        href={pdpService.offering.serviceURL}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        View
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Location</span>
                                                    </div>
                                                    <span className="text-sm">{pdpService.offering.location || "N/A"}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Storage Price</span>
                                                    </div>
                                                    <span className="text-sm">{formatPrice(pdpService.offering.storagePricePerTibPerMonth)}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Min Proving Period</span>
                                                    </div>
                                                    <span className="text-sm">{pdpService.offering.minProvingPeriodInEpochs} epochs</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Min Piece Size</span>
                                                    </div>
                                                    <span className="text-sm">{formatBytes(pdpService.offering.minPieceSizeInBytes)}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium">Max Piece Size</span>
                                                    </div>
                                                    <span className="text-sm">{formatBytes(pdpService.offering.maxPieceSizeInBytes)}</span>
                                                </div>
                                            </div>

                                            {/* IPNI Support */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <span className="text-sm font-medium">IPNI Piece Support</span>
                                                    {pdpService.offering.ipniPiece ? (
                                                        <Badge variant="default" className="text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Supported
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Not Supported
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between p-4 rounded-sm border bg-muted/30">
                                                    <span className="text-sm font-medium">IPNI IPFS Support</span>
                                                    {pdpService.offering.ipniIpfs ? (
                                                        <Badge variant="default" className="text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Supported
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <XCircle className="h-3 w-3 mr-1" />
                                                            Not Supported
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Capabilities */}
                                            {Object.keys(pdpService.capabilities).length > 0 && (
                                                <div className="p-4 rounded-sm border bg-muted/30">
                                                    <Label className="text-sm font-medium mb-3 block">Capabilities</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(pdpService.capabilities).map(([key, value]) => (
                                                            <Badge key={key} variant="outline">
                                                                {key}: {value}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center space-y-3">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-sm text-muted-foreground">Loading provider details...</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
