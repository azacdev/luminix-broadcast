import { cache } from "react";
import superjson from "superjson";

import { db } from "@/db/drizzle";
import { initTRPC } from "@trpc/server";

export const createTRPCContext = cache(async () => {
  return { db };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const baseProcedure = t.procedure;
