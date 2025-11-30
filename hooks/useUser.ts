import { useEffect, useState } from "react";

import { AuthError, Session, User } from "@supabase/supabase-js";

import createClient from "@/lib/supabase/client";

export default function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
          setUser(user);
          // Optionally fetch session separately if needed
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
        }
      } catch (error) {
        setError(error as AuthError);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [supabase]);

  return { loading, error, session, user };
}
