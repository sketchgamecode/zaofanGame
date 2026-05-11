import { useState } from 'react';
import { useGameState } from '../state/GameStateContext';

export function AuthScreen() {
  const {
    authMode,
    setAuthMode,
    pendingAction,
    errorMessage,
    infoMessage,
    signIn,
    signUp,
  } = useGameState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const isBusy = pendingAction === 'SIGN_IN' || pendingAction === 'SIGN_UP';

  return (
    <div className="auth-screen">
      <div className="auth-screen__panel">
        <div className="auth-screen__eyebrow">大宋造反模拟器</div>
        <h1 className="auth-screen__title">{authMode === 'login' ? '凭帖入局' : '造册立号'}</h1>
        <p className="auth-screen__subtitle">此版本使用与主站相同的账号体系。</p>

        {errorMessage ? <div className="auth-screen__message auth-screen__message--error">{errorMessage}</div> : null}
        {infoMessage ? <div className="auth-screen__message auth-screen__message--info">{infoMessage}</div> : null}

        <form
          className="auth-screen__form"
          onSubmit={(event) => {
            event.preventDefault();

            if (authMode === 'login') {
              void signIn(email, password);
              return;
            }

            void signUp(email, password, displayName);
          }}
        >
          {authMode === 'register' ? (
            <label className="auth-screen__field">
              <span>游戏名号</span>
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="无名好汉" />
            </label>
          ) : null}

          <label className="auth-screen__field">
            <span>邮箱</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-screen__field">
            <span>密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
              required
              placeholder="至少 6 位"
            />
          </label>

          <button className="auth-screen__submit" type="submit" disabled={isBusy}>
            {isBusy ? '处理中...' : authMode === 'login' ? '入局' : '登记'}
          </button>
        </form>

        <button
          className="auth-screen__switch"
          type="button"
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        >
          {authMode === 'login' ? '还没有账号？先登记。' : '已经有账号？返回登录。'}
        </button>
      </div>
    </div>
  );
}
