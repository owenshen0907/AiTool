'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Supplier, Model } from '@/lib/models/model';

interface SupplierModelsState {
    suppliers: Supplier[];
    suppliersLoading: boolean;
    suppliersError: string | null;

    modelsCache: Record<string, Model[]>; // supplierId -> models
    modelLoadingIds: Set<string>;
    modelErrors: Record<string, string | null>;

    loadModelsFor: (supplierId: string) => Promise<void>;
    reloadSuppliers: () => Promise<void>;
}

export function useSupplierModels(autoLoad: boolean = true): SupplierModelsState {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [suppliersLoading, setSuppliersLoading] = useState(false);
    const [suppliersError, setSuppliersError] = useState<string | null>(null);

    const [modelsCache, setModelsCache] = useState<Record<string, Model[]>>({});
    const [modelLoadingIds, setModelLoadingIds] = useState<Set<string>>(new Set());
    const [modelErrors, setModelErrors] = useState<Record<string, string | null>>({});

    const reloadSuppliers = useCallback(async () => {
        setSuppliersLoading(true);
        setSuppliersError(null);
        try {
            const res = await fetch('/api/suppliers', { credentials: 'include' });
            if (!res.ok) throw new Error(`GET /api/suppliers ${res.status}`);
            const data: Supplier[] = await res.json();
            // 默认优先在前
            data.sort((a,b) => Number(b.isDefault) - Number(a.isDefault));
            setSuppliers(data);
        } catch (e: any) {
            setSuppliersError(e.message);
        } finally {
            setSuppliersLoading(false);
        }
    }, []);

    const loadModelsFor = useCallback(async (supplierId: string) => {
        if (!supplierId) return;
        if (modelsCache[supplierId]) return; // 已缓存
        setModelLoadingIds(prev => new Set([...prev, supplierId]));
        setModelErrors(prev => ({ ...prev, [supplierId]: null }));
        try {
            const res = await fetch(`/api/suppliers/models?supplier_id=${supplierId}`, { credentials: 'include' });
            if (!res.ok) throw new Error(`GET /api/suppliers/models ${res.status}`);
            const data: Model[] = await res.json();
            // 默认优先
            data.sort((a,b) => Number(b.isDefault) - Number(a.isDefault));
            setModelsCache(prev => ({ ...prev, [supplierId]: data }));
        } catch (e: any) {
            setModelErrors(prev => ({ ...prev, [supplierId]: e.message }));
        } finally {
            setModelLoadingIds(prev => {
                const n = new Set(prev);
                n.delete(supplierId);
                return n;
            });
        }
    }, [modelsCache]);

    useEffect(() => {
        if (autoLoad) {
            reloadSuppliers();
        }
    }, [autoLoad, reloadSuppliers]);

    return {
        suppliers,
        suppliersLoading,
        suppliersError,
        modelsCache,
        modelLoadingIds,
        modelErrors,
        loadModelsFor,
        reloadSuppliers
    };
}