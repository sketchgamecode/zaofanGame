import { useEffect, useState } from 'react';
import { type Session } from '@supabase/supabase-js';
import { ScrollText, Swords } from 'lucide-react';
import { AuthPage } from './components/AuthPage';
import { CharacterPage } from './pages/CharacterPage';
import { TavernPage } from './pages/TavernPage';
import { supabase } from './lib/supabase';
import { BlackMarketPage } from './pages/BlackMarketPage';
import { MainLayout } from './layouts/MainLayout';

import { CharacterProvider } from './hooks/useCharacter';
import { BlackMarketProvider } from './hooks/useBlackMarket';
import { GameContainer } from './components/layout/GameContainer';

export type AppTab = 'tavern' | 'character' | 'weapon_shop' | 'magic_shop';

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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center flex-col gap-4">
        <div className="h-10 w-10 rounded-full border-4 border-amber-900/40 border-t-amber-500 animate-spin" />
        <p className="text-sm tracking-[0.35em] text-stone-500 uppercase">连接中</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => undefined} />;
  }

  return (
    <CharacterProvider>
      <BlackMarketProvider>
        <GameContainer>
          <MainLayout activeTab={tab} onTabChange={setTab}>
            <div className="h-full relative bg-[#0a0a0c]">
              {tab === 'tavern' && <TavernPage onLogout={() => supabase.auth.signOut()} />}
              {tab === 'character' && (
                <div className="flex items-center justify-center h-full text-stone-500">
                  <CharacterPage />
                </div>
              )}
              {tab === 'weapon_shop' && <BlackMarketPage shopType="weapon" />}
              {tab === 'magic_shop' && <BlackMarketPage shopType="magic" />}
            </div>
          </MainLayout>
        </GameContainer>
      </BlackMarketProvider>
    </CharacterProvider>
  );
}

export default App;
