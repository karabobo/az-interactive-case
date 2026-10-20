import { createSession, normalizeUsername, registerUser, setSessionCookie, validateCredentials } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const username = normalizeUsername(body.username);
  const error = validateCredentials(username, body.password);
  if (error) return Response.json({ error }, { status: 400 });
  const user = registerUser(username, body.password);
  if (!user) return Response.json({ error: "该账号已存在" }, { status: 409 });
  const response = Response.json({ user });
  setSessionCookie(response, createSession(user.id));
  return response;
}
