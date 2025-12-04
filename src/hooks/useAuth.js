// File: src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { getSession, signIn, signOut } from '../lib/auth-client';
export function useAuth() {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getSession().then((sessionData) => {
            setSession(sessionData);
            setLoading(false);
        });
    }, []);
    const handleSignIn = async () => {
        await signIn();
    };
    const handleSignOut = async () => {
        await signOut();
        setSession(null);
    };
    return {
        session,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        isAuthenticated: !!session?.user,
    };
}
