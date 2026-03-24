import 'server-only';

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { xianTrip } from '@/lib/trip/data/xian';
import { createEmptyTripState, normalizeItemState } from '@/lib/trip/runtime';
import type {
    TripAccessLevel,
    TripDefinition,
    TripDefinitionPublic,
    TripItem,
    TripRuntimeState,
    TripSnapshot,
} from '@/lib/trip/types';

const DEFAULT_TOKENS = {
    xian: {
        view: 'xian-view-change-me',
        edit: 'xian-edit-change-me',
    },
};

type TripUpdateAction = 'start' | 'complete' | 'skip' | 'reset' | 'delay';

interface UpdateTripItemInput {
    slug: string;
    token: string;
    itemId: string;
    note?: string;
    action?: TripUpdateAction;
    delayMin?: number;
}

interface UploadTripPhotoInput {
    slug: string;
    token: string;
    itemId: string;
    files: Array<{
        name: string;
        type: string;
        arrayBuffer: () => Promise<ArrayBuffer>;
    }>;
}

function readTripTokenEnv(name: string, fallback: string) {
    const value = process.env[name]?.trim();
    return value || fallback;
}

function getTripDefinitions(): Record<string, TripDefinition> {
    const xianViewToken = readTripTokenEnv('TRIP_XIAN_VIEW_TOKEN', DEFAULT_TOKENS.xian.view);
    const xianEditToken = readTripTokenEnv('TRIP_XIAN_EDIT_TOKEN', DEFAULT_TOKENS.xian.edit);

    return {
        xian: {
            ...xianTrip,
            tokens: {
                view: xianViewToken,
                edit: xianEditToken,
                usingDefault:
                    xianViewToken === DEFAULT_TOKENS.xian.view || xianEditToken === DEFAULT_TOKENS.xian.edit,
            },
        },
    };
}

function getTripDefinition(slug: string) {
    return getTripDefinitions()[slug] || null;
}

function toPublicTrip(definition: TripDefinition): TripDefinitionPublic {
    const { tokens: _tokens, ...rest } = definition;
    return rest;
}

function resolveAccess(definition: TripDefinition, token: string): TripAccessLevel | null {
    if (!token) return null;
    if (token === definition.tokens.edit) return 'edit';
    if (token === definition.tokens.view) return 'view';
    return null;
}

function getTripRuntimePath(slug: string) {
    return path.join(process.cwd(), 'data', 'trip-runtime', `${slug}.json`);
}

async function readTripState(slug: string): Promise<TripRuntimeState> {
    const filePath = getTripRuntimePath(slug);

    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(raw) as TripRuntimeState;
        return {
            ...createEmptyTripState(slug),
            ...parsed,
            slug,
            items: parsed?.items || {},
        };
    } catch {
        return createEmptyTripState(slug);
    }
}

async function writeTripState(slug: string, state: TripRuntimeState) {
    const filePath = getTripRuntimePath(slug);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const nextState = {
        ...state,
        slug,
    };
    await fs.writeFile(filePath, JSON.stringify(nextState, null, 2), 'utf8');
}

function findTripItem(definition: TripDefinition, itemId: string): TripItem {
    const item = definition.items.find((candidate) => candidate.id === itemId);
    if (!item) {
        throw new Error('行程项不存在');
    }
    return item;
}

function clampDelay(delayMin: number | undefined) {
    if (!delayMin) return 15;
    return Math.max(5, Math.min(180, Math.round(delayMin)));
}

function sanitizeNote(note: string | undefined) {
    if (typeof note !== 'string') return undefined;
    return note.replace(/\s+/g, ' ').trim().slice(0, 200);
}

function buildSnapshot(
    definition: TripDefinition,
    state: TripRuntimeState,
    accessLevel: TripAccessLevel
): TripSnapshot {
    return {
        trip: toPublicTrip(definition),
        state,
        accessLevel,
        usingDefaultToken: definition.tokens.usingDefault,
        generatedAt: new Date().toISOString(),
        shareTokens:
            accessLevel === 'edit'
                ? {
                      view: definition.tokens.view,
                      edit: definition.tokens.edit,
                  }
                : undefined,
    };
}

