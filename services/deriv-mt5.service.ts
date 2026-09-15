/**
 * Deriv MT5/CFD Service
 * Handles MT5 account identification and verification using Deriv's WebSocket API
 *
 * This service:
 * - Uses the official Deriv WebSocket API (wss://ws.derivws.com/websockets/v3)
 *   with the mt5_login_list and mt5_get_settings calls for account management.
 * - Identifies and validates MT5/CFD accounts.
 * - Retrieves MT5 account information and balance.
 * - Rejects Options/Multipliers accounts.
 * - Prepares data for MT5 Expert Advisor integration.
 *
 * IMPORTANT: Deriv's MT5 API supports account management (list / settings / balance).
 * It does NOT support programmatic trade execution.
 * Trading must be done via an MT5 Expert Advisor or the MT5 platform directly.
 *
 * Official Deriv WebSocket API docs: https://api.deriv.com/api-explorer/
 * mt5_login_list  → lists all MT5 accounts linked to the OAuth token
 * mt5_get_settings → returns detailed settings for one MT5 login
 */

import WebSocket from 'ws';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface MT5Account {
  login: string;
  server: string;
  accountType: 'demo' | 'real';
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  company: string;
  name: string;
  accountStatus: 'active' | 'inactive' | 'suspended';
  group?: string;
}

type MT5LikeAccount = Partial<MT5Account> & {
  mt5Login?: string;
  mt5AccountType?: 'demo' | 'real';
  [key: string]: any;
};

export function isSupportedMT5CFDAccount(account: MT5LikeAccount | Partial<MT5Account> | null | undefined): boolean {
  if (!account) return false;

  const login = String((account as any).login ?? (account as any).mt5Login ?? '').trim();
  const server = String((account as any).server ?? '').trim().toLowerCase();
  const rawType = String((account as any).accountType ?? (account as any).mt5AccountType ?? '').trim().toLowerCase();
  const accountType = rawType === 'demo' || rawType === 'real' ? rawType : '';

  if (!login || !/^\d+$/.test(login)) return false;
  if (!['demo', 'real'].includes(accountType)) return false;

  if (server.includes('options') || server.includes('multiplier')) {
    return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Internal WebSocket helpers
// ---------------------------------------------------------------------------

/**
 * Open a single Deriv WebSocket connection, send one request, wait for the
 * matching response, then close the socket.
 *
 * Uses the standard public endpoint:
 *   wss://ws.derivws.com/websockets/v3?app_id=<APP_ID>
 *
 * Authentication is done by sending { authorize: <access_token> } first.
 */
async function derivWsRequest(
  accessToken: string,
  appId: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${encodeURIComponent(appId)}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let authorized = false;
    const timer = setTimeout(() => {
      ws.terminate();
      reject(new Error('Deriv WebSocket request timed out (15 s)'));
    }, 15_000);

    ws.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    ws.on('open', () => {
      // Step 1 – authorise with the OAuth access token
      ws.send(JSON.stringify({ authorize: accessToken, req_id: 1 }));
    });

    ws.on('message', (raw: Buffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return; // skip malformed frames
      }

      // Handle authorisation response
      if ((msg.msg_type as string) === 'authorize') {
        if (msg.error) {
          clearTimeout(timer);
          ws.terminate();
          reject(new Error(`Deriv auth failed: ${(msg.error as any).message}`));
          return;
        }
        authorized = true;
        // Step 2 – send the actual request
        ws.send(JSON.stringify({ ...payload, req_id: 2 }));
        return;
      }

      // Handle the payload response (req_id === 2)
      if (authorized && (msg as any).req_id === 2) {
        clearTimeout(timer);
        ws.close();
        if (msg.error) {
          reject(new Error(`Deriv API error: ${(msg.error as any).message}`));
        } else {
          resolve(msg);
        }
      }
    });

    ws.on('close', () => {
      clearTimeout(timer);
      // If we never resolved / rejected, the timeout will handle it
    });
  });
}

// ---------------------------------------------------------------------------
// DerivMT5Service
// ---------------------------------------------------------------------------

export class DerivMT5Service {
  private accessToken: string;
  private appId: string;

  constructor(accessToken: string, appId: string) {
    this.accessToken = accessToken;
    this.appId = appId;
  }

  // -------------------------------------------------------------------------
  // mt5_login_list
  // -------------------------------------------------------------------------

  /**
   * Return all MT5 accounts linked to the authenticated Deriv user.
   * Uses Deriv WebSocket call: { mt5_login_list: 1 }
   */
  async getMT5AccountList(): Promise<MT5Account[]> {
    console.log('[DerivMT5Service] Requesting mt5_login_list via WebSocket');

    const response = await derivWsRequest(this.accessToken, this.appId, {
      mt5_login_list: 1,
    });

    const list = response.mt5_login_list as any[] | undefined;

    if (!Array.isArray(list)) {
      throw new Error('Unexpected mt5_login_list response structure');
    }

    console.log(`[DerivMT5Service] mt5_login_list returned ${list.length} account(s)`);

    return list.map((acc: any) => this.mapRawAccount(acc));
  }

  // -------------------------------------------------------------------------
  // mt5_get_settings
  // -------------------------------------------------------------------------

