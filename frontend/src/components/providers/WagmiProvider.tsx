import { WagmiProvider as WagmiProviderBase } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../../lib/wagmi'

interface WagmiProviderProps {
  children: React.ReactNode
}

const queryClient = new QueryClient()

export function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiProviderBase config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderBase>
  )
} 