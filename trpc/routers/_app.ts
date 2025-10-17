import { createTRPCRouter } from "@/trpc/init";
import { broadcastsRouter } from "@/modules/broadcast/server/procedure";
import { subscribersRouter } from "@/modules/subscribers/server/procedure";

export const appRouter = createTRPCRouter({
  subscribers: subscribersRouter,
  broadcasts: broadcastsRouter,
});

export type AppRouter = typeof appRouter;
