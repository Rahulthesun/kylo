import { useEffect, useState } from 'react';
import { KyloShell } from './components/KyloShell';
import { supabase } from './lib/supabase';
import type { User } from '@supabase/supabase-js';
import { AuthScreen } from './components/AuthScreen';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0D10] flex items-center justify-center text-white/40">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0B0D10] relative">
      {user ? <KyloShell user={user} /> : <AuthScreen />}
    </div>
  );
}

export default App;