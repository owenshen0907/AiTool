// src/app/ClientBoot.tsx
'use client';

import { useEffect } from 'react';
import { patchFetchOnce } from '@/lib/fetchPatch';

export default function ClientBoot() {
    useEffect(() => {
        patchFetchOnce(); // 只在客户端运行一次
    }, []);

    return null;
}