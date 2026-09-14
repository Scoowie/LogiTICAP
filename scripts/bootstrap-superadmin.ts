import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local" });

async function main() {
  const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const confirmation = process.env.BOOTSTRAP_CONFIRM;
  const url = process.env.DIRECT_URL;

  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    throw new Error(
      "Set BOOTSTRAP_SUPERADMIN_EMAIL to the verified email of an existing Supabase user.",
    );
  if (confirmation !== "CREATE_INITIAL_SUPERADMIN")
    throw new Error(
      "Set BOOTSTRAP_CONFIRM=CREATE_INITIAL_SUPERADMIN for this one-time command.",
    );
  if (!url) throw new Error("DIRECT_URL is required.");

  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });
  try {
    await db.$transaction(async (tx) => {
      if (await tx.userProfile.count({ where: { role: "SUPERADMIN" } }))
        throw new Error(
          "Bootstrap refused: a superadmin already exists. Use the authenticated role-management interface.",
        );
      const profile = await tx.userProfile.findUnique({ where: { email } });
      if (!profile)
        throw new Error(
          "No UserProfile exists for that verified Supabase user. Sign in once before running bootstrap.",
        );
      await tx.userProfile.update({
        where: { id: profile.id },
        data: { role: "SUPERADMIN", status: "ACTIVE" },
      });
      await tx.auditLog.create({
        data: {
          action: "role.initial_superadmin_bootstrapped",
          targetType: "UserProfile",
          targetId: profile.id,
          previousValues: { role: profile.role },
          newValues: { role: "SUPERADMIN" },
          reason: "Controlled one-time bootstrap command",
        },
      });
    });
    console.info(
      "Initial superadmin created. Remove the BOOTSTRAP_* values from the environment now.",
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exitCode = 1;
});
