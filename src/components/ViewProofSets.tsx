// components/ViewProofSets.tsx
"use client";

import { useAccount } from "wagmi";
import { useProofsets } from "@/hooks/useProofsets";
import { useDownloadRoot } from "@/hooks/useDownloadRoot";
import { ProofSet, Root } from "@/types";

export const ViewProofSets = () => {
  const { isConnected } = useAccount();
  const { data, isLoading: isLoadingProofsets } = useProofsets();

  if (!isConnected) {
    return null;
  }

  return (
    <div className="mt-4 p-6 border rounded-lg bg-white shadow-sm max-h-[900px] overflow-y-auto">
      <div className="flex justify-between items-center pb-4 border-b">
        <div className="sticky top-0 bg-white z-10">
          <h3 className="text-xl font-semibold text-gray-900">Proof Sets</h3>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your storage proof sets
          </p>
        </div>
      </div>

      {isLoadingProofsets ? (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500">Loading proof sets...</p>
        </div>
      ) : data && data.proofsets && data.proofsets.length > 0 ? (
        <div className="mt-4 space-y-6">
          {data.proofsets.map((proofset: ProofSet) => (
            <div
              key={proofset.railId}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    Proof Set #{proofset.railId}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        proofset.isLive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {proofset.isLive ? "Live" : "Inactive"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    With CDN:{" "}
                    <span className={`font-medium `}>
                      {proofset.withCDN ? "⚡ Yes ⚡" : "No"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    PDP URL:{" "}
                    <span
                      className="cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          proofset.details?.pdpUrl || ""
                        );
                        window.alert("PDP URL copied to clipboard");
                      }}
                    >
                      {proofset.details?.pdpUrl}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Commission: {proofset.commissionBps / 100}%
                  </p>
                  <p className="text-sm text-gray-600">
                    Managed: {proofset.isManaged ? "Yes" : "No"}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">
                  Root Details
                </h5>
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        Current Root Count
                      </p>
                      <p className="font-medium">{proofset.currentRootCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Next Root ID</p>
                      <p className="font-medium">{proofset.nextRootId}</p>
                    </div>
                  </div>

                  {proofset.details?.roots && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <h6 className="text-sm font-medium text-gray-900">
                          Available Roots
                        </h6>
                        <p className="text-sm text-gray-500">
                          Next Challenge: Epoch{" "}
                          {proofset.details.nextChallengeEpoch}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {proofset.details.roots.map((root) => (
                          <RootDetails key={root.rootId} root={root} />
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
          <p className="text-gray-500">No proof sets found</p>
        </div>
      )}
    </div>
  );
};

/**
 * Component to display a root and a download button
 */
const RootDetails = ({ root }: { root: Root }) => {
  const filename = `root-${root.rootId}.png`;
  const { downloadMutation } = useDownloadRoot(root.rootCid, filename);

  return (
    <div
      key={root.rootId}
      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">Root #{root.rootId}</p>
        <p className="text-xs text-gray-500 truncate">{root.rootCid}</p>
      </div>
      <button
        onClick={() => downloadMutation.mutate()}
        disabled={downloadMutation.isPending}
        className="ml-4 px-3 py-1 text-sm rounded-lg border-2 border-black cursor-pointer transition-all bg-black text-white hover:bg-white hover:text-black disabled:bg-gray-200 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        {downloadMutation.isPending ? "Downloading..." : "Download"}
      </button>
    </div>
  );
};
