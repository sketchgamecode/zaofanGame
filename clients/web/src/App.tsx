import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ScrollText, Swords } from 'lucide-react';
import { AuthPage } from './components/AuthPage';
import { CharacterPage } from './pages/CharacterPage';
import { TavernPage } from './pages/TavernPage';
import { supabase } from './lib/supabase';

type AppTab = 'tavern' | 'character';

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tab, setTab] = useState<AppTab>('tavern');

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

  return (
    <div className="min-h-screen bg-[#050406]">
      <div className="pb-24">
        {tab === 'tavern' ? (
          <TavernPage onLogout={() => supabase.auth.signOut()} />
        ) : (
          <CharacterPage />
        )}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-800/80 bg-[rgba(10,10,14,0.92)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTab('tavern')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              tab === 'tavern'
                ? 'border-amber-700/70 bg-amber-700/15 text-amber-100'
                : 'border-stone-800/80 bg-black/20 text-stone-400'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <Swords size={16} />
              Tavern
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('character')}
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
              tab === 'character'
                ? 'border-indigo-700/70 bg-indigo-700/15 text-indigo-100'
                : 'border-stone-800/80 bg-black/20 text-stone-400'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <ScrollText size={16} />
              Character
            </span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default App;
