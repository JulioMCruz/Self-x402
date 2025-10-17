import type { Request, Response, NextFunction } from "express";
import axios from "axios";

/**
 * Custom Celo X402 Payment Middleware
 *
 * This middleware handles X402 payment verification for Celo networks using the CeloFacilitator.
 * Unlike the standard x402-express middleware (which only supports Base networks), this
 * implementation works with Celo Mainnet and Celo Sepolia using our custom facilitator.
 */

export interface CeloPaymentConfig {
  payTo: `0x${string}`;
  facilitatorUrl: string;
  routes: Record<string, { price: string; network: string }>;
}

export interface PaymentEnvelope {
  network: string;
  authorization: {
    from: string;
    to: string;
    value: string;
    validAfter: number;
    validBefore: number;
    nonce: string;
  };
  signature: string;
}

/**
 * Creates Celo-compatible X402 payment middleware
 */
export function celoPaymentMiddleware(config: CeloPaymentConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const route = `${req.method} ${req.path}`;
    const routeConfig = config.routes[route];

    // Skip payment check for routes not in the configuration
    if (!routeConfig) {
      return next();
    }

    console.log(`🔍 X402 Payment required for ${route}`);

    try {
      // Get payment header
      const paymentHeader = req.headers['x-payment'] as string;

      if (!paymentHeader) {
        return res.status(402).json({
          error: 'Payment Required',
          message: 'Missing X-Payment header',
          details: {
            route,
            price: routeConfig.price,
            network: routeConfig.network,
            payTo: config.payTo
          }
        });
      }

      // Parse payment envelope
      let envelope: PaymentEnvelope;
      try {
        envelope = JSON.parse(paymentHeader);
      } catch (parseError) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: 'X-Payment header must be valid JSON',
          details: parseError instanceof Error ? parseError.message : String(parseError)
        });
      }

      // Validate payment envelope structure
      if (!envelope.network || !envelope.authorization || !envelope.signature) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: 'Payment envelope missing required fields (network, authorization, signature)'
        });
      }

      // Verify network matches
      if (envelope.network !== routeConfig.network) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: `Network mismatch. Expected ${routeConfig.network}, got ${envelope.network}`
        });
      }

      // Verify payment is to the correct address
      if (envelope.authorization.to.toLowerCase() !== config.payTo.toLowerCase()) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: `Payment must be sent to ${config.payTo}`
        });
      }

      // Verify payment amount matches route price
      const expectedAmount = (parseFloat(routeConfig.price) * 1_000_000).toString(); // Convert USD to USDC smallest unit
      if (envelope.authorization.value !== expectedAmount) {
        return res.status(400).json({
          error: 'Invalid Payment',
          message: `Incorrect payment amount. Expected ${expectedAmount} (${routeConfig.price} USDC), got ${envelope.authorization.value}`
        });
      }

      console.log(`✅ Payment envelope validated, verifying with CeloFacilitator...`);

      // Use custom Celo verification endpoint
      const celoPayload = {
        authorization: envelope.authorization,
        signature: envelope.signature,
        network: envelope.network
      };

      // Verify payment with CeloFacilitator
      const verificationResponse = await axios.post(
        `${config.facilitatorUrl}/verify-celo`,
        celoPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout
        }
      );

      if (!verificationResponse.data || !verificationResponse.data.valid) {
        console.error('❌ Payment verification failed:', verificationResponse.data);
        return res.status(402).json({
          error: 'Payment Verification Failed',
          message: verificationResponse.data?.error || 'Invalid payment signature',
          details: verificationResponse.data
        });
      }

      console.log(`✅ Payment verified successfully for ${route}`);
      console.log(`   From: ${envelope.authorization.from}`);
      console.log(`   Amount: ${envelope.authorization.value} (${routeConfig.price} USDC)`);

      // Settle the payment (execute on-chain transfer)
      console.log(`💳 Settling payment on-chain...`);

      const settlementResponse = await axios.post(
        `${config.facilitatorUrl}/settle-celo`,
        celoPayload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000 // 30 second timeout for blockchain transaction
        }
      );

      if (!settlementResponse.data || !settlementResponse.data.success) {
        console.error('❌ Payment settlement failed:', settlementResponse.data);
        return res.status(402).json({
          error: 'Payment Settlement Failed',
          message: settlementResponse.data?.error || 'Failed to execute payment on-chain',
          details: settlementResponse.data
        });
      }

      console.log(`✅ Payment settled successfully!`);
      console.log(`   Transaction: ${settlementResponse.data.transaction}`);
      console.log(`   Block: ${settlementResponse.data.blockNumber}`);
      console.log(`   Explorer: ${settlementResponse.data.explorer}`);

      // Attach settlement data to request for route handler to access
      (req as any).settlementData = settlementResponse.data;

      // Payment verified and settled, proceed to route handler
      next();

    } catch (error) {
      console.error('❌ Payment middleware error:', error);

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          return res.status(503).json({
            error: 'Service Unavailable',
            message: 'CeloFacilitator is not available. Please ensure it is running.',
            facilitator: config.facilitatorUrl
          });
        }

        if (error.response) {
          return res.status(error.response.status).json({
            error: 'Payment Verification Error',
            message: error.response.data?.error || 'Failed to verify payment',
            details: error.response.data
          });
        }
      }

      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Payment verification failed',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      });
    }
  };
}
