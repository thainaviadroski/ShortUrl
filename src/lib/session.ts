import { auth } from "@/auth";

// src/proxy.ts only does an optimistic login check; pages and route handlers
// read the user from the session again before touching data, and use the id
// to scope queries to the links that user created.
export async function getCurrentUserId() {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}
