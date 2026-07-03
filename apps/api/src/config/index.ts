import { z } from 'zod';

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: isTest
    ? z.string().url().default('postgresql://localhost:5432/test')
    : z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  JWT_SECRET: isTest
    ? z.string().default('test-secret-key-123')
    : z.string().min(32, 'JWT_SECRET must be at least 32 characters long.'),
  // Comma-separated list of allowed CORS origins
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((val) =>
      val
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
});

let validatedEnv: z.infer<typeof envSchema>;

try {
  validatedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missing = error.issues.map((i) => i.path.join('.')).join(', ');
    console.error(
      `❌ Environment validation failed. Missing or invalid keys: ${missing}`,
    );
  } else {
    console.error('❌ Unknown error validating environment variables', error);
  }
  process.exit(1);
}

export const config = {
  env: validatedEnv.NODE_ENV,
  port: validatedEnv.PORT,
  database: {
    url: validatedEnv.DATABASE_URL,
  },
  redis: {
    url: validatedEnv.REDIS_URL,
  },
  log: {
    level: validatedEnv.LOG_LEVEL,
  },
  jwt: {
    secret: validatedEnv.JWT_SECRET,
  },
  corsOrigins: validatedEnv.ALLOWED_ORIGINS,
};
