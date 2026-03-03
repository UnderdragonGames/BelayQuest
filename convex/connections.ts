import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const myConnections = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const connections = await ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const results = await Promise.all(
      connections.map(async (conn) => {
        const connectedUser = await ctx.db.get(conn.connectedUserId);
        if (!connectedUser) return null;
        return {
          _id: conn._id,
          connectedUserId: conn.connectedUserId,
          nickname: conn.nickname,
          source: conn.source,
          createdAt: conn.createdAt,
          generatedName: connectedUser.generatedName,
          level: connectedUser.level,
        };
      })
    );

    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});

export const myGuilds = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const guilds = await ctx.db
      .query("guilds")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    const results = await Promise.all(
      guilds.map(async (guild) => {
        const memberRows = await ctx.db
          .query("guildMembers")
          .withIndex("by_guild", (q) => q.eq("guildId", guild._id))
          .collect();

        const members = await Promise.all(
          memberRows.map(async (row) => {
            const memberUser = await ctx.db.get(row.userId);
            if (!memberUser) return null;

            const connection = await ctx.db
              .query("connections")
              .withIndex("by_user_connected", (q) =>
                q.eq("userId", userId).eq("connectedUserId", row.userId)
              )
              .unique();

            return {
              userId: row.userId,
              generatedName: memberUser.generatedName,
              level: memberUser.level,
              nickname: connection?.nickname,
            };
          })
        );

        return {
          _id: guild._id,
          name: guild.name,
          isDefault: guild.isDefault,
          members: members.filter(
            (m): m is NonNullable<typeof m> => m !== null
          ),
        };
      })
    );

    return results;
  },
});
