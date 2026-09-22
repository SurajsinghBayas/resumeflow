import { readSession } from "@/lib/auth";
import { deleteAnalysis } from "@/lib/db";
import { crossOriginResponse, isSameOrigin } from "@/lib/request";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSameOrigin(request)) return crossOriginResponse();
  const session = await readSession();
  if (!session) {
    return Response.json({ error: "Sign in to manage reviews." }, { status: 401 });
  }
  const { id } = await context.params;
  const deleted = await deleteAnalysis(session.id, id);
  if (!deleted) {
    return Response.json({ error: "Review not found." }, { status: 404 });
  }
  return Response.json({ ok: true });
}
