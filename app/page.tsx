import createServerClient from '@/lib/supabase/server';
import DaggerheartApp from '@/components/daggerheart-app';

// This is a Server Component to fetch initial data
export default async function Page() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return <DaggerheartApp clientUser={session?.user || null} />;
}