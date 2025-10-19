"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PaymentSuccessProps {
  amount: string
  onReset?: () => void
}

export default function PaymentSuccess({ amount, onReset }: PaymentSuccessProps) {
  const [showCheck, setShowCheck] = useState(false)
  const [showContent, setShowContent] = useState(false)

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
          className={`space-y-4 transition-all duration-500 delay-300 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground">Your transaction has been completed</p>
          </div>

          {/* Transaction Details */}
          <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="text-2xl font-bold font-mono text-accent">${amount}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-accent font-semibold">Confirmed</span>
            </div>
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
