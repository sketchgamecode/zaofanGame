import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { AuthPage } from './components/AuthPage';
import { TavernPage } from './pages/TavernPage';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center flex-col gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-primary/40 border-t-primary animate-spin" />
        <p className="text-sm tracking-[0.35em] text-textMuted uppercase">连接中</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => undefined} />;
  }

  return <TavernPage onLogout={() => supabase.auth.signOut()} />;
}

export default App;
