/**
 * NOTE FOR CONTRIBUTORS:
 * If your work touches real Gmail integration (e.g. debugging OAuth flow or Gmail API client),
 * you should not use shared credentials. Instead:
 * 1. Ask a maintainer to add you as an individual test user on the project's Google Cloud OAuth consent screen.
 * 2. Configure your local .env to use the project's client ID and client secret.
 * 3. Authenticate with your own Google account during the local OAuth flow.
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { IS_MOCK } from '../../config/environment';

export interface IGmailClient {
  getToken(code: string, redirectUri: string): Promise<any>;
  getProfile(
    tokens: any,
    redirectUri: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<{ emailAddress: string }>;
  listMessages(
    tokens: any,
    redirectUri: string,
    options: { maxResults: number; q?: string },
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any>;
  getMessage(
    tokens: any,
    redirectUri: string,
    messageId: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any>;
  sendMessage(
    tokens: any,
    redirectUri: string,
    rawMime: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any>;
}

function getRealOAuthClient(
  tokens: any,
  redirectUri: string,
  onTokens?: (newTokens: any) => Promise<void>
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );
  oauth2Client.setCredentials(tokens);
  if (onTokens) {
    oauth2Client.on('tokens', async (newTokens) => {
      try {
        await onTokens(newTokens);
      } catch (err) {
        logger.error('[GmailClient] Error handling token refresh event:', err);
      }
    });
  }
  return oauth2Client;
}

class RealGmailClient implements IGmailClient {
  async getToken(code: string, redirectUri: string): Promise<any> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  }

  async getProfile(
    tokens: any,
    redirectUri: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<{ emailAddress: string }> {
    const auth = getRealOAuthClient(tokens, redirectUri, onTokens);
    const gmail = google.gmail({ version: 'v1', auth });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    if (!profile.data.emailAddress) {
      throw new Error('No email address found in profile');
    }
    return { emailAddress: profile.data.emailAddress };
  }

  async listMessages(
    tokens: any,
    redirectUri: string,
    options: { maxResults: number; q?: string },
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    const auth = getRealOAuthClient(tokens, redirectUri, onTokens);
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
      ...options,
    });
    return res.data;
  }

  async getMessage(
    tokens: any,
    redirectUri: string,
    messageId: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    const auth = getRealOAuthClient(tokens, redirectUri, onTokens);
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });
    return res;
  }

  async sendMessage(
    tokens: any,
    redirectUri: string,
    rawMime: string,
    onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    const auth = getRealOAuthClient(tokens, redirectUri, onTokens);
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMime },
    });
    return res;
  }
}

class MockGmailClient implements IGmailClient {
  private loadFixture(filename: string): any {
    const fixturePath = path.resolve(
      __dirname,
      '../../../fixtures/gmail',
      filename
    );
    if (!fs.existsSync(fixturePath)) {
      throw new Error(`Fixture file not found: ${fixturePath}`);
    }
    const raw = fs.readFileSync(fixturePath, 'utf-8');
    return JSON.parse(raw);
  }

  async getToken(code: string, _redirectUri: string): Promise<any> {
    logger.info(`[MockGmailClient] Fetching mock token for code: ${code}`);
    return this.loadFixture('oauth_token.json');
  }

  async getProfile(
    _tokens: any,
    _redirectUri: string,
    _onTokens?: (newTokens: any) => Promise<void>
  ): Promise<{ emailAddress: string }> {
    logger.info(`[MockGmailClient] Fetching mock profile`);
    const profile = this.loadFixture('profile.json');
    return { emailAddress: profile.emailAddress };
  }

  async listMessages(
    _tokens: any,
    _redirectUri: string,
    _options: { maxResults: number; q?: string },
    _onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    logger.info(`[MockGmailClient] Listing mock messages`);
    return this.loadFixture('messages_list.json');
  }

  async getMessage(
    _tokens: any,
    _redirectUri: string,
    messageId: string,
    _onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    logger.info(
      `[MockGmailClient] Getting mock message detail for: ${messageId}`
    );
    const detail = this.loadFixture('message_detail.json');
    // Keep message ID consistent
    detail.id = messageId;
    return { data: detail };
  }

  async sendMessage(
    _tokens: any,
    _redirectUri: string,
    _rawMime: string,
    _onTokens?: (newTokens: any) => Promise<void>
  ): Promise<any> {
    logger.info(`[MockGmailClient] Sending mock email`);
    return { data: { id: `gmail-sent-${Date.now()}` } };
  }
}

export const gmailClient: IGmailClient = IS_MOCK
  ? new MockGmailClient()
  : new RealGmailClient();
