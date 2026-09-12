/**
 * NaraRouter AI Provider Implementation
 * Implements the AI provider interface using NaraRouter API
 */

import axios, { AxiosError } from 'axios';
import { AIProvider } from './ai-provider.interface';

export class NaraRouterProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NARAROUTER_API_KEY || '';
    this.baseUrl = process.env.NARAROUTER_BASE_URL || 'https://router.bynara.id/v1';

    if (!this.apiKey) {
      throw new Error('NARAROUTER_API_KEY environment variable is required');
    }
  }

  getProviderName(): string {
    return 'NaraRouter';
  }

  async sendRequest(systemPrompt: string, userMessage: string, model: string): Promise<string> {
    try {
      console.log(`[AI Provider] Sending request to ${this.getProviderName()}`);
      console.log(`[AI Provider] Model: ${model}`);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          temperature: 0.1, // Low temperature for consistent extraction
          max_tokens: 1000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log(`[AI Provider] Response received from ${this.getProviderName()}`);

      // Extract the AI response
      const aiMessage = response.data.choices?.[0]?.message?.content;
      if (!aiMessage) {
        throw new Error('No content in AI response');
      }

      return aiMessage;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error(`[AI Provider] ${this.getProviderName()} request failed:`, {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          // Never log the full request details or API key
        });

        if (axiosError.response?.status === 401) {
          throw new Error('Invalid NaraRouter API key');
        } else if (axiosError.response?.status === 429) {
          throw new Error('NaraRouter rate limit exceeded');
        } else if (axiosError.code === 'ECONNABORTED') {
          throw new Error('NaraRouter request timeout');
        } else {
          throw new Error(`NaraRouter API error: ${axiosError.message}`);
        }
      } else {
        console.error(`[AI Provider] ${this.getProviderName()} error:`, error);
        throw new Error(`NaraRouter error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}