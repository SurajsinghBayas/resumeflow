import { clearSession } from "@/lib/auth";
import { crossOriginResponse, isSameOrigin } from "@/lib/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return crossOriginResponse();
  await clearSession();
  return Response.json({ ok: true });
}
