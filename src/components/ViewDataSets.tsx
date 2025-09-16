// components/ViewProofSets.tsx
"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { Button } from "./ui/button";
import { useDatasets } from "@/hooks/useDatasets";
import { DataSet } from "@/types";
import { DataSetPieceData } from "@filoz/synapse-sdk";

export const ViewDataSets = () => {
  const { isConnected } = useAccount();
  const { data, isLoading: isLoadingDataSets } = useDatasets();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="p-6 bg-white overflow-y-auto">
      <div className="flex justify-between items-center pb-4 border-b">
        <div className="sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">Proof Sets</h3>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your storage data sets
          </p>
        </div>
      </div>

      {isLoadingDataSets ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">Loading data sets...</p>
        </div>
      ) : data && data.datasets && data.datasets.length > 0 ? (
        <div className="mt-4 space-y-6">
          {data.datasets.map((dataset: DataSet | undefined) => 
          dataset && (
            <div
              key={dataset?.clientDataSetId}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Dataset #{dataset?.pdpVerifierDataSetId}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        dataset.isLive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {dataset.isLive ? "Live" : "Inactive"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    With CDN:{" "}
                    <span className={`font-medium `}>
                      {dataset.withCDN ? "⚡ Yes ⚡" : "No"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDP URL:{" "}
                    <span
                      className="cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          dataset.provider?.products.PDP?.data.serviceURL || ""
                        );
                        window.alert("PDP URL copied to clipboard");
                      }}
                    >
                      {dataset.provider?.products.PDP?.data.serviceURL}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Commission: {dataset.commissionBps / 100}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Managed: {dataset.isManaged ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  Piece Details
                </h5>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Current Piece Count
                      </p>
                      <p className="font-medium">{dataset.currentPieceCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Piece ID</p>
                      <p className="font-medium">{dataset.nextPieceId}</p>
                    </div>
                  </div>

                  {dataset.data?.pieces && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="text-sm font-medium text-gray-900">
                          Available Pieces
                        </h6>
                        <p className="text-sm text-gray-500">
                          Next Challenge: Epoch{" "}
                          {dataset.data.nextChallengeEpoch}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {dataset.data.pieces.map((piece) => (
                          <PieceDetails key={piece.pieceId} piece={piece} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">No  datasets found</p>
        </div>
      )}
    </div>
  );
};

/**
 * Component to display a piece and a download button
 */
const PieceDetails = ({ piece }: { piece: DataSetPieceData }) => {
  const { address } = useAccount();

  return (
    <div
      key={piece.pieceId}
      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Piece #{piece.pieceId}</p>
        <p className="text-xs text-gray-500 truncate">{piece.pieceCid.toString()}</p>
      </div>
      <Link href={`https://${address}.calibration.filcdn.io/${piece.pieceCid.toString()}`} target="_blank">
          <Button className="ml-2">
            View
          </Button>
      </Link>
    </div>
  );
};
