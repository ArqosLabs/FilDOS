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
            <div className="max-w-7xl space-y-4 sm:space-y-6 p-3 sm:p-6">
                {/* Header */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                            <div className="space-y-2 flex-1">
                                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                                    <Server className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                                    <span className="break-words">Storage Providers</span>
                                </CardTitle>
                                <CardDescription className="text-xs sm:text-sm">
                                    Browse and explore active storage providers on the Filecoin network
                                </CardDescription>
                            </div>
                            <Link href="/storage">
                                <Button variant="outline" size="sm" className="text-xs sm:text-sm w-full sm:w-auto">
                                    ← Back to Storage Dashboard
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                </Card>

                {/* All Active Providers List */}
                <Card>
                    <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Database className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            Active Providers
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            {providers?.length || 0} active storage providers available
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <Badge variant="outline" className="mb-2 text-xs">
                            Note: Additional cost may be required to use with CDN
                        </Badge>
                        {providersLoading && (
                            <div className="flex items-center justify-center py-8 sm:py-12">
                                <div className="text-center space-y-3">
                                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Loading providers...</p>
                                </div>
                            </div>
                        )}

                        {providersError && (
                            <Card className="border-red-200 bg-red-50">
                                <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                                    <div className="text-center py-4">
                                        <XCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 mx-auto mb-3" />
                                        <p className="text-sm sm:text-base text-red-800 font-medium">Failed to load providers</p>
                                        <p className="text-xs sm:text-sm text-red-700 mt-2 break-words">
                                            {providersError.message}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {providers && providers.length === 0 && (
                            <div className="text-center py-8 sm:py-12">
                                <Server className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm sm:text-base text-muted-foreground">No active providers found</p>
                            </div>
                        )}

                        {providers && providers.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {providers.map((provider) => (
                                    <Card
                                        key={provider.id}
                                        className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                                        onClick={() => handleProviderClick(provider)}
                                    >
                                        <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 p-3 sm:p-6">
                                            <div className="space-y-2 sm:space-y-3">
                                                {/* Header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-semibold text-sm sm:text-base break-words">{provider.name || `Provider ${provider.id}`}</h3>
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
                                                                <Badge variant="outline" className="text-xs truncate max-w-full">
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
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <Server className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                <span className="break-words">Provider Details - ID: {selectedProviderId}</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm">
                                Detailed information about the storage provider
                            </DialogDescription>
                        </DialogHeader>

                        {selectedProvider ? (
                            <div className="space-y-4 sm:space-y-6">
                                {/* Status Badge */}
                                <div className="flex items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30">
                                    <span className="text-xs sm:text-sm font-medium">Status</span>
                                    {isActive !== undefined && (
                                        <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
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
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-base sm:text-lg font-semibold">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                            <span className="text-xs sm:text-sm font-medium">Name</span>
                                            <span className="text-xs sm:text-sm break-words">{selectedProvider.name || "N/A"}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                            <span className="text-xs sm:text-sm font-medium">Provider ID</span>
                                            <span className="text-xs sm:text-sm font-mono">{selectedProvider.id}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex flex-col items-start justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                            <span className="text-xs sm:text-sm font-medium">Provider Address</span>
                                            <span className="text-xs sm:text-sm font-mono break-all w-full">
                                                {selectedProvider.serviceProvider}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-start justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                            <span className="text-xs sm:text-sm font-medium">Payee Address</span>
                                            <span className="text-xs sm:text-sm font-mono break-all w-full">
                                                {selectedProvider.payee}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedProvider.description && (
                                        <div className="p-3 sm:p-4 rounded-sm border bg-muted/30">
                                            <Label className="text-xs sm:text-sm font-medium">Description</Label>
                                            <p className="text-xs sm:text-sm mt-2 text-muted-foreground break-words">{selectedProvider.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* PDP Service Details */}
                                {pdpService && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3 sm:space-y-4">
                                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                                <Database className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                                                PDP Service Configuration
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Globe className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Service URL</span>
                                                    </div>
                                                    <a
                                                        href={pdpService.offering.serviceURL}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        View
                                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                    </a>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Location</span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm">{pdpService.offering.location || "N/A"}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Storage Price</span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm break-words">{formatPrice(pdpService.offering.storagePricePerTibPerMonth)}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Min Proving Period</span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm">{pdpService.offering.minProvingPeriodInEpochs} epochs</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Min Piece Size</span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm">{formatBytes(pdpService.offering.minPieceSizeInBytes)}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <HardDrive className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm font-medium">Max Piece Size</span>
                                                    </div>
                                                    <span className="text-xs sm:text-sm">{formatBytes(pdpService.offering.maxPieceSizeInBytes)}</span>
                                                </div>
                                            </div>

                                            {/* IPNI Support */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <span className="text-xs sm:text-sm font-medium">IPNI Piece Support</span>
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
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 rounded-sm border bg-muted/30 gap-2">
                                                    <span className="text-xs sm:text-sm font-medium">IPNI IPFS Support</span>
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
                                                <div className="p-3 sm:p-4 rounded-sm border bg-muted/30">
                                                    <Label className="text-xs sm:text-sm font-medium mb-3 block">Capabilities</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(pdpService.capabilities).map(([key, value]) => (
                                                            <Badge key={key} variant="outline" className="text-xs break-all">
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
                            <div className="flex items-center justify-center py-8 sm:py-12">
                                <div className="text-center space-y-3">
                                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Loading provider details...</p>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
