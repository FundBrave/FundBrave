"use client";

import { useCallback } from "react";
import { useSearchUsersLazyQuery } from "@/app/generated/graphql";
import type { MentionUser } from "@/app/components/social/PostEditor";

/**
 * Hook that provides a search function for @mention autocomplete.
 * Uses the existing searchUsers GraphQL query.
 *
 * Usage:
 *   const { searchUsers } = useMentionSearch();
 *   <PostEditor onSearchUsers={searchUsers} />
 */
export function useMentionSearch() {
  const [executeSearch] = useSearchUsersLazyQuery();

  const searchUsers = useCallback(
    async (query: string): Promise<MentionUser[]> => {
      if (!query || query.length < 1) return [];

      try {
        const { data } = await executeSearch({
          variables: { query, limit: 8 },
        });

        if (!data?.searchUsers?.users) return [];

        return data.searchUsers.users
          .filter((u): u is NonNullable<typeof u> => !!u)
          .map((user) => ({
            id: user.id,
            username: user.username || "",
            name: user.displayName || user.username || "Unknown",
            avatar: user.avatarUrl || undefined,
            verified: user.isVerifiedCreator || false,
          }));
      } catch (error) {
        console.error("Mention search failed:", error);
        return [];
      }
    },
    [executeSearch]
  );

  return { searchUsers };
}
