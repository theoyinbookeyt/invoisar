import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

type ClerkUserRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses: Array<{ emailAddress: string }>;
};

function getDisplayName(user: ClerkUserRecord): string | undefined {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || user.username || undefined;
}

function getEmailAddress(user: ClerkUserRecord): string {
  const emailAddress =
    user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress;

  if (!emailAddress) {
    throw new Error("Clerk user is missing an email address.");
  }

  return emailAddress;
}

export async function ensureConvexUser(user: ClerkUserRecord | null) {
  if (!user) {
    return null;
  }

  await fetchMutation(api.users.createUser, {
    clerkUserId: user.id,
    email: getEmailAddress(user),
    displayName: getDisplayName(user),
  });

  return await fetchQuery(api.users.getUserByClerkId, {
    clerkUserId: user.id,
  });
}

export async function getConvexUserByClerkId(clerkUserId: string) {
  return await fetchQuery(api.users.getUserByClerkId, { clerkUserId });
}
