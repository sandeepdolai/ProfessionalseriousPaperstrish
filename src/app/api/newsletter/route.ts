import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const company = typeof body?.company === "string" ? body.company.trim() : "";

    if (company) {
      // honeypot filled — pretend success
      return NextResponse.json({ ok: true, message: "Subscribed" });
    }

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });
    }

    // In production this would forward to a mailing provider.
    // Here we accept and acknowledge, mirroring the reference site's behaviour.
    return NextResponse.json({ ok: true, message: "Subscribed — see you in the next one." });
  } catch {
    return NextResponse.json({ ok: false, error: "Something went wrong" }, { status: 500 });
  }
}
