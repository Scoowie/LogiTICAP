import "server-only";

import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

export type TransactionalMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};
export interface EmailProvider {
  send(message: TransactionalMessage): Promise<{ id: string }>;
}

class DevelopmentLogger implements EmailProvider {
  async send(message: TransactionalMessage) {
    const id = `dev-${crypto.randomUUID()}`;
    console.info("[email:development]", {
      id,
      to: message.to,
      subject: message.subject,
    });
    return { id };
  }
}

class ResendProvider implements EmailProvider {
  constructor(
    private client: Resend,
    private from: string,
  ) {}
  async send(message: TransactionalMessage) {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      ...message,
    });
    if (error || !data)
      throw new Error(
        `Email provider rejected the message: ${error?.message ?? "unknown error"}`,
      );
    return { id: data.id };
  }
}

export function getEmailProvider(): EmailProvider {
  const env = serverEnv();
  if (env.RESEND_API_KEY && env.EMAIL_FROM)
    return new ResendProvider(new Resend(env.RESEND_API_KEY), env.EMAIL_FROM);
  if (process.env.NODE_ENV === "production")
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM are required in production.",
    );
  return new DevelopmentLogger();
}
