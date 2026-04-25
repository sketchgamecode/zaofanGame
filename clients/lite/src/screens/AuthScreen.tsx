import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AuthScreen({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'register') {
        const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name || '无名好汉' } } });
        if (e) throw e;
        setMode('login'); setError('注册成功，请登录');
      } else {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) throw e;
        onSuccess();
      }
    } catch (e: any) {
      setError(e?.message?.includes('Invalid') ? '邮箱或密码错误' : e?.message ?? '未知错误');
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-logo">⚔️</div>
      <div className="auth-title">大宋造反模拟器</div>
      <div className="auth-sub">私域测试服 · 凭引荐方可入局</div>
      <div className="auth-card">
        {error && <div className="auth-err">{error}</div>}
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field"><label>游戏名号</label><input value={name} onChange={e => setName(e.target.value)} placeholder="无名好汉" /></div>
          )}
          <div className="field"><label>邮箱</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" /></div>
          <div className="field"><label>密码</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="至少 6 位" /></div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '处理中…' : mode === 'login' ? '入局' : '立案造册'}</button>
        </form>
        <div className="auth-switch">
          {mode === 'login' ? '尚无账号？' : '已有账号？'}
          <button onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? '申请入局' : '返回登录'}
          </button>
        </div>
      </div>
    </div>
  );
}
