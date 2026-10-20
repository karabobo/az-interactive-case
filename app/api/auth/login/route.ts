import { authenticateUser, createSession, normalizeUsername, setSessionCookie } from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const username = normalizeUsername(body.username);
  const user = typeof body.password === "string" ? authenticateUser(username, body.password) : null;
  if (!user) return Response.json({ error: "账号或密码错误" }, { status: 401 });
  const response = Response.json({ user });
  setSessionCookie(response, createSession(user.id));
  return response;
}
