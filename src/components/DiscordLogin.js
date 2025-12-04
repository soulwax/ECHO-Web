import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// File: src/components/DiscordLogin.tsx
import { useAuth } from '../hooks/useAuth';
import './DiscordLogin.css';
export default function DiscordLogin() {
    const { session, loading, signIn, signOut, isAuthenticated } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "discord-login loading", children: _jsx("span", { className: "login-text", children: "Loading..." }) }));
    }
    if (isAuthenticated && session?.user) {
        return (_jsxs("div", { className: "discord-login authenticated", children: [_jsxs("div", { className: "user-info", children: [session.user.image && (_jsx("img", { src: session.user.image, alt: session.user.name || 'User', className: "user-avatar" })), _jsx("span", { className: "user-name", children: session.user.name || 'User' })] }), _jsx("button", { onClick: signOut, className: "login-button logout-button", children: "Logout" })] }));
    }
    return (_jsx("button", { onClick: signIn, className: "login-button login-button-primary", children: "Login with Discord" }));
}
