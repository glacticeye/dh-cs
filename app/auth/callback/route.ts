import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Get the correct origin from headers (handles proxies like Render)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const origin = `${protocol}://${host}`;

  // Extract auth code and optional redirect path
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();

    // Exchange the auth code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the intended path or fallback to homepage
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Redirect to error page if code is missing or exchange fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
