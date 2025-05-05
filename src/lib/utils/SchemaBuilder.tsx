// src/lib/utils/SchemaBuilder.tsx
'use client';

import React, { memo, useEffect, useRef, useState } from 'react';

/* ---------- 类型 ---------- */
export type SchemaField = {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    children: SchemaField[];
};

interface SchemaBuilderProps {
    initialSchema: string;
    onSchemaSave: (schema: string) => void;
}

/* ---------- 单行输入组件（稳定引用，避免失焦） ---------- */
interface FieldProps {
    path: number[];
    field: SchemaField;
    update: (path: number[], patch: Partial<SchemaField>) => void;
    remove: (path: number[]) => void;
    addChild: (path: number[]) => void;
}
const Field = memo(({ path, field, update, remove, addChild }: FieldProps) => (
    <div className="space-y-2 mt-2">
        <div className="flex items-center space-x-2">
            <input
                className="w-28 p-1 border rounded"
                value={field.key}
                placeholder="字段名"
                onChange={e => update(path, { key: e.target.value })}
            />
            <select
                className="p-1 border rounded"
                value={field.type}
                onChange={e => update(path, { type: e.target.value as any })}
            >
                {['string', 'number', 'boolean', 'object', 'array'].map(t => (
                    <option key={t}>{t}</option>
                ))}
            </select>
            <input
                className="flex-1 p-1 border rounded"
                placeholder="描述"
                value={field.description}
                onChange={e => update(path, { description: e.target.value })}
            />
            {field.type === 'object' && (
                <button
                    className="px-2 bg-green-100 text-green-600 rounded"
                    onClick={() => addChild(path)}
                >
                    +子
                </button>
            )}
            <button
                className="px-2 bg-red-100 text-red-600 rounded"
                onClick={() => remove(path)}
            >
                删
            </button>
        </div>

        {field.children.map((c, i) => (
            <Field
                key={i}
                path={[...path, i]}
                field={c}
                update={update}
                remove={remove}
                addChild={addChild}
            />
        ))}
    </div>
));
/* ---------- 组件 ---------- */
export default function SchemaBuilder({ initialSchema, onSchemaSave }: SchemaBuilderProps) {
    const [title, setTitle] = useState('用户输入解析');
    const [fields, setFields] = useState<SchemaField[]>([]);
    const inited = useRef(false);

    /* ---------- 初始化回填 ---------- */
    useEffect(() => {
        if (inited.current) return;
        inited.current = true;
        try {
            const parsed = JSON.parse(initialSchema);
            if (parsed.title) setTitle(parsed.title);

            const walk = (obj: any): SchemaField[] =>
                Object.entries(obj).map(([k, v]: any) => ({
                    key: k,
                    type: (v.type ?? 'string') as SchemaField['type'],
                    description: v.description ?? '',
                    children: v.properties ? walk(v.properties) : [],
                }));

            if (parsed.properties) setFields(walk(parsed.properties));
            else setFields([{ key: '', type: 'string', description: '', children: [] }]);
        } catch {
            setFields([{ key: '', type: 'string', description: '', children: [] }]);
        }
    }, [initialSchema]);

    /* ---------- 树操作工具 ---------- */
    const update = (path: number[], patch: Partial<SchemaField>) =>
        setFields(prev => _updateTree(prev, path, patch));

    const remove = (path: number[]) => setFields(prev => _removeNode(prev, path));

    const addChild = (path: number[]) =>
        setFields(prev =>
            _updateTree(prev, path, {
                children: [
                    ..._getNode(prev, path).children,
                    { key: '', type: 'string', description: '', children: [] },
                ],
            }),
        );

    function _updateTree(arr: SchemaField[], path: number[], patch: Partial<SchemaField>): SchemaField[] {
        const [h, ...rest] = path;
        return arr.map((n, i) =>
            i !== h
                ? n
                : rest.length === 0
                    ? { ...n, ...patch }
                    : { ...n, children: _updateTree(n.children, rest, patch) },
        );
    }
    function _removeNode(arr: SchemaField[], path: number[]): SchemaField[] {
        const [h, ...rest] = path;
        return arr
            .map((n, i) => {
                if (i !== h) return n;
                return rest.length ? { ...n, children: _removeNode(n.children, rest) } : null!;
            })
            .filter(Boolean);
    }
    function _getNode(arr: SchemaField[], path: number[]): SchemaField {
        const [h, ...rest] = path;
        const node = arr[h];
        return rest.length ? _getNode(node.children, rest) : node;
    }

    /* ---------- 构造最终 schema ---------- */
    const buildSchema = () => {
        const buildObj = (fs: SchemaField[]) => {
            const props: any = {};
            const req: string[] = [];
            fs.forEach(f => {
                if (!f.key.trim()) return;
                const node: any = { type: f.type };
                if (f.description) node.description = f.description;
                if (f.type === 'object' && f.children.length) {
                    const sub = buildObj(f.children);
                    node.properties = sub.properties;
                    node.required = sub.required;
                }
                props[f.key] = node;
                req.push(f.key);
            });
            return { properties: props, required: req };
        };
        return JSON.stringify(
            {
                $schema: 'http://json-schema.org/draft-07/schema#',
                title,
                type: 'object',
                ...buildObj(fields),
            },
            null,
            2,
        );
    };

    /* ---------- UI ---------- */
    return (
        <div className="max-h-[300px] overflow-auto space-y-4">
            {/* 操作区放顶部 */}
            <div className="flex items-center space-x-3">
                <button
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded"
                    onClick={() =>
                        setFields(p => [...p, { key: '', type: 'string', description: '', children: [] }])
                    }
                >
                    + 顶层字段
                </button>
                <button
                    className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => onSchemaSave(buildSchema())}
                >
                    保存 Schema
                </button>
            </div>

            {/* 标题 */}
            <input
                className="w-full p-2 border rounded"
                value={title}
                placeholder="Schema 标题"
                onChange={e => setTitle(e.target.value)}
            />

            {/* 顶层字段列表：最多 5 行可视，其余滚动 */}
            <div className="border rounded p-2 max-h-[220px] overflow-auto">
                {fields.map((f, i) => (
                    <Field
                        key={i}
                        path={[i]}
                        field={f}
                        update={update}
                        remove={remove}
                        addChild={addChild}
                    />
                ))}
            </div>
        </div>
    );
}