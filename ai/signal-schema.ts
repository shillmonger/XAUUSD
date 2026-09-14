/**
 * Signal Schema
 * Defines the expected structure for internal signal intelligence engine results
 * Updated for Deriv Multipliers architecture with new field names
 * AI should output trading intent only - NO Deriv-specific fields
 */

import { z } from 'zod';

/**
 * Zod schema for validating signal extraction results
 * AI outputs only trading intent - backend resolves Deriv-specific fields
 */
export const SignalExtractionSchema = z.object({
  isValidSignal: z.boolean(),
  asset: z.string().optional(),  // was: symbol
  direction: z.enum(['BUY', 'SELL']).optional(),
  sourceOrderType: z.enum(['MARKET', 'LIMIT', 'STOP']).optional(),  // was: orderType
  sourceEntryPrice: z.number().optional(),  // was: entry
  stopLoss: z.number().optional(),
  takeProfits: z.array(z.number()).optional(),
  stake: z.number().optional(),  // was: lotSize
});

/**
 * Type inference from the schema
 */
export type SignalExtractionResult = z.infer<typeof SignalExtractionSchema>;

/**
 * Validate signal extraction result against the schema
 * @param data - The signal extraction result to validate
 * @returns Validated result or throws error
 */
export function validateSignalExtraction(data: unknown): SignalExtractionResult {
  return SignalExtractionSchema.parse(data);
}

/**
 * Safely validate signal extraction result against the schema
 * @param data - The signal extraction result to validate
 * @returns Result object with success flag and either data or error
 */
export function safeValidateSignalExtraction(data: unknown): {
  success: boolean;
  data?: SignalExtractionResult;
  error?: string;
} {
  try {
    const validated = validateSignalExtraction(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Handle ZodError with proper type safety
      const errorMessages = error.issues.map((issue: { message: string }) => issue.message).join(', ');
      return {
        success: false,
        error: `Schema validation failed: ${errorMessages}`
      };
    }
    return {
      success: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Schema for deterministic signal validation result
 * Added fields for LIMIT rejection support
 */
export const SignalValidationSchema = z.object({
  isValid: z.boolean(),
  reason: z.string().optional(),
  isLimitRejected: z.boolean().optional(),  // NEW
  rejectionDetails: z.object({
    reason: z.string().optional(),
    originalSignal: SignalExtractionSchema.optional(),
  }).optional(),
  validatedSignal: SignalExtractionSchema.optional(),
});

/**
 * Type inference from validation schema
 */
export type SignalValidationResult = z.infer<typeof SignalValidationSchema>;

/**
 * Validate signal validation result
 */
export function validateSignalValidation(data: unknown): SignalValidationResult {
  return SignalValidationSchema.parse(data);
}

/**
 * Safely validate signal validation result
 */
export function safeValidateSignalValidation(data: unknown): {
  success: boolean;
  data?: SignalValidationResult;
  error?: string;
} {
  try {
    const validated = validateSignalValidation(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue: { message: string }) => issue.message).join(', ');
      return {
        success: false,
        error: `Validation failed: ${errorMessages}`
      };
    }
    return {
      success: false,
      error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}