import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Swords, Mail, Lock, User, Loader2, AlertCircle } from 'lucide-react';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || '无名好汉' },
          },
        });
        if (signUpError) throw signUpError;
        setInfo('注册成功！请检查邮箱确认链接，确认后即可登录。');
        setMode('login');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) {
      const msg = err?.message ?? '未知错误';
      if (msg.includes('Invalid login credentials')) setError('邮箱或密码错误');
      else if (msg.includes('Email not confirmed')) setError('邮箱尚未验证，请检查邮件');
      else if (msg.includes('User already registered')) setError('该邮箱已注册，请直接登录');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(176,42,42,0.08)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo / Title */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(176,42,42,0.3)]">
            <Swords className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white">大宋造反模拟器</h1>
          <p className="text-xs text-textMuted mt-1 tracking-widest font-mono">私域测试服 · 凭引荐方可入局</p>
        </div>

        {/* Card */}
        <div className="bg-[#111115] border border-white/10 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <h2 className="text-lg font-bold text-white mb-6 tracking-wider">
            {mode === 'login' ? '凭证入局' : '登记造册'}
          </h2>

          {error && (
            <div className="flex items-start gap-2 bg-red-900/30 border border-red-700/50 text-red-300 text-sm p-3 rounded-lg mb-5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="bg-emerald-900/30 border border-emerald-700/50 text-emerald-300 text-sm p-3 rounded-lg mb-5">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-textMuted mb-1.5 tracking-wider">游戏名号</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="无名好汉"
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-textMuted/40 focus:outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-textMuted mb-1.5 tracking-wider">邮箱</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-textMuted/40 focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-textMuted mb-1.5 tracking-wider">密码</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="至少 6 位"
                  className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-textMuted/40 focus:outline-none focus:border-primary/60 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-primary hover:bg-red-700 disabled:bg-primary/40 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 tracking-widest text-sm shadow-[0_0_20px_rgba(176,42,42,0.3)]"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> 处理中...</>
              ) : mode === 'login' ? '入局' : '立案造册'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <span className="text-xs text-textMuted">
              {mode === 'login' ? '尚无账号？' : '已有账号？'}
            </span>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setInfo(null); }}
              className="text-xs text-primary hover:text-red-400 ml-1 font-medium transition-colors"
            >
              {mode === 'login' ? '申请入局资格' : '返回登录'}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-textMuted/40 mt-6 font-mono">
          本服务器仅供受邀玩家测试 · 请勿传播
        </p>
      </div>
    </div>
  );
}
