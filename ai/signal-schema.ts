/**
 * Signal Schema
 * Defines the expected structure for AI-extracted trading signals
 * This schema is used for validation of AI responses
 */

import { z } from 'zod';

/**
 * Zod schema for validating AI signal extraction results
 */
export const SignalExtractionSchema = z.object({
  isValidSignal: z.boolean(),
  symbol: z.string().optional(),
  direction: z.enum(['BUY', 'SELL']).optional(),
  orderType: z.enum(['MARKET', 'LIMIT', 'STOP']).optional(),
  entry: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfits: z.array(z.number()).optional(),
});

/**
 * Type inference from the schema
 */
export type SignalExtractionResult = z.infer<typeof SignalExtractionSchema>;

/**
 * Validate AI response against the schema
 * @param data - The AI response to validate
 * @returns Validated result or throws error
 */
export function validateSignalExtraction(data: unknown): SignalExtractionResult {
  return SignalExtractionSchema.parse(data);
}

/**
 * Safely validate AI response against the schema
 * @param data - The AI response to validate
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