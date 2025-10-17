/**
 * Type definitions for X402 API Template
 */

export interface X402Config {
  payTo: `0x${string}`;
  facilitatorUrl: string;
  network: "base" | "base-sepolia" | "celo" | "celo-sepolia";
  priceUsd: string;
  bazaarDiscoverable: boolean;
}

export interface PaymentRoute {
  price: string;
  network: string;
  discoverable: boolean;
  description: string;
  tags: string[];
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  examples?: RouteExample[];
}

export interface JSONSchema {
  type: string;
  description?: string;
  properties?: Record<string, any>;
  required?: string[];
  items?: any;
  enum?: string[];
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  default?: any;
  examples?: any[];
  format?: string;
  additionalProperties?: boolean | Record<string, any>;
}

export interface RouteExample {
  input: Record<string, any>;
  description: string;
}

// Your custom types for your specific API
export interface YourCustomType {
  // Add your custom types here
  id: string;
  name: string;
  // ... more properties
}

// Request/Response types
export interface ApiResponse<T = any> {
  data: T;
  metadata?: {
    cost: string;
    protocol: string;
    network: string;
    timestamp: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
    total_results: number;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
}
