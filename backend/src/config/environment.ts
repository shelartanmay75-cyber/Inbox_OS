import { logger } from '../utils/logger';

// Load variables
export const ENVIRONMENT = process.env.ENVIRONMENT || 'local';
export const MOCK_GMAIL = process.env.MOCK_GMAIL === 'true';

// Validate values
const validEnvironments = ['local', 'staging', 'production'];
if (!validEnvironments.includes(ENVIRONMENT)) {
  const errMsg = `CRITICAL CONFIG FAILURE: Invalid ENVIRONMENT value "${ENVIRONMENT}". Must be one of: ${validEnvironments.join(', ')}`;
  logger.error(errMsg);
  throw new Error(errMsg);
}

// 1. Mock mode requires BOTH MOCK_GMAIL=true AND ENVIRONMENT=local
export const IS_MOCK = MOCK_GMAIL && ENVIRONMENT === 'local';

// 3. Fail loudly at startup if MOCK_GMAIL=true but ENVIRONMENT != local
if (MOCK_GMAIL && ENVIRONMENT !== 'local') {
  const errMsg = `CRITICAL SECURITY FAILURE: MOCK_GMAIL is set to true, but ENVIRONMENT is "${ENVIRONMENT}". Mock mode is strictly restricted to local environments to prevent mock data leakage in production/staging.`;
  logger.error(errMsg);
  throw new Error(errMsg);
}

// 7. Refuse to boot in local mode if DATABASE_URL or REDIS_URL resolve to a known production/staging hostname pattern
if (ENVIRONMENT === 'local') {
  const dbUrl = process.env.DATABASE_URL || '';
  const redisUrl = process.env.REDIS_URL || '';

  const isProdDb = /supabase|upstash|render|aws|rds/i.test(dbUrl);
  const isProdRedis = /supabase|upstash|render|aws|redis-cloud/i.test(redisUrl);

  if (isProdDb || isProdRedis) {
    const errMsg = `CRITICAL SECURITY FAILURE: Local development mode is configured to connect to a production/staging hostname (DATABASE_URL=${dbUrl}, REDIS_URL=${redisUrl}). Refusing to boot.`;
    logger.error(errMsg);
    throw new Error(errMsg);
  }
}
