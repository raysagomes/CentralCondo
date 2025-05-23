import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !user) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    email: payload.email,
                    role: payload.role,
                    entityId: payload.entityId,
                    token,
                });
            } catch {
                setUser({ token });
            }
        }
    }, []);

    function logout() {
        setUser(null);
        localStorage.removeItem('token');
    }

    return (
        <AuthContext.Provider value={{ user, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
