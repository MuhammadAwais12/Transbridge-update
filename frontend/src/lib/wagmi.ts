import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, polygon, base, polygonMumbai, baseSepolia, arbitrum, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, polygon, base, polygonMumbai, baseSepolia, arbitrum, arbitrumSepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [polygonMumbai.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
}) 