  /**
   * Return detailed settings for a single MT5 login.
   * Uses Deriv WebSocket call: { mt5_get_settings: 1, login: "<login>" }
   */
  async getMT5AccountSettings(login: string): Promise<MT5Account> {
    console.log(`[DerivMT5Service] Requesting mt5_get_settings for login ${login.substring(0, 6)}...`);

    const response = await derivWsRequest(this.accessToken, this.appId, {
      mt5_get_settings: 1,
      login,
    });

    const settings = response.mt5_get_settings as any;

    if (!settings) {
      throw new Error('Unexpected mt5_get_settings response structure');
    }

    return this.mapRawAccountSettings(settings);
  }

  // -------------------------------------------------------------------------
  // validateMT5Account
  // -------------------------------------------------------------------------

  /**
   * Confirm that a login is a valid, active MT5/CFD account.
   * Returns { isValid, account, error }.
   */
  async validateMT5Account(login: string): Promise<{
    isValid: boolean;
    account?: MT5Account;
    error?: string;
  }> {
    try {
      const account = await this.getMT5AccountSettings(login);

      if (!account.login || !account.server) {
        return { isValid: false, error: 'Account missing required MT5 fields' };
      }

      if (!isSupportedMT5CFDAccount(account)) {
        return {
          isValid: false,
          error: 'Options or non-MT5 accounts are not supported for CFD trading',
        };
      }

      if (account.accountStatus !== 'active') {
        return {
          isValid: false,
          error: `Account status is '${account.accountStatus}', not 'active'`,
        };
      }

      console.log('[DerivMT5Service] MT5 account validated:', {
        login: account.login.substring(0, 6) + '...',
        server: account.server,
        accountType: account.accountType,
        currency: account.currency,
      });

      return { isValid: true, account };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DerivMT5Service] Validation failed:', msg);
      return { isValid: false, error: msg };
    }
  }

  // -------------------------------------------------------------------------
  // findMT5Account
  // -------------------------------------------------------------------------

  /**
   * Find the first valid MT5 account of the requested type (demo / real).
   * Tries mt5_login_list first; if the desired type is missing it falls back
   * to any active account and returns a descriptive error.
   */
  async findMT5Account(accountType: 'demo' | 'real'): Promise<{
    found: boolean;
    account?: MT5Account;
    error?: string;
  }> {
    try {
      const allAccounts = await this.getMT5AccountList();

      if (allAccounts.length === 0) {
        return {
          found: false,
          error:
            'No MT5 accounts found. Please create an MT5 account in your Deriv dashboard.',
        };
      }

      // Prefer exact type match
      const match = allAccounts.find((a) => a.accountType === accountType);

      if (match) {
        const validation = await this.validateMT5Account(match.login);
        if (validation.isValid && validation.account) {
          return { found: true, account: validation.account };
        }
        return { found: false, error: validation.error };
      }

      // No exact type match
      const fallback = allAccounts.find((a) => a.accountStatus === 'active');
      if (fallback) {
        return {
          found: false,
          error: `No ${accountType} MT5 account found. Found ${fallback.accountType} account instead.`,
        };
      }

      return {
        found: false,
        error: `No active MT5 ${accountType} account found. Please create one in your Deriv dashboard.`,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DerivMT5Service] findMT5Account error:', msg);
      return { found: false, error: msg };
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Map the raw object from mt5_login_list to our MT5Account interface.
   * Field names follow the Deriv WebSocket API spec.
   */
  private mapRawAccount(acc: any): MT5Account {
    return {
      login: String(acc.login ?? ''),
      server: String(acc.server ?? ''),
      // Deriv returns account_type as 'demo' | 'real'
      accountType: (acc.account_type === 'demo' ? 'demo' : 'real') as 'demo' | 'real',
      currency: String(acc.currency ?? 'USD'),
      balance: parseFloat(acc.balance ?? '0'),
      equity: parseFloat(acc.equity ?? '0'),
      margin: parseFloat(acc.margin ?? '0'),
      freeMargin: parseFloat(acc.free_margin ?? acc.margin_free ?? '0'),
      marginLevel: parseFloat(acc.margin_level ?? '0'),
      company: String(acc.company ?? ''),
      name: String(acc.name ?? ''),
      accountStatus: this.mapStatus(acc.status ?? acc.account_status),
      group: acc.group ?? undefined,
    };
  }

  /**
   * Map the raw object from mt5_get_settings to our MT5Account interface.
   * mt5_get_settings returns slightly different field names.
   */
  private mapRawAccountSettings(s: any): MT5Account {
    return {
      login: String(s.login ?? ''),
      server: String(s.server ?? ''),
      accountType: (s.account_type === 'demo' ? 'demo' : 'real') as 'demo' | 'real',
      currency: String(s.currency ?? 'USD'),
      balance: parseFloat(s.balance ?? '0'),
      equity: parseFloat(s.equity ?? '0'),
      margin: parseFloat(s.margin ?? '0'),
      freeMargin: parseFloat(s.free_margin ?? s.margin_free ?? '0'),
      marginLevel: parseFloat(s.margin_level ?? '0'),
      company: String(s.company ?? ''),
      name: String(s.name ?? ''),
      accountStatus: this.mapStatus(s.status ?? s.account_status),
      group: s.group ?? undefined,
    };
  }

  /** Normalise Deriv status strings to our enum */
  private mapStatus(raw: unknown): 'active' | 'inactive' | 'suspended' {
    if (raw === 'active') return 'active';
    if (raw === 'suspended') return 'suspended';
    return 'inactive';
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createDerivMT5Service(accessToken: string, appId: string): DerivMT5Service {
  return new DerivMT5Service(accessToken, appId);
}
