# selfx402-pay-widget

[![npm version](https://badge.fury.io/js/selfx402-pay-widget.svg)](https://www.npmjs.com/package/selfx402-pay-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Self Protocol + x402 payment widget for React applications

A reusable React component library for integrating Self Protocol identity verification and x402 micropayments into your applications. Enable proof-of-unique-human verification with gasless USDC payments on Celo.

**Published by [zkNexus](https://www.zknexus.xyz)** - Proof-of-unique-human verification meets instant micropayments.

## Features

- 🔐 **Self Protocol Integration** - Zero-knowledge proof verification using passport NFC
- 💸 **X402 Payments** - HTTP-native crypto micropayments with USDC
- ⚡ **Gasless Transactions** - EIP-3009 transferWithAuthorization for no gas fees
- 🎨 **Customizable UI** - Built with Radix UI and Tailwind CSS
- 📱 **Mobile-First** - Optimized for Self mobile app integration
- 🔄 **QR & Deep Link** - Multiple verification methods (QR code, universal links)
- 🔥 **Production Ready** - TypeScript, ESM/CJS dual format, tree-shakeable

## Installation

```bash
npm install selfx402-pay-widget
# or
yarn add selfx402-pay-widget
# or
pnpm add selfx402-pay-widget
```

### Peer Dependencies

This library requires React 18+ and the following peer dependencies:

```bash
npm install react react-dom wagmi viem @tanstack/react-query
```

## Quick Start

```tsx
import { PaymentForm } from 'selfx402-pay-widget'
import 'selfx402-pay-widget/styles.css'

function App() {
  return (
    <PaymentForm
      vendorUrl="https://api.yourvendor.com"
      apiEndpoint="/api/protected-resource"
      onPaymentSuccess={(data) => {
        console.log('Payment successful!', data)
      }}
      onPaymentFailure={(error) => {
        console.error('Payment failed:', error)
      }}
    />
  )
}
```

## Components

### PaymentForm

Full-featured payment form with two-column layout, disclosure requirements, and detailed UI.

```tsx
<PaymentForm
  vendorUrl="https://api.vendor.com"
  apiEndpoint="/api/demo"
  showDeepLink={false} // false = QR only, true = deep link only, 'both' = show both, 'hide' = hidden QR + deep link
  onPaymentSuccess={(data) => {
    console.log('TX Hash:', data.txHash)
    console.log('Amount:', data.amount)
    console.log('API Response:', data.apiResponse)
  }}
  onPaymentFailure={(error) => {
    console.error('Payment failed:', error)
  }}
/>
```

### PaymentFormMinimal

Compact single-column payment form optimized for mobile/embedded use.

```tsx
<PaymentFormMinimal
  vendorUrl="https://api.vendor.com"
  apiEndpoint="/api/demo"
  showDeepLink="both"
  onPaymentSuccess={(data) => console.log('Success!', data)}
/>
```

### PaymentSuccess

Transaction success screen with confetti animation.

```tsx
<PaymentSuccess
  txHash="0x123..."
  amount="0.001"
  recipient="Acme Corp"
  payTo="0x742d35Cc..."
  onClose={() => setPaymentComplete(false)}
  apiResponse={{ data: 'Your data here' }}
/>
```

## UI Components

Exported Radix UI components for building custom interfaces:

- `Button` - Customizable button with variants (default, destructive, outline, secondary, ghost, link)
- `Card` - Card container with Header, Title, Description, Content, Footer, Action
- `Input` - Styled text input with focus states
- `Label` - Accessible form label

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '@selfx402/pay-widget'

function CustomForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <Label>Amount</Label>
        <Input type="number" />
        <Button>Pay Now</Button>
      </CardContent>
    </Card>
  )
}
```

## Environment Configuration

### Required Environment Variables

```bash
# Self Protocol Configuration
NEXT_PUBLIC_SELF_ENDPOINT=https://your-backend.ngrok.io/api/verify
NEXT_PUBLIC_SELF_APP_NAME="Your App Name"
NEXT_PUBLIC_SELF_SCOPE="your-unique-scope" # Must match backend

# Vendor API (optional, can be passed as prop)
NEXT_PUBLIC_VENDOR_API_URL=https://api.vendor.com
```

## How It Works

1. **Service Discovery** - Fetches payment configuration from vendor's `/.well-known/x402` endpoint
2. **Self Verification** - User scans QR code with Self mobile app to prove unique humanity
3. **Payment Authorization** - User signs EIP-712 typed data for USDC transfer
4. **Settlement** - Facilitator executes gasless USDC transfer via EIP-3009
5. **API Access** - Protected API endpoint returns data after payment verification

## Network Support

- **Celo Mainnet** (Chain ID: 42220) ✅
- **USDC Contract**: `0xcebA9300f2b948710d2653dD7B07f33A8B32118C`

## API Reference

### PaymentFormProps

```typescript
interface PaymentFormProps {
  vendorUrl?: string // Vendor API base URL (default: NEXT_PUBLIC_VENDOR_API_URL or http://localhost:3000)
  apiEndpoint?: string // Protected API endpoint (default: /api/demo)
  showDeepLink?: boolean | 'both' | 'hide' // QR display mode
  onPaymentSuccess?: (data: PaymentSuccessData) => void
  onPaymentFailure?: (error: Error) => void
}

interface PaymentSuccessData {
  txHash: string // Transaction hash
  amount: string // Payment amount (USD)
  recipient: string // Vendor name
  payTo: string // Vendor wallet address
  apiResponse?: any // Protected API response data
}
```

### PaymentSuccessProps

```typescript
interface PaymentSuccessProps {
  txHash: string
  amount: string
  recipient: string
  payTo: string
  onClose: () => void
  apiResponse?: any
}
```

## Styling

The library uses Tailwind CSS with custom theme variables. Include the stylesheet in your app:

```tsx
import '@selfx402/pay-widget/styles.css'
```

### Custom Theme

Override CSS variables in your global styles:

```css
:root {
  --primary: 210 100% 50%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... */
}
```

## Examples

### With Wagmi Config

```tsx
import { WagmiConfig, createConfig } from 'wagmi'
import { celo } from 'wagmi/chains'
import { PaymentForm } from '@selfx402/pay-widget'

const config = createConfig({
  chains: [celo],
  // ... your wagmi config
})

function App() {
  return (
    <WagmiConfig config={config}>
      <PaymentForm />
    </WagmiConfig>
  )
}
```

### Multiple Display Modes

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'your-ui-library'
import { PaymentForm } from '@selfx402/pay-widget'

function PaymentDemo() {
  return (
    <Tabs defaultValue="regular">
      <TabsList>
        <TabsTrigger value="regular">QR Only</TabsTrigger>
        <TabsTrigger value="deeplink">Deep Link Only</TabsTrigger>
        <TabsTrigger value="both">Both</TabsTrigger>
        <TabsTrigger value="hide">Hidden QR</TabsTrigger>
      </TabsList>

      <TabsContent value="regular">
        <PaymentForm showDeepLink={false} />
      </TabsContent>

      <TabsContent value="deeplink">
        <PaymentForm showDeepLink={true} />
      </TabsContent>

      <TabsContent value="both">
        <PaymentForm showDeepLink="both" />
      </TabsContent>

      <TabsContent value="hide">
        <PaymentForm showDeepLink="hide" />
      </TabsContent>
    </Tabs>
  )
}
```

## Requirements

### Facilitator Service

This library requires a Selfx402Facilitator service for payment verification and settlement. See [Selfx402Facilitator documentation](https://github.com/your-org/selfx402-facilitator) for setup instructions.

### Vendor API

Your vendor API must implement:
- `/.well-known/x402` - Service discovery endpoint
- Payment verification middleware
- Protected API endpoints with x402 headers

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Watch mode for development
npm run dev

# Type check
npm run type-check
```

## License

MIT © Selfx402 Team

## Support

- 📚 [Documentation](https://docs.selfx402.xyz)
- 💬 [Discord](https://discord.gg/selfx402)
- 🐛 [Issues](https://github.com/your-org/selfx402-pay-widget/issues)

## Links

- [Self Protocol Documentation](https://docs.self.xyz)
- [x402 Protocol Specification](https://x402.gitbook.io)
- [Selfx402 Product Definition](https://github.com/your-org/self-x402/blob/main/Docs/SELFX402-PRODUCT-DEFINITION.md)
