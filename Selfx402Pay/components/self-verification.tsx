"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
  countries,
  getUniversalLink,
} from "@selfxyz/qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SelfVerification() {
  const [linkCopied, setLinkCopied] = useState(false);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState("0xc2564e41B7F5Cb66d2d99466450CfebcE9e8228f");

  const excludedCountries = useMemo(() => [countries.ANDORRA], []);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: "Self x402 Pay",
        scope: "self-x402-facilitator",
        endpoint: "https://codalabs.ngrok.io/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "https",
        userIdType: "hex",
        userDefinedData: "Self x402 Payment Verification",
        disclosures: {
          minimumAge: 18,
          ofac: false,
          excludedCountries: [],
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      toast.error("Failed to initialize Self Protocol");
    }
  }, [excludedCountries, userId]);

  const copyToClipboard = () => {
    if (!universalLink) return;

    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        toast.success("Universal link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
    toast.info("Opening Self App...");
  };

  const handleSuccessfulVerification = async (data?: any) => {
    console.log('Verification successful!', data);
    toast.success("Identity verification successful! You now qualify for human pricing (1000x cheaper).");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Self Protocol Verification</CardTitle>
        <CardDescription>
          Scan QR code with Self mobile app to verify your identity and unlock human pricing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* QR Code Display */}
        <div className="flex justify-center">
          {selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={(e) => {
                console.error("Failed to verify identity:", e);
                toast.error("Failed to verify identity");
              }}
            />
          ) : (
            <div className="w-[256px] h-[256px] bg-muted animate-pulse flex items-center justify-center rounded-lg">
              <p className="text-muted-foreground text-sm">Loading QR Code...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={copyToClipboard}
            disabled={!universalLink}
            className="flex-1"
          >
            {linkCopied ? "✓ Copied!" : "Copy Universal Link"}
          </Button>

          <Button
            onClick={openSelfApp}
            disabled={!universalLink}
            className="flex-1"
          >
            Open Self App
          </Button>
        </div>

        {/* User Address Display */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide text-center">
            User Address
          </p>
          <div className="bg-muted rounded-md px-3 py-2 text-center break-all text-xs font-mono border">
            {userId || <span className="text-muted-foreground">Not connected</span>}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
            Why verify?
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Prove you're a unique human (not a bot)</li>
            <li>✓ Pay 1000x less: $0.001 vs $1.00 per request</li>
            <li>✓ Privacy-preserving (zero-knowledge proofs)</li>
            <li>✓ One-time verification (90-day validity)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
