import { filecoinCalibration, supportedChains } from "@/utils/chains";
import { client } from "@/utils/client";
import { ChainIcon, ChainProvider, ConnectButton, lightTheme } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";

const wallets = [
    inAppWallet({
        auth: {
            options: [
                "google",
                "farcaster",
                "email",
                "x",
                "passkey",
                "phone",
                "facebook",
                "guest",
            ],
        },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
];

export default function WalletConnectButton() {
    return (
        <>
            <ConnectButton
                chain={filecoinCalibration}
                client={client}
                chains={supportedChains}
                connectButton={{ label: "Sign In" }}
                connectModal={{
                    size: "compact",
                    titleIcon:
                        "https://www.fildos.cloud/FILDOS.png",
                }}
                theme={lightTheme({
                    colors: {
                        accentText: "#0295f6",
                        primaryButtonBg: "#0295f6"
                    },
                })}
                wallets={wallets}
            />
            <ChainProvider chain={filecoinCalibration}>
                <ChainIcon
                    client={client}
                    className="h-auto w-6 rounded-full"
                    loadingComponent={<span>...</span>}
                />
            </ChainProvider>
        </>
    );
}
