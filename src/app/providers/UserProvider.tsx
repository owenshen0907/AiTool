// src/app/providers/UserProvider.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * 用户类型，仅包含 NavBar 需要的字段
 */
export interface User {
    name: string;
    displayName: string;
}

interface UserContextValue {
    user: User | null;
    setUser: (user: User | null) => void;
}

/**
 * 创建全局用户 Context
 */
const UserContext = createContext<UserContextValue>({
    user: null,
    setUser: () => {},
});

/**
 * Client-side Provider，用于包裹 NavBar 和子组件
 */
export function UserProvider({
                                 children,
                                 initialUser,
                             }: {
    children: ReactNode;
    initialUser: User | null;
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
}

/**
 * Hook：在组件中读取和更新用户信息
 */
export function useUser() {
    return useContext(UserContext);
}