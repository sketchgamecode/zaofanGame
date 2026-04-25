import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { supabase } from '../lib/supabase';
export function AuthScreen({ onSuccess }) {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (mode === 'register') {
                const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name || '无名好汉' } } });
                if (e)
                    throw e;
                setMode('login');
                setError('注册成功，请登录');
            }
            else {
                const { error: e } = await supabase.auth.signInWithPassword({ email, password });
                if (e)
                    throw e;
                onSuccess();
            }
        }
        catch (e) {
            setError(e?.message?.includes('Invalid') ? '邮箱或密码错误' : e?.message ?? '未知错误');
        }
        setLoading(false);
    };
    return (_jsxs("div", { className: "auth-wrap", children: [_jsx("div", { className: "auth-logo", children: "\u2694\uFE0F" }), _jsx("div", { className: "auth-title", children: "\u5927\u5B8B\u9020\u53CD\u6A21\u62DF\u5668" }), _jsx("div", { className: "auth-sub", children: "\u79C1\u57DF\u6D4B\u8BD5\u670D \u00B7 \u51ED\u5F15\u8350\u65B9\u53EF\u5165\u5C40" }), _jsxs("div", { className: "auth-card", children: [error && _jsx("div", { className: "auth-err", children: error }), _jsxs("form", { onSubmit: submit, children: [mode === 'register' && (_jsxs("div", { className: "field", children: [_jsx("label", { children: "\u6E38\u620F\u540D\u53F7" }), _jsx("input", { value: name, onChange: e => setName(e.target.value), placeholder: "\u65E0\u540D\u597D\u6C49" })] })), _jsxs("div", { className: "field", children: [_jsx("label", { children: "\u90AE\u7BB1" }), _jsx("input", { type: "email", required: true, value: email, onChange: e => setEmail(e.target.value), placeholder: "your@email.com" })] }), _jsxs("div", { className: "field", children: [_jsx("label", { children: "\u5BC6\u7801" }), _jsx("input", { type: "password", required: true, value: password, onChange: e => setPassword(e.target.value), placeholder: "\u81F3\u5C11 6 \u4F4D" })] }), _jsx("button", { type: "submit", className: "btn btn-primary", disabled: loading, children: loading ? '处理中…' : mode === 'login' ? '入局' : '立案造册' })] }), _jsxs("div", { className: "auth-switch", children: [mode === 'login' ? '尚无账号？' : '已有账号？', _jsx("button", { onClick: () => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }, children: mode === 'login' ? '申请入局' : '返回登录' })] })] })] }));
}
