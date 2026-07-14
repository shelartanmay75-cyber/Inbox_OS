/* eslint-disable @typescript-eslint/no-var-requires */

describe('Three-Tier Environment System & Mock Gmail Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should successfully boot in mock mode when MOCK_GMAIL=true and ENVIRONMENT=local', () => {
    process.env.MOCK_GMAIL = 'true';
    process.env.ENVIRONMENT = 'local';

    // Dynamically import environment config to check logic
    const {
      IS_MOCK,
      ENVIRONMENT,
      MOCK_GMAIL,
    } = require('../config/environment');
    expect(IS_MOCK).toBe(true);
    expect(ENVIRONMENT).toBe('local');
    expect(MOCK_GMAIL).toBe(true);

    const {
      gmailClient: activeClient,
    } = require('../services/gmail/gmail-client');
    expect(activeClient.constructor.name).toBe('MockGmailClient');
  });

  it('should serve fixture data in mock mode', async () => {
    process.env.MOCK_GMAIL = 'true';
    process.env.ENVIRONMENT = 'local';
    const {
      gmailClient: activeClient,
    } = require('../services/gmail/gmail-client');

    const profile = await activeClient.getProfile({}, 'http://localhost');
    expect(profile.emailAddress).toBe('mock-contributor@inboxos.dev');

    const msgList = await activeClient.listMessages({}, 'http://localhost', {
      maxResults: 10,
    });
    expect(msgList.messages).toBeDefined();
    expect(msgList.messages.length).toBeGreaterThan(0);

    const message = await activeClient.getMessage(
      {},
      'http://localhost',
      'mock-msg-1'
    );
    expect(message.data.id).toBe('mock-msg-1');
    expect(message.data.payload.parts).toBeDefined();
  });

  it('should refuse to boot and throw error if MOCK_GMAIL=true but ENVIRONMENT=production', () => {
    process.env.MOCK_GMAIL = 'true';
    process.env.ENVIRONMENT = 'production';

    expect(() => {
      require('../config/environment');
    }).toThrow(/MOCK_GMAIL is set to true, but ENVIRONMENT is "production"/);
  });

  it('should refuse to boot and throw error if local database URL points to a production host', () => {
    process.env.MOCK_GMAIL = 'true';
    process.env.ENVIRONMENT = 'local';
    process.env.DATABASE_URL =
      'postgresql://user:pass@my-supabase-prod.supabase.co:5432/db';

    expect(() => {
      require('../config/environment');
    }).toThrow(/connect to a production\/staging hostname/);
  });
});
