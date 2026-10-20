import { clearSessionCookie, removeCurrentSession } from "@/lib/server/auth";

export async function POST() {
  await removeCurrentSession();
  const response = Response.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
