import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

const optionalString = (schema: z.ZodString) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

const serverSchema = publicSchema.extend({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  RESEND_API_KEY: optionalString(z.string().min(1)),
  EMAIL_FROM: optionalString(z.string().min(3)),
  RATE_LIMIT_REDIS_URL: optionalString(z.string().url()),
  BOT_PROTECTION_SECRET: optionalString(z.string().min(8)),
});

function parse<T extends z.ZodType>(
  schema: T,
  values: unknown,
  scope: string,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(
      `Invalid ${scope} environment configuration: ${details}. See .env.example.`,
    );
  }
  return result.data;
}

export function publicEnv() {
  return parse(
    publicSchema,
    {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    "public",
  );
}

export function serverEnv() {
  return parse(serverSchema, process.env, "server");
}
