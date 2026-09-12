/**
 * Signal Schema
 * Defines the expected structure for internal signal intelligence engine results
 * This schema is used for validation of signal extraction results
 */

import { z } from 'zod';

/**
 * Zod schema for validating signal extraction results
 */
export const SignalExtractionSchema = z.object({
  isValidSignal: z.boolean(),
  symbol: z.string().optional(),
  direction: z.enum(['BUY', 'SELL']).optional(),
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP']).optional(),
  entry: z.number().optional(), // Optional - not present for MARKET orders
  stopLoss: z.number().optional(),
  takeProfits: z.array(z.number()).optional(),
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
 */
export const SignalValidationSchema = z.object({
  isValid: z.boolean(),
  reason: z.string().optional(),
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