function ensureEditAccess(definition: TripDefinition, token: string) {
    const accessLevel = resolveAccess(definition, token);
    if (accessLevel !== 'edit') {
        throw new Error('没有编辑权限');
    }
    return accessLevel;
}

function extByMime(mime: string, name: string) {
    const ext = path.extname(name || '').toLowerCase();
    if (ext) return ext;
    const normalized = (mime || '').toLowerCase();
    if (normalized.includes('png')) return '.png';
    if (normalized.includes('webp')) return '.webp';
    if (normalized.includes('heic')) return '.heic';
    return '.jpg';
}

export async function getTripSnapshot(slug: string, token: string): Promise<TripSnapshot | null> {
    const definition = getTripDefinition(slug);
    if (!definition) return null;

    const accessLevel = resolveAccess(definition, token);
    if (!accessLevel) return null;

    const state = await readTripState(slug);
    return buildSnapshot(definition, state, accessLevel);
}

export async function updateTripItem(input: UpdateTripItemInput): Promise<TripSnapshot> {
    const definition = getTripDefinition(input.slug);
    if (!definition) {
        throw new Error('行程不存在');
    }

    ensureEditAccess(definition, input.token);
    findTripItem(definition, input.itemId);

    const state = await readTripState(input.slug);
    const now = new Date().toISOString();
    const current = normalizeItemState(input.itemId, state.items[input.itemId]);
    const next = {
        ...current,
    };

    const nextNote = sanitizeNote(input.note);
    if (typeof nextNote !== 'undefined') {
        next.note = nextNote;
    }

    switch (input.action) {
        case 'start':
            next.manualStatus = 'doing';
            next.actualStartAt = next.actualStartAt || now;
            break;
        case 'complete':
            next.manualStatus = 'done';
            next.actualStartAt = next.actualStartAt || now;
            next.actualEndAt = now;
            break;
        case 'skip':
            next.manualStatus = 'skipped';
            next.actualEndAt = now;
            break;
        case 'reset':
            next.manualStatus = 'pending';
            delete next.actualStartAt;
            delete next.actualEndAt;
            next.delayMin = 0;
            break;
        case 'delay':
            next.manualStatus = next.manualStatus === 'doing' ? 'doing' : 'pending';
            next.delayMin = (next.delayMin || 0) + clampDelay(input.delayMin);
            break;
        default:
            break;
    }

    next.updatedAt = now;
    state.items[input.itemId] = next;
    state.updatedAt = now;

    await writeTripState(input.slug, state);
    return buildSnapshot(definition, state, 'edit');
}

export async function uploadTripPhotos(input: UploadTripPhotoInput): Promise<TripSnapshot> {
    const definition = getTripDefinition(input.slug);
    if (!definition) {
        throw new Error('行程不存在');
    }

    ensureEditAccess(definition, input.token);
    findTripItem(definition, input.itemId);

    if (!input.files.length) {
        throw new Error('没有可上传的图片');
    }

    const now = new Date();
    const state = await readTripState(input.slug);
    const current = normalizeItemState(input.itemId, state.items[input.itemId]);
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const assetDir = path.join(process.cwd(), 'public', 'trip-assets', input.slug, ymd);
    await fs.mkdir(assetDir, { recursive: true });

    const photos = [...current.photos];

    for (const file of input.files) {
        const mime = file.type || 'image/jpeg';
        if (!mime.startsWith('image/')) {
            throw new Error('只能上传图片');
        }

        const ext = extByMime(mime, file.name);
        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.byteLength > 12 * 1024 * 1024) {
            throw new Error('图片太大，请压缩后再上传');
        }

        const filename = `${crypto.randomUUID()}${ext}`;
        const absPath = path.join(assetDir, filename);
        await fs.writeFile(absPath, buffer);

        const relativePath = path.posix.join('trip-assets', input.slug, ymd, filename);
        photos.push({
            id: crypto.randomUUID(),
            url: `/${relativePath}`,
            uploadedAt: now.toISOString(),
            name: file.name,
        });
    }

    state.items[input.itemId] = {
        ...current,
        photos,
        updatedAt: now.toISOString(),
    };
    state.updatedAt = now.toISOString();

    await writeTripState(input.slug, state);
    return buildSnapshot(definition, state, 'edit');
}
