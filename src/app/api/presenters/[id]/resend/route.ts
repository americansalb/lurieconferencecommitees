import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { presenterInviteEmail } from "@/lib/mail-templates";
import { confirmationUrl } from "@/lib/presenters";

function isAdmin(role?: string) {
  return role === "admin" || role === "developer";
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userRole = (session.user as { role?: string }).role;
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const presenter = await prisma.presenter.findUnique({ where: { id: params.id } });
  if (!presenter) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { customMessage } = await req.json().catch(() => ({}));

  await sendMail({
    to: presenter.email,
    subject: `Reminder: your presenter portal for the AALB Conference at Lurie Children's`,
    html: presenterInviteEmail({
      name: presenter.name,
      url: confirmationUrl(presenter.token),
      customMessage,
    }),
  });

  await prisma.presenter.update({ where: { id: presenter.id }, data: { lastSentAt: new Date() } });
  await prisma.presenterEvent.create({
    data: {
      presenterId: presenter.id,
      type: "reminded",
      actorEmail: session.user.email || null,
    },
  });

  return NextResponse.json({ success: true });
}
