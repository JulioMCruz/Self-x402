"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { toast } from "sonner"

interface PaymentSuccessProps {
  amount: string
  onReset?: () => void
  txHash?: string
  recipient?: string
  payTo?: string
  apiResponse?: any
}

export default function PaymentSuccess({ amount, onReset, txHash, recipient, payTo, apiResponse }: PaymentSuccessProps) {
  const [showCheck, setShowCheck] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [copiedTxHash, setCopiedTxHash] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    // Animate checkmark first
    const checkTimer = setTimeout(() => setShowCheck(true), 100)
    // Then show content
    const contentTimer = setTimeout(() => setShowContent(true), 600)

    return () => {
      clearTimeout(checkTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  const explorerUrl = txHash ? `https://celoscan.io/tx/${txHash}` : null
  const addressExplorerUrl = payTo ? `https://celoscan.io/address/${payTo}` : null

  // Format transaction hash for display (first 6 + last 4 characters)
  const formatTxHash = (hash: string) => {
    if (hash.length < 12) return hash
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  // Format address for display
  const formatAddress = (address: string) => {
    if (address.length < 12) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string, type: 'txHash' | 'address') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'txHash') {
        setCopiedTxHash(true)
        setTimeout(() => setCopiedTxHash(false), 2000)
      } else {
        setCopiedAddress(true)
        setTimeout(() => setCopiedAddress(false), 2000)
      }
      toast.success("Copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy")
    }
  }

  return (
    <div className="w-full max-w-md bg-card border-2 border-border rounded-3xl p-8 lg:p-12">
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        {/* Animated Checkmark */}
        <div
          className={`relative transition-all duration-500 ${
            showCheck ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        >
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
          <CheckCircle2 className="w-24 h-24 text-accent relative z-10" strokeWidth={2} />
        </div>

        {/* Success Content */}
        <div
          className={`space-y-4 transition-all duration-500 delay-300 w-full ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground">Your transaction has been completed on Celo</p>
          </div>

          {/* Transaction Details */}
          <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
            {/* Amount */}
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-2xl font-bold font-mono text-accent">${amount} USDC</span>
            </div>

            {/* Recipient */}
            {recipient && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Recipient</span>
                <span className="font-semibold">{recipient}</span>
              </div>
            )}

            {/* Network */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-semibold">Celo Mainnet</span>
            </div>

            {/* Payment Method */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold">x402 (Gasless)</span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-accent font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Confirmed
              </span>
            </div>

            {/* Recipient Address */}
            {payTo && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Paid To</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-foreground">{formatAddress(payTo)}</code>
                    <button
                      onClick={() => copyToClipboard(payTo, 'address')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy address"
                    >
                      {copiedAddress ? (
                        <Check className="w-3 h-3 text-accent" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    {addressExplorerUrl && (
                      <a
                        href={addressExplorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-muted rounded transition-colors"
                        title="View address on CeloScan"
                      >
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            {txHash && (
              <div className="pt-2 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-foreground">{formatTxHash(txHash)}</code>
                    <button
                      onClick={() => copyToClipboard(txHash, 'txHash')}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="Copy transaction hash"
                    >
                      {copiedTxHash ? (
                        <Check className="w-3 h-3 text-accent" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                    <a
                      href={explorerUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title="View on CeloScan"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  </div>
                </div>
                <a
                  href={explorerUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors pt-2"
                >
                  View Full Details on CeloScan
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>

          {/* Logo */}
          <div className="pt-4">
            <Image src="/logo.png" alt="Self x Pay" width={160} height={48} className="mx-auto opacity-60" />
          </div>

          {/* Reset Button */}
          {onReset && (
            <Button onClick={onReset} variant="outline" className="w-full mt-4 bg-transparent">
              Make Another Payment
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
