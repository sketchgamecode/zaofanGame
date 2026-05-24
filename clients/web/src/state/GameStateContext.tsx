import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { fetchSave, ManualApiError, postGameAction } from '../api/gameApi';
import { supabase } from '../lib/supabase';
import type {
  AttributeKey,
  CharacterInfoView,
  CreateCharacterPayload,
  EquipmentSlot,
  GameSaveState,
} from '../types/game';

type AuthMode = 'login' | 'register';

type GameStateContextValue = {
  session: Session | null;
  authLoading: boolean;
  bootLoading: boolean;
  pendingAction: string | null;
  serverBusyAction: string | null;
  isServerBusy: boolean;
  saveState: GameSaveState | null;
  character: CharacterInfoView | null;
  errorMessage: string | null;
  infoMessage: string | null;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  refreshCharacterInfo: () => Promise<void>;
  createCharacter: (payload: CreateCharacterPayload) => Promise<void>;
  upgradeAttribute: (attribute: AttributeKey) => Promise<void>;
  equipItem: (itemId: string) => Promise<void>;
  unequipItem: (slot: EquipmentSlot) => Promise<void>;
  runServerAction: <TResult>(action: string, task: () => Promise<TResult>) => Promise<TResult>;
  clearMessages: () => void;
};

const GameStateContext = createContext<GameStateContextValue | null>(null);

function toMessage(error: unknown) {
  if (error instanceof ManualApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '发生了未识别的错误。';
}

export function GameStateProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootLoading, setBootLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [serverBusyAction, setServerBusyAction] = useState<string | null>(null);
  const [serverBusyCount, setServerBusyCount] = useState(0);
  const [saveState, setSaveState] = useState<GameSaveState | null>(null);
  const [character, setCharacter] = useState<CharacterInfoView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const clearMessages = useCallback(() => {
    setErrorMessage(null);
    setInfoMessage(null);
  }, []);

  const runServerAction = useCallback(async <TResult,>(
    action: string,
    task: () => Promise<TResult>,
  ): Promise<TResult> => {
    setServerBusyAction(action);
    setServerBusyCount((count) => count + 1);

    try {
      return await task();
    } finally {
      setServerBusyCount((count) => {
        const nextCount = Math.max(0, count - 1);
        if (nextCount === 0) {
          setServerBusyAction(null);
        }
        return nextCount;
      });
    }
  }, []);

  const applyCharacterInfo = useCallback((nextCharacter: CharacterInfoView) => {
    setCharacter(nextCharacter);
    setSaveState((previous) => (
      previous
        ? {
            ...previous,
            player: {
              ...previous.player,
              ...nextCharacter.player,
            },
            resources: nextCharacter.resources,
          }
        : {
            player: nextCharacter.player,
            resources: nextCharacter.resources,
          }
    ));
  }, []);

  const refreshCharacterInfo = useCallback(async () => {
    clearMessages();

    try {
      const info = await postGameAction<CharacterInfoView>('PLAYER_GET_INFO');
      console.info('[manual] PLAYER_GET_INFO success', info);
      applyCharacterInfo(info);
    } catch (error) {
      setErrorMessage(toMessage(error));
      throw error;
    }
  }, [applyCharacterInfo, clearMessages]);

  const refreshGameState = useCallback(async () => {
    setBootLoading(true);
    clearMessages();

    try {
      const saveResponse = await fetchSave();
      console.info('[manual] /api/save success', saveResponse);
      setSaveState(saveResponse.save);

      if (saveResponse.save.player.status === 'ACTIVE') {
        console.info('[manual] save.player.status is ACTIVE, requesting PLAYER_GET_INFO');
        await refreshCharacterInfo();
      } else {
        console.info('[manual] save.player.status is PENDING_CREATION');
        setCharacter(null);
      }
    } catch (error) {
      console.error('[manual] refreshGameState failed', error);
      setErrorMessage(toMessage(error));
    } finally {
      setBootLoading(false);
    }
  }, [clearMessages, refreshCharacterInfo]);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) {
        return;
      }

      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setSaveState(null);
      setCharacter(null);
      setBootLoading(false);
      return;
    }

    void refreshGameState();
  }, [refreshGameState, session]);

  const runCharacterAction = useCallback(
    async <TPayload extends Record<string, unknown>>(action: string, payload: TPayload) => {
      setPendingAction(action);
      clearMessages();

      try {
        const nextCharacter = await postGameAction<CharacterInfoView>(action, payload);
        applyCharacterInfo(nextCharacter);
      } catch (error) {
        setErrorMessage(toMessage(error));
        throw error;
      } finally {
        setPendingAction(null);
      }
    },
    [applyCharacterInfo, clearMessages],
  );

  const signIn = useCallback(async (email: string, password: string) => {
    clearMessages();
    setPendingAction('SIGN_IN');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }
    } catch (error) {
      setErrorMessage(toMessage(error));
      throw error;
    } finally {
      setPendingAction(null);
    }
  }, [clearMessages]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    clearMessages();
    setPendingAction('SIGN_UP');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || '无名好汉',
          },
        },
      });

      if (error) {
        throw error;
      }

      setInfoMessage('注册成功。若配置了邮箱验证，请先完成验证再登录。');
      setAuthMode('login');
    } catch (error) {
      setErrorMessage(toMessage(error));
      throw error;
    } finally {
      setPendingAction(null);
    }
  }, [clearMessages]);

  const signOut = useCallback(async () => {
    clearMessages();
    await supabase.auth.signOut();
  }, [clearMessages]);

  const createCharacter = useCallback(async (payload: CreateCharacterPayload) => {
    setPendingAction('CREATE_CHARACTER');
    clearMessages();

    try {
      const nextCharacter = await postGameAction<CharacterInfoView>('CREATE_CHARACTER', payload);
      applyCharacterInfo(nextCharacter);
    } catch (error) {
      setErrorMessage(toMessage(error));
      throw error;
    } finally {
      setPendingAction(null);
    }
  }, [applyCharacterInfo, clearMessages]);

  const upgradeAttribute = useCallback(async (attribute: AttributeKey) => {
    await runCharacterAction('UPGRADE_ATTRIBUTE', { attribute });
  }, [runCharacterAction]);

  const equipItem = useCallback(async (itemId: string) => {
    await runCharacterAction('EQUIP_ITEM', { itemId });
  }, [runCharacterAction]);

  const unequipItem = useCallback(async (slot: EquipmentSlot) => {
    await runCharacterAction('UNEQUIP_ITEM', { slot });
  }, [runCharacterAction]);

  const value = useMemo<GameStateContextValue>(() => ({
    session,
    authLoading,
    bootLoading,
    pendingAction,
    serverBusyAction,
    isServerBusy: serverBusyCount > 0 || pendingAction !== null,
    saveState,
    character,
    errorMessage,
    infoMessage,
    authMode,
    setAuthMode,
    signIn,
    signUp,
    signOut,
    refreshGameState,
    refreshCharacterInfo,
    createCharacter,
    upgradeAttribute,
    equipItem,
    unequipItem,
    runServerAction,
    clearMessages,
  }), [
    session,
    authLoading,
    bootLoading,
    pendingAction,
    serverBusyAction,
    serverBusyCount,
    saveState,
    character,
    errorMessage,
    infoMessage,
    authMode,
    signIn,
    signUp,
    signOut,
    refreshGameState,
    refreshCharacterInfo,
    createCharacter,
    upgradeAttribute,
    equipItem,
    unequipItem,
    runServerAction,
    clearMessages,
  ]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider.');
  }
  return context;
}
