import { ReasoningStyle, ReasoningMetadata, MathVerificationItem } from '../types';

export interface ReasoningServerStatus {
  connected: boolean;
  provider: string;
  model: string;
  message: string;
  latencyMs?: number;
  config?: {
    provider: string;
    model: string;
    baseUrl?: string;
  };
  error?: string;
}

export interface ReasoningTurnResult {
  answer: string;
  provider: string;
  model: string;
  style: ReasoningStyle;
  verifiedResults: MathVerificationItem[];
  status: 'success' | 'server_unavailable' | 'error';
  errorMessage?: string;
}

/**
 * Checks connection to the reasoning server
 */
export async function checkReasoningServerStatus(): Promise<ReasoningServerStatus> {
  try {
    const res = await fetch('/api/ai/reasoning/status');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        connected: false,
        provider: 'Unavailable',
        model: 'unknown',
        message: err.error || 'Server responded with error status',
        error: err.error
      };
    }
    return await res.json();
  } catch (e: any) {
    return {
      connected: false,
      provider: 'Connection Error',
      model: 'unknown',
      message: e.message || 'Failed to reach reasoning server',
      error: e.message
    };
  }
}

/**
 * Executes an Advanced Mathematical Reasoning & Engineering turn
 */
export async function executeReasoningTurn(params: {
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  style?: ReasoningStyle;
  attachment?: { mimeType: string; data: string };
  userContext?: any;
  enableVerification?: boolean;
}): Promise<ReasoningTurnResult> {
  const res = await fetch('/api/ai/reasoning-turn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.errorMessage || `Reasoning server error (${res.status})`);
  }

  return await res.json();
}

/**
 * Direct independent mathematical verification call
 */
export async function verifyMathExpression(params: {
  operation: 'diff' | 'simplify' | 'evaluate' | 'units' | 'matrix' | 'integrate';
  expression: string;
  variable?: string;
  values?: Record<string, number | string>;
  targetUnit?: string;
  matrixA?: number[][];
}): Promise<MathVerificationItem> {
  const res = await fetch('/api/ai/math-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.details || err.error || 'Math verification failed');
  }

  return await res.json();
}
