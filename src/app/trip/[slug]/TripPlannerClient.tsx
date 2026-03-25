'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowRight,
    BedDouble,
    CalendarRange,
    Camera,
    Check,
    CheckCircle2,
    ChevronUp,
    Clock3,
    Coffee,
    Copy,
    ExternalLink,
    ImageIcon,
    Landmark,
    Loader2,
    NotebookPen,
    Plane,
    RotateCcw,
    SkipForward,
    Sparkles,
    TrainFront,
    Utensils,
    X,
} from 'lucide-react';
import {
    countTripProgress,
    decorateTripItem,
    formatDateTime,
    formatDayLabel,
    getDayKey,
    groupItemsByDay,
    pickFocusItem,
} from '@/lib/trip/runtime';
import type {
    DecoratedTripItem,
    TripDerivedStatus,
    TripItemType,
    TripKnowledgeCard,
    TripSnapshot,
} from '@/lib/trip/types';

interface TripPlannerClientProps {
    initialSnapshot: TripSnapshot;
    token: string;
}

type TripViewKey = 'progress' | 'overview' | string;

const statusStyles: Record<TripDerivedStatus, string> = {
    pending: 'border-[#d9c8b8] bg-[#f8efe6] text-[#775b47]',
    leave: 'border-[#dea36f] bg-[#fff0e2] text-[#9c5426]',
    doing: 'border-[#6c9d83] bg-[#eaf6ee] text-[#245b43]',
    missed: 'border-[#d88b7d] bg-[#fbeceb] text-[#98392d]',
    done: 'border-[#80a98a] bg-[#edf7ef] text-[#2f694b]',
    skipped: 'border-[#cbc1b5] bg-[#f4f0eb] text-[#6a5f56]',
};

const typeMeta: Record<TripItemType, { label: string; icon: LucideIcon; shell: string }> = {
    train: {
        label: '车次',
        icon: TrainFront,
        shell: 'bg-[linear-gradient(135deg,#1e3447_0%,#345f7b_100%)] text-white',
    },
    flight: {
        label: '航班',
        icon: Plane,
        shell: 'bg-[linear-gradient(135deg,#18354d_0%,#3f7db0_100%)] text-white',
    },
    hotel: {
        label: '住宿',
        icon: BedDouble,
        shell: 'bg-[linear-gradient(135deg,#3e392f_0%,#85705c_100%)] text-white',
    },
    spot: {
        label: '景点',
        icon: Landmark,
        shell: 'bg-[linear-gradient(135deg,#5b2d1b_0%,#b4682f_100%)] text-white',
    },
    meal: {
        label: '吃饭',
        icon: Utensils,
        shell: 'bg-[linear-gradient(135deg,#5a3018_0%,#c07b34_100%)] text-white',
    },
    transport: {
        label: '交通',
        icon: ArrowRight,
        shell: 'bg-[linear-gradient(135deg,#334047_0%,#73848d_100%)] text-white',
    },
    rest: {
        label: '休息',
        icon: Coffee,
        shell: 'bg-[linear-gradient(135deg,#304334_0%,#6b8d70_100%)] text-white',
    },
};

function isClosedStatus(status: TripDerivedStatus) {
    return status === 'done' || status === 'skipped';
}

function formatDurationText(deltaMs: number) {
    const absMin = Math.max(0, Math.round(Math.abs(deltaMs) / 60000));
    const days = Math.floor(absMin / (24 * 60));
    const hours = Math.floor((absMin % (24 * 60)) / 60);
    const minutes = absMin % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}天`);
    if (hours > 0) parts.push(`${hours}小时`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分`);
    return parts.join('');
}

function uniqueTexts(values: Array<string | undefined>, limit = 4) {
    return [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))]
        .slice(0, limit);
}

function compactText(text: string | undefined, max = 36) {
    if (!text) return '';
    if (text.length <= max) return text;

    const slice = text.slice(0, max);
    const punctuationIndex = Math.max(slice.lastIndexOf('，'), slice.lastIndexOf('。'), slice.lastIndexOf('、'));
    const end = punctuationIndex >= Math.floor(max * 0.55) ? punctuationIndex : slice.length;

    return `${slice.slice(0, end).trim()}…`;
}

function buildUploadName(file: File, mime: string) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'trip-photo';
    if (mime.includes('png')) return `${base}.png`;
    if (mime.includes('webp')) return `${base}.webp`;
    return `${base}.jpg`;
}

async function readImage(file: File) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(objectUrl);
            reject(error);
        };
        img.src = objectUrl;
    });
}

async function compressPhoto(file: File) {
    if (file.size <= 1.6 * 1024 * 1024) return file;

    const image = await readImage(file);
    const maxSide = 1600;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(image, 0, 0, width, height);
    const mime = file.type.includes('png') ? 'image/png' : 'image/jpeg';

    return new Promise<Blob>((resolve) => {
        canvas.toBlob(
            (blob) => resolve(blob || file),
            mime,
            mime === 'image/jpeg' ? 0.86 : undefined
        );
    });
}

function buildFallbackPlayHighlights(item: DecoratedTripItem) {
    if (item.type === 'flight' || item.type === 'train') {
        return uniqueTexts(
            [
                '这段以准时衔接为第一优先级，先别把注意力分散到别的行程。',
                item.transport ? `先按 ${item.transport} 的节奏走，证件和手机保持随手可拿。` : undefined,
                ...(item.tips || []),
            ],
            3
        );
    }

    if (item.type === 'hotel') {
        return uniqueTexts(
            [
                '这段更适合把证件、充电器、第二天衣物和洗漱用品重新整理一遍。',
                item.bookingNote,
                ...(item.tips || []),
            ],
            3
        );
    }

    return uniqueTexts([...(item.playHighlights || []), item.highlight, item.subtitle, ...(item.tips || [])], 3);
}

function buildFallbackKnowledgeCards(item: DecoratedTripItem): TripKnowledgeCard[] {
    if (item.knowledgeCards?.length) return item.knowledgeCards.slice(0, 3);

    if (item.type === 'flight' || item.type === 'train') {
        return [
            {
                title: '这段的核心目标',
                text: '别追求“顺便做很多事”，把衔接做稳，后面整条链路都会轻松很多。',
            },
            {
                title: '现场优先级',
                text: item.transport || item.location || '优先看票面、站台、值机和出发时间。',
            },
        ];
    }

    if (item.type === 'hotel') {
        return [
            {
                title: '住一晚最值的动作',
                text: '把第二天要用的关键物品先分出来，早上会比睡前临时翻箱轻松得多。',
            },
            {
                title: '别在这里掉链子',
                text: item.bookingNote || '入住和退房都尽量一次确认清楚，别把账单和连住信息拖到第二天。',
            },
        ];
    }

    return uniqueTexts([item.highlight, item.bookingNote, item.subtitle, ...(item.tips || [])], 3).map((text, index) => ({
        title: index === 0 ? '顺手了解' : `补充提醒 ${index}`,
        text,
    }));
}

export default function TripPlannerClient({ initialSnapshot, token }: TripPlannerClientProps) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [now, setNow] = useState(() => new Date());
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
    const [copiedLinkKey, setCopiedLinkKey] = useState<'view' | 'edit' | null>(null);
    const [activeView, setActiveView] = useState<TripViewKey>('progress');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [isCondensed, setIsCondensed] = useState(false);
    const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
    const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>(() => {
        return Object.fromEntries(
            initialSnapshot.trip.items.map((item) => [item.id, initialSnapshot.state.items[item.id]?.note || ''])
        );
    });

    const canEdit = snapshot.accessLevel === 'edit';
    const timeZone = snapshot.trip.timezone;

    useEffect(() => {
        const timer = window.setInterval(() => setNow(new Date()), 30000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsCondensed(window.scrollY > 18);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const media = window.matchMedia('(min-width: 1024px)');
        const syncMenuState = (matches: boolean) => {
            setIsViewMenuOpen(matches);
        };

        syncMenuState(media.matches);
        const handleChange = (event: MediaQueryListEvent) => syncMenuState(event.matches);
        media.addEventListener('change', handleChange);
        return () => media.removeEventListener('change', handleChange);
    }, []);

    useEffect(() => {
        setNoteDrafts((prev) => {
            const next = { ...prev };
            for (const item of snapshot.trip.items) {
                if (typeof next[item.id] === 'undefined') {
                    next[item.id] = snapshot.state.items[item.id]?.note || '';
                }
            }
            return next;
        });
    }, [snapshot.state.items, snapshot.trip.items]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsCondensed(false);
        if (window.innerWidth >= 1024) {
            setIsViewMenuOpen(true);
        }
    }, [activeView]);

    useEffect(() => {
        if (!token) return;

        const timer = window.setInterval(async () => {
            try {
                const response = await fetch(`/api/public/trip/${snapshot.trip.slug}`, {
                    headers: { 'x-trip-token': token },
                    cache: 'no-store',
                });
                if (!response.ok) return;
                const nextSnapshot = (await response.json()) as TripSnapshot;
                setSnapshot(nextSnapshot);
            } catch {
                // 轮询失败时静默处理，避免频繁打断查看。
            }
        }, 90000);

        return () => window.clearInterval(timer);
    }, [snapshot.trip.slug, token]);

    const decoratedItems = useMemo(() => {
        return snapshot.trip.items
            .map((item) => decorateTripItem(item, snapshot.state.items[item.id], now, timeZone))
            .sort(
                (left, right) =>
                    new Date(left.effectiveStartAt).getTime() - new Date(right.effectiveStartAt).getTime()
            );
    }, [now, snapshot.state.items, snapshot.trip.items, timeZone]);

    const groupedDays = useMemo(
        () => groupItemsByDay(snapshot.trip.days, decoratedItems),
        [decoratedItems, snapshot.trip.days]
    );

    const focusItem = useMemo(() => pickFocusItem(decoratedItems), [decoratedItems]);
    const progress = useMemo(() => countTripProgress(snapshot.trip, snapshot.state), [snapshot.state, snapshot.trip]);
    const todayKey = getDayKey(now, timeZone);
    const sharePaths = useMemo(() => {
        if (!snapshot.shareTokens) return null;

        return {
            view: `/trip/${snapshot.trip.slug}?token=${snapshot.shareTokens.view}`,
            edit: `/trip/${snapshot.trip.slug}?token=${snapshot.shareTokens.edit}`,
        };
    }, [snapshot.shareTokens, snapshot.trip.slug]);

    const heroVisuals = snapshot.trip.heroVisuals || [];
    const firstItem = decoratedItems[0];
    const lastItem = decoratedItems[decoratedItems.length - 1];
    const firstStartMs = firstItem ? new Date(firstItem.effectiveStartAt).getTime() : 0;
    const firstLeaveMs = firstItem
        ? firstStartMs - (firstItem.leaveAheadMin ?? 30) * 60 * 1000
        : 0;
    const lastEndMs = lastItem ? new Date(lastItem.effectiveEndAt || lastItem.effectiveStartAt).getTime() : 0;
    const nowMs = now.getTime();
    const tripPhase: 'before' | 'active' | 'finished' =
        !firstItem || nowMs < firstStartMs ? 'before' : nowMs > lastEndMs ? 'finished' : 'active';
    const beforeStartUrgent = tripPhase === 'before' && nowMs >= firstLeaveMs;
    const tripCountdownText =
        firstItem && tripPhase === 'before'
            ? `${beforeStartUrgent ? '距离第一段开始还有 ' : '距离旅程开始还有 '}${formatDurationText(firstStartMs - nowMs)}`
            : '';

    const currentIndex = useMemo(() => {
        if (!decoratedItems.length) return -1;
        if (tripPhase === 'before') return 0;
        if (tripPhase === 'finished') return decoratedItems.length - 1;

        const focusIndex = focusItem ? decoratedItems.findIndex((item) => item.id === focusItem.id) : -1;
        return focusIndex >= 0 ? focusIndex : 0;
    }, [decoratedItems, focusItem, tripPhase]);

    const currentItem = currentIndex >= 0 ? decoratedItems[currentIndex] : null;
    const previousItem = currentIndex > 0 ? decoratedItems[currentIndex - 1] : null;
    const nextItem = currentIndex >= 0 && currentIndex < decoratedItems.length - 1 ? decoratedItems[currentIndex + 1] : null;
    const currentDay = currentItem
        ? groupedDays.find((day) => day.date === currentItem.dayKey) || null
        : groupedDays[0] || null;
    const activeDay =
        groupedDays.find((day) => day.date === todayKey) ||
        groupedDays.find((day) => day.items.some((item) => ['doing', 'leave', 'missed'].includes(item.status))) ||
        groupedDays[0] ||
        null;

    const currentPlayHighlights = currentItem ? buildFallbackPlayHighlights(currentItem) : [];
    const currentKnowledgeCards = currentItem ? buildFallbackKnowledgeCards(currentItem) : [];
    const selectedItem = selectedItemId
        ? decoratedItems.find((item) => item.id === selectedItemId) || null
        : null;

    function getItemVisual(item: DecoratedTripItem) {
        if (item.visual) return item.visual;

        const dayVisual = groupedDays.find((day) => day.date === item.dayKey)?.visual;
        if ((item.type === 'spot' || item.type === 'meal') && dayVisual) return dayVisual;
        return null;
    }

    function getCardVisual(item: DecoratedTripItem | null) {
        if (!item) return null;

        const visual = getItemVisual(item);
        if (visual) return visual;

        if (item.type === 'spot' || item.type === 'meal') {
            return currentDay?.visual || heroVisuals[0] || null;
        }

        return null;
    }

    async function commitItem(
        itemId: string,
        payload: { action?: 'start' | 'complete' | 'skip' | 'reset' | 'delay'; delayMin?: number; note?: string }
    ) {
        setBusyItemId(itemId);
        try {
            const response = await fetch(`/api/public/trip/${snapshot.trip.slug}/items/${itemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-trip-token': token,
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.error || '更新失败');
            }

            setSnapshot(result as TripSnapshot);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : '更新失败');
        } finally {
            setBusyItemId(null);
        }
    }

    async function handlePhotoUpload(itemId: string, files: FileList | null) {
        const file = files?.[0];
        if (!file) return;

        setUploadingItemId(itemId);
        try {
            const compressed = await compressPhoto(file);
            const form = new FormData();
            form.append('photo', compressed, buildUploadName(file, compressed.type || file.type));

            const response = await fetch(`/api/public/trip/${snapshot.trip.slug}/items/${itemId}/photos`, {
                method: 'POST',
                headers: {
                    'x-trip-token': token,
                },
                body: form,
            });

            const result = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(result?.error || '上传失败');
            }

            setSnapshot(result as TripSnapshot);
        } catch (error) {
            window.alert(error instanceof Error ? error.message : '上传失败');
        } finally {
            setUploadingItemId(null);
        }
    }

    async function copyShareLink(kind: 'view' | 'edit') {
        if (!sharePaths) return;

        const path = sharePaths[kind];
        const fullUrl = typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString();

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(fullUrl);
                setCopiedLinkKey(kind);
                window.setTimeout(() => {
                    setCopiedLinkKey((current) => (current === kind ? null : current));
                }, 1800);
                return;
            }
        } catch {
            // 继续走降级方案
        }

        window.prompt('复制这个链接', fullUrl);
    }

    function renderActions(item: DecoratedTripItem) {
        if (!canEdit) return null;

        const busy = busyItemId === item.id;
        const sharedClass =
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55';

        return (
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => commitItem(item.id, { action: 'start' })}
                    className={`${sharedClass} border-[#b8673d] bg-[#fff3e8] text-[#8d431d] hover:bg-[#ffe7d2]`}
                >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Clock3 size={16} />}
                    开始
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => commitItem(item.id, { action: 'complete' })}
                    className={`${sharedClass} border-[#6d977b] bg-[#edf7f0] text-[#24563f] hover:bg-[#dff1e5]`}
                >
                    <CheckCircle2 size={16} />
                    完成
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => commitItem(item.id, { action: 'delay', delayMin: 15 })}
                    className={`${sharedClass} border-[#d4ba97] bg-[#faf2e7] text-[#7a5b3f] hover:bg-[#f3e5d3]`}
                >
                    <Clock3 size={16} />
                    延后 15 分钟
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => commitItem(item.id, { action: 'skip' })}
                    className={`${sharedClass} border-[#d7b0ac] bg-[#fdf0ef] text-[#8f4338] hover:bg-[#f9e0dd]`}
                >
                    <SkipForward size={16} />
                    跳过
                </button>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => commitItem(item.id, { action: 'reset' })}
                    className={`${sharedClass} border-[#c9c1b6] bg-white text-[#615a53] hover:bg-[#f6f2ed]`}
                >
                    <RotateCcw size={16} />
                    重置
                </button>
            </div>
        );
    }

    function renderThumb(item: DecoratedTripItem | null, className: string) {
        if (!item) {
            return <div className={`${className} bg-[#f5ede3]`} />;
        }

        const visual = getItemVisual(item);
        const Icon = typeMeta[item.type].icon;

        if (visual) {
            return (
                <div className={`${className} relative overflow-hidden bg-[#e8ddd2]`}>
                    <img
                        src={visual.imageUrl}
                        alt={visual.title}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: visual.objectPosition || 'center center' }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,10,8,0.08)_0%,rgba(16,10,8,0.24)_42%,rgba(16,10,8,0.82)_100%)]" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                        <div className="text-[11px] uppercase tracking-[0.16em] text-white/72">{typeMeta[item.type].label}</div>
                        <div className="mt-2 text-lg font-semibold leading-tight">{visual.title}</div>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${className} ${typeMeta[item.type].shell} flex flex-col justify-between p-4`}>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/12">
                    <Icon size={18} />
                </div>
                <div>
                    <div className="text-[11px] uppercase tracking-[0.16em] text-white/72">{typeMeta[item.type].label}</div>
                    <div className="mt-2 text-lg font-semibold leading-tight">{item.title}</div>
                </div>
            </div>
        );
    }

    function renderMiniItemCard(item: DecoratedTripItem | null, roleLabel: string) {
        if (!item) {
            return (
                <button
                    type="button"
                    onClick={() => setActiveView('overview')}
                    className="flex min-h-[148px] flex-col justify-between rounded-[24px] border border-dashed border-[#ddcfc1] bg-[linear-gradient(145deg,#fffaf4_0%,#f6ecdf_100%)] p-4 text-left text-[#8a7565] transition hover:-translate-y-[2px] hover:border-[#d6c4b2] hover:shadow-[0_16px_40px_rgba(75,43,22,0.08)]"
                >
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#9c7f6d]">{roleLabel}</div>
                        <div className="mt-2 text-base font-semibold leading-tight text-[#2a1f18]">还没轮到这一步</div>
                        <div className="mt-1.5 text-sm leading-6 text-[#856f61]">先把眼前这段走稳，后面会自己接上。</div>
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8c5227]">
                        去看总览
                        <ArrowRight size={15} />
                    </div>
                </button>
            );
        }

        return (
            <button
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className="group overflow-hidden rounded-[24px] border border-[#e2d6ca] bg-white text-left shadow-[0_14px_42px_rgba(75,43,22,0.08)] transition hover:-translate-y-[2px] hover:shadow-[0_18px_50px_rgba(75,43,22,0.12)]"
            >
                {renderThumb(item, 'h-18 w-full sm:h-24')}
                <div className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#8f715e]">{roleLabel}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[item.status]}`}>
                            {item.statusLabel}
                        </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-tight text-[#2a1f18] sm:text-base">{compactText(item.title, 18)}</h3>
                    <div className="mt-1 text-xs leading-5 text-[#796354]">{compactText(item.windowLabel, 14)}</div>
                    <div className="mt-1 text-xs leading-5 text-[#917b6b]">{compactText(item.location || item.transport || item.statusDetail, 20)}</div>
                    <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#8c5227]">
                        看详情
                        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                    </div>
                </div>
            </button>
        );
    }

    function renderProgressView() {
        if (!currentItem) {
            return (
                <div className="flex h-full items-center justify-center rounded-[30px] border border-[#e2d7cb] bg-white/70 text-[#7b6555]">
                    当前还没有可展示的旅程内容。
                </div>
            );
        }

        const currentVisual = getCardVisual(currentItem);
        const mainPlayHighlights = currentPlayHighlights.slice(0, 2);
        const mainKnowledgeCard = currentKnowledgeCards[0] || null;
        const quickPills = uniqueTexts(
            [
                tripPhase === 'before'
                    ? tripCountdownText || '先把开心带上，出发时间我替你盯着。'
                    : `${currentDay?.title || snapshot.trip.title} · ${currentItem.windowLabel}`,
                currentItem.location ? `现在去 ${currentItem.location}` : undefined,
                currentItem.transport || currentItem.address || currentItem.statusDetail,
            ],
            3
        ).map((text) => compactText(text, 24));
        const warmHeadline =
            tripPhase === 'before'
                ? '别急，出门这一小段我先替你看着。'
                : tripPhase === 'finished'
                  ? '这一段已经稳稳落袋啦。'
                  : '先把眼前这一步走顺，后面的浪漫会自己接上。';
        const warmSupport = compactText(
            currentItem.highlight || currentItem.bookingNote || currentItem.subtitle || currentItem.statusDetail,
            58
        );

        return (
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.08fr)_320px]">
                <div className="space-y-3">
                    <article className="overflow-hidden rounded-[28px] border border-[#d9ccbf] bg-[#fffaf4] shadow-[0_20px_70px_rgba(75,43,22,0.10)]">
                        <div className="relative h-[21vh] min-h-[156px] max-h-[300px] sm:h-[26vh] sm:min-h-[180px]">
                            {currentVisual ? (
                                <>
                                    <img
                                        src={currentVisual.imageUrl}
                                        alt={currentVisual.title}
                                        className="h-full w-full object-cover"
                                        style={{ objectPosition: currentVisual.objectPosition || 'center center' }}
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,7,0.05)_0%,rgba(18,10,7,0.16)_36%,rgba(18,10,7,0.86)_100%)]" />
                                </>
                            ) : (
                                renderThumb(currentItem, 'h-full w-full')
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${statusStyles[currentItem.status]}`}>
                                        {currentItem.statusLabel}
                                    </span>
                                    <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1.5 text-xs text-white/86 backdrop-blur">
                                        {tripPhase === 'before' ? tripCountdownText || currentItem.windowLabel : currentItem.windowLabel}
                                    </span>
                                </div>
                                <h2 className="mt-2.5 text-[22px] font-semibold leading-tight sm:mt-3 sm:text-[30px] md:text-[34px]">
                                    {currentItem.title}
                                </h2>
                                <p className="mt-1 max-w-2xl text-[13px] leading-5 text-white/84 sm:mt-1.5 sm:text-sm sm:leading-6">
                                    {compactText(currentItem.subtitle || currentItem.statusDetail, 42)}
                                </p>
                            </div>
                        </div>
                    </article>

                    <div className="flex flex-wrap gap-2">
                        {quickPills.map((text, index) => (
                            <span
                                key={text}
                                className={`rounded-full border border-[#e4d7ca] bg-white/82 px-3.5 py-2 text-xs font-medium text-[#6d594d] shadow-[0_10px_26px_rgba(75,43,22,0.05)] ${
                                    index > 1 ? 'hidden sm:inline-flex' : ''
                                }`}
                            >
                                {text}
                            </span>
                        ))}
                    </div>

                    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
                        <div className="rounded-[26px] border border-[#e3d7cb] bg-white/90 px-4 py-4 shadow-[0_14px_40px_rgba(75,43,22,0.06)] sm:px-5 sm:py-5">
                            <div className="text-lg font-semibold tracking-tight text-[#2a1f18] sm:text-xl">{warmHeadline}</div>
                            <p className="mt-1.5 text-sm leading-6 text-[#715c4d]">
                                {warmSupport || '你只要看现在，剩下的节奏都交给这张卡。'}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemId(currentItem.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#cf9a68] bg-[#fff1e2] px-4 py-2.5 text-sm font-medium text-[#8d431d] transition hover:bg-[#ffe5cb]"
                                >
                                    <ImageIcon size={16} />
                                    点开看详情
                                </button>
                            </div>
                            {tripPhase === 'active' ? renderActions(currentItem) : null}
                        </div>

                        <div className="grid gap-3">
                            {mainPlayHighlights.length ? (
                                <div className="rounded-[24px] border border-[#dfe7d8] bg-[linear-gradient(145deg,#f6fbef_0%,#eef6e2_100%)] px-4 py-4 shadow-[0_14px_36px_rgba(78,102,52,0.08)]">
                                    <div className="text-sm font-semibold text-[#55633d]">这会儿顺手玩</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {mainPlayHighlights.map((text) => (
                                            <span
                                                key={text}
                                                className="rounded-full border border-white/80 bg-white/80 px-3 py-2 text-xs leading-5 text-[#55633d]"
                                            >
                                                {compactText(text, 26)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {mainKnowledgeCard ? (
                                <div className="rounded-[24px] border border-[#d8d9e6] bg-[linear-gradient(145deg,#f5f7ff_0%,#edf1fb_100%)] px-4 py-4 shadow-[0_14px_36px_rgba(73,86,128,0.08)]">
                                    <div className="text-sm font-semibold text-[#27314f]">{mainKnowledgeCard.title}</div>
                                    <div className="mt-2 text-sm leading-6 text-[#55607f]">
                                        {compactText(mainKnowledgeCard.text, 72)}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </section>
                </div>

                <aside>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                        {renderMiniItemCard(previousItem, '前一程')}
                        {renderMiniItemCard(nextItem, '后一程')}

                        <div className="rounded-[26px] border border-[#e1d3c5] bg-[linear-gradient(145deg,#fff8ef_0%,#fff1dd_42%,#eef4f8_100%)] p-4 shadow-[0_14px_36px_rgba(75,43,22,0.08)] md:col-span-2 xl:col-span-1">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#9b7b67]">旅途进度</div>
                                    <div className="mt-2 text-3xl font-semibold tracking-tight text-[#2a1f18]">
                                        {currentIndex + 1} / {decoratedItems.length}
                                    </div>
                                </div>
                                <span className="rounded-full border border-white/80 bg-white/78 px-3 py-1.5 text-xs font-medium text-[#735c4d]">
                                    {compactText(currentDay?.title || '现在', 10)}
                                </span>
                            </div>
                            <div className="mt-3 text-sm leading-6 text-[#715c4d]">
                                {tripPhase === 'before'
                                    ? '还没正式出发也没关系，先把顺序记住就会很安心。'
                                    : '你只要看这一站，前后节奏我都放在旁边给你。'}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        );
    }

    function renderOverviewView() {
        const overviewLead = '一眼看节奏就够了，细节都藏进每张小卡片里。';
        const checklist = snapshot.trip.checklist.slice(0, 3);

        return (
            <div className="flex flex-col gap-3">
                <section className="rounded-[28px] border border-[#d9cbbc] bg-[linear-gradient(135deg,#fff8ef_0%,#ffe8cb_42%,#eef4f8_100%)] p-4 shadow-[0_18px_56px_rgba(75,43,22,0.08)] sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9a6d4c]">一页总览</div>
                            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2c2018] sm:text-3xl">{snapshot.trip.title}</h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f5a4c]">{overviewLead}</p>
                        </div>

                        {canEdit && sharePaths ? (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void copyShareLink('view')}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d9b897] bg-white/88 px-4 py-2 text-sm font-medium text-[#8c4b20] transition hover:bg-[#fff1e1]"
                                >
                                    {copiedLinkKey === 'view' ? <Check size={15} /> : <Copy size={15} />}
                                    {copiedLinkKey === 'view' ? '已复制查看链接' : '复制查看链接'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void copyShareLink('edit')}
                                    className="inline-flex items-center gap-2 rounded-full border border-[#d9cbbc] bg-white/88 px-4 py-2 text-sm font-medium text-[#6c594c] transition hover:bg-[#faf4ed]"
                                >
                                    {copiedLinkKey === 'edit' ? <Check size={15} /> : <Copy size={15} />}
                                    {copiedLinkKey === 'edit' ? '已复制编辑链接' : '复制编辑链接'}
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#2d6358]/15 bg-[#17493f] px-3.5 py-2 text-xs font-medium text-white">
                            已走稳 {progress.completed} / {progress.total}
                        </span>
                        <span className="rounded-full border border-white/80 bg-white/82 px-3.5 py-2 text-xs font-medium text-[#5f4a3d]">
                            现在看 {compactText(currentItem?.title || '还没到第一段', 14)}
                        </span>
                        <span className="hidden rounded-full border border-white/80 bg-white/72 px-3.5 py-2 text-xs font-medium text-[#5f6985] sm:inline-flex">
                            {formatDateTime(now, timeZone)}
                        </span>
                        {checklist.map((item, index) => (
                            <span
                                key={item}
                                className={`rounded-full border border-white/80 bg-white/72 px-3.5 py-2 text-xs text-[#5f4a3d] ${
                                    index > 0 ? 'hidden sm:inline-flex' : ''
                                }`}
                            >
                                {compactText(item, 10)}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="grid gap-3 md:grid-cols-3">
                    {groupedDays.map((day, index) => {
                        const dayClosed = day.items.filter((item) => isClosedStatus(item.status)).length;
                        const isToday = day.date === activeDay?.date;
                        return (
                            <button
                                key={day.date}
                                type="button"
                                onClick={() => setActiveView(day.date)}
                                className="group overflow-hidden rounded-[26px] border border-[#dfd3c7] bg-white text-left shadow-[0_16px_46px_rgba(75,43,22,0.08)] transition hover:-translate-y-[2px] hover:shadow-[0_20px_52px_rgba(75,43,22,0.12)]"
                            >
                                <div className="relative h-32 sm:h-36">
                                    {day.visual ? (
                                        <>
                                            <img
                                                src={day.visual.imageUrl}
                                                alt={day.visual.title}
                                                className="h-full w-full object-cover"
                                                style={{ objectPosition: day.visual.objectPosition || 'center center' }}
                                            />
                                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,10,7,0.05)_0%,rgba(18,10,7,0.18)_36%,rgba(18,10,7,0.84)_100%)]" />
                                        </>
                                    ) : (
                                        <div className="h-full w-full bg-[linear-gradient(135deg,#e9d7c1_0%,#f6efe7_100%)]" />
                                    )}
                                    <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-3 text-white">
                                        <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] backdrop-blur">
                                            D{index + 1}
                                        </span>
                                        {isToday ? (
                                            <span className="rounded-full border border-white/18 bg-white/12 px-3 py-1 text-[11px] font-medium backdrop-blur">
                                                今天主看
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                                        <div className="text-xs text-white/74">{formatDayLabel(day.date, timeZone)}</div>
                                        <div className="mt-1 text-xl font-semibold leading-tight">{day.title}</div>
                                    </div>
                                </div>
                                <div className="space-y-3 p-4">
                                    <p className="text-sm leading-6 text-[#6f5a4c]">{compactText(day.focus, 30)}</p>
                                    <div className="flex items-center justify-between gap-3 text-sm text-[#765f50]">
                                        <span>{day.items.length} 段安排</span>
                                        <span>{dayClosed} 已收口</span>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8c5227]">
                                        切到这页
                                        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </section>
            </div>
        );
    }

    function renderDayView(dayKey: string) {
        const day = groupedDays.find((entry) => entry.date === dayKey) || groupedDays[0];
        if (!day) return null;

        const closed = day.items.filter((item) => isClosedStatus(item.status)).length;
        const todayInView = day.date === todayKey;
        const dayIndex = groupedDays.findIndex((entry) => entry.date === day.date) + 1;
        const dayHint = todayInView
            ? '今天就跟着这些缩略图慢慢玩，别把心情耗在看字上。'
            : '这一天只留主线，想深挖的时候再点开卡片。';

        return (
            <div className="flex flex-col gap-3">
                <section className="overflow-hidden rounded-[28px] border border-[#d9ccbf] bg-[#fffaf4] shadow-[0_18px_56px_rgba(75,43,22,0.08)]">
                    <div className="grid gap-0 md:grid-cols-[200px_minmax(0,1fr)]">
                        <div className="relative h-24 sm:h-28 md:h-full">
                            {day.visual ? (
                                <>
                                    <img
                                        src={day.visual.imageUrl}
                                        alt={day.visual.title}
                                        className="h-full w-full object-cover"
                                        style={{ objectPosition: day.visual.objectPosition || 'center center' }}
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,10,8,0.06)_0%,rgba(16,10,8,0.16)_36%,rgba(16,10,8,0.82)_100%)]" />
                                </>
                            ) : (
                                <div className="h-full w-full bg-[linear-gradient(135deg,#e9d7c1_0%,#f6efe7_100%)]" />
                            )}
                        </div>

                        <div className="flex flex-col justify-center gap-3 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#eaded2] bg-white px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-[#9a7d69]">
                                    D{dayIndex}
                                </span>
                                <span className="rounded-full border border-[#eaded2] bg-white px-3 py-1.5 text-xs font-medium text-[#6a5548]">
                                    {formatDayLabel(day.date, timeZone)}
                                </span>
                                {todayInView ? (
                                    <span className="rounded-full border border-[#d7e6d2] bg-[#f4faef] px-3 py-1.5 text-xs font-medium text-[#5f7644]">
                                        今天主看
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-[#2a1f18] sm:text-[30px]">{day.title}</h2>
                                <p className="mt-2 text-sm leading-6 text-[#6f5a4c]">{dayHint}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border border-[#ece0d5] bg-white px-3 py-2 text-xs font-medium text-[#705a4b]">
                                    {day.items.length} 个项目
                                </span>
                                <span className="hidden rounded-full border border-[#ece0d5] bg-white px-3 py-2 text-xs font-medium text-[#705a4b] sm:inline-flex">
                                    {closed} 个已收口
                                </span>
                                {day.visual?.title ? (
                                    <span className="hidden rounded-full border border-[#ece0d5] bg-white px-3 py-2 text-xs font-medium text-[#705a4b] sm:inline-flex">
                                        {compactText(day.visual.title, 12)}
                                    </span>
                                ) : null}
                                <span className="hidden rounded-full border border-[#ece0d5] bg-white px-3 py-2 text-xs font-medium text-[#705a4b] sm:inline-flex">
                                    {todayInView ? '慢慢玩' : '按点走'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <div className="text-lg font-semibold text-[#2a1f18]">今天只看这些卡</div>
                            <div className="mt-1 text-sm text-[#80695b]">往下看就行，想细看再点开。</div>
                        </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {day.items.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className="group overflow-hidden rounded-[24px] border border-[#e7dbcf] bg-white/96 text-left shadow-[0_12px_34px_rgba(75,43,22,0.08)] transition hover:-translate-y-[2px] hover:shadow-[0_16px_40px_rgba(75,43,22,0.12)]"
                            >
                                {renderThumb(item, 'h-28 w-full sm:h-32')}
                                <div className="space-y-2 p-3.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ebdfd3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#715949]">
                                            {(() => {
                                                const Icon = typeMeta[item.type].icon;
                                                return <Icon size={13} />;
                                            })()}
                                            {typeMeta[item.type].label}
                                        </span>
                                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[item.status]}`}>
                                            {item.statusLabel}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold leading-tight text-[#2a1f18]">{compactText(item.title, 18)}</div>
                                        <div className="mt-1 text-xs text-[#7b6556]">{compactText(item.windowLabel, 16)}</div>
                                    </div>
                                    <div className="text-sm leading-5 text-[#907a6b]">{compactText(item.location || item.transport || item.statusDetail, 22)}</div>
                                    <div className="inline-flex items-center gap-2 pt-1 text-sm font-medium text-[#8c5227]">
                                        点开详情
                                        <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            </div>
        );
    }

    function renderDetailModal(item: DecoratedTripItem) {
        const visual = getCardVisual(item);
        const playHighlights = buildFallbackPlayHighlights(item);
        const knowledgeCards = buildFallbackKnowledgeCards(item);
        const busy = busyItemId === item.id;
        const uploading = uploadingItemId === item.id;

        return (
            <div className="fixed inset-0 z-50 bg-[#1f1713]/58 p-3 backdrop-blur-sm md:p-5">
                <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-[#d8cbc0] bg-[#fffaf4] shadow-[0_30px_120px_rgba(35,20,13,0.28)]">
                    <div className="flex items-center justify-between gap-4 border-b border-[#eee2d6] px-5 py-4 md:px-6">
                        <div className="min-w-0">
                            <div className="text-xs uppercase tracking-[0.18em] text-[#9a7e6d]">项目详情</div>
                            <div className="mt-2 truncate text-2xl font-semibold text-[#2a1f18]">{item.title}</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedItemId(null)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#e2d5ca] bg-white text-[#6b564a] transition hover:bg-[#f8f2eb]"
                            aria-label="关闭详情"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[0.94fr_1.06fr]">
                        <div className="border-b border-[#eee2d6] lg:border-b-0 lg:border-r">
                            <div className="relative h-64 md:h-72 lg:h-full">
                                {visual ? (
                                    <>
                                        <img
                                            src={visual.imageUrl}
                                            alt={visual.title}
                                            className="h-full w-full object-cover"
                                            style={{ objectPosition: visual.objectPosition || 'center center' }}
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,10,8,0.08)_0%,rgba(14,10,8,0.18)_38%,rgba(14,10,8,0.82)_100%)]" />
                                        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
                                            <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-1 text-xs uppercase tracking-[0.16em] backdrop-blur">
                                                {typeMeta[item.type].label}
                                            </div>
                                            <div className="mt-3 text-2xl font-semibold">{visual.title}</div>
                                            <div className="mt-2 text-sm leading-7 text-white/80">{visual.caption}</div>
                                            <a
                                                href={visual.sourceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/88 transition hover:text-white"
                                            >
                                                图片来源：{visual.sourceName}
                                                <ExternalLink size={15} />
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    renderThumb(item, 'h-full w-full')
                                )}
                            </div>
                        </div>

                        <div className="min-h-0 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`rounded-full border px-4 py-2 text-sm font-medium ${statusStyles[item.status]}`}>
                                    {item.statusLabel}
                                </span>
                                <span className="text-sm text-[#7b6556]">{item.countdownText}</span>
                                <span className="text-sm text-[#7b6556]">{formatDayLabel(item.effectiveStartAt, timeZone)} · {item.windowLabel}</span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <div className="rounded-[22px] border border-[#eee2d6] bg-white px-4 py-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#a08370]">地点</div>
                                    <div className="mt-2 text-base font-semibold text-[#2a1f18]">{item.location || '待补充'}</div>
                                    <div className="mt-2 text-sm leading-7 text-[#7f695a]">{item.address || item.transport || '按现场情况前往'}</div>
                                </div>
                                <div className="rounded-[22px] border border-[#eee2d6] bg-white px-4 py-4">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#a08370]">当前提醒</div>
                                    <div className="mt-2 text-base font-semibold text-[#2a1f18]">{item.statusDetail}</div>
                                    <div className="mt-2 text-sm leading-7 text-[#7f695a]">{item.highlight || '这段的重点和提醒会优先显示在这里。'}</div>
                                </div>
                            </div>

                            {renderActions(item)}

                            <div className="mt-5 grid gap-4 xl:grid-cols-2">
                                <section className="rounded-[24px] border border-[#dfe7d8] bg-[linear-gradient(145deg,#f6fbef_0%,#eef6e2_100%)] p-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#6a7b49]">当前这段可玩什么</div>
                                    <div className="mt-3 space-y-2">
                                        {playHighlights.map((text) => (
                                            <div key={text} className="rounded-[18px] border border-white/80 bg-white/80 px-4 py-3 text-sm leading-7 text-[#55633d]">
                                                {text}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-[24px] border border-[#d8d9e6] bg-[linear-gradient(145deg,#f5f7ff_0%,#edf1fb_100%)] p-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#68739b]">科普 / 背景</div>
                                    <div className="mt-3 space-y-2">
                                        {knowledgeCards.map((card) => (
                                            <div key={`${card.title}-${card.text}`} className="rounded-[18px] border border-white/85 bg-white/82 px-4 py-3">
                                                <div className="text-sm font-semibold text-[#26304d]">{card.title}</div>
                                                <div className="mt-2 text-sm leading-7 text-[#57617e]">{card.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {item.bookingNote ? (
                                <section className="mt-5 rounded-[24px] border border-[#ead8c5] bg-[#fff8ef] px-4 py-4 text-sm leading-7 text-[#7a5d45]">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#9a7c67]">订单备注</div>
                                    <div className="mt-3">{item.bookingNote}</div>
                                </section>
                            ) : null}

                            {item.tips?.length ? (
                                <section className="mt-5">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#9a7c67]">现场小提醒</div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {item.tips.map((tip) => (
                                            <span key={tip} className="rounded-full border border-[#ebdfd3] bg-white px-3 py-2 text-xs text-[#6f5849]">
                                                {tip}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            <section className="mt-5 rounded-[24px] border border-[#ebdfd3] bg-white px-4 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#6a5448]">
                                        <NotebookPen size={16} />
                                        行程备注
                                    </div>
                                    {canEdit ? (
                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() => commitItem(item.id, { note: noteDrafts[item.id] || '' })}
                                            className="rounded-full border border-[#d8c5b1] bg-[#faf4ed] px-4 py-2 text-sm font-medium text-[#6f594b] transition hover:bg-[#f1e4d7] disabled:opacity-55"
                                        >
                                            保存备注
                                        </button>
                                    ) : null}
                                </div>

                                {canEdit ? (
                                    <textarea
                                        value={noteDrafts[item.id] || ''}
                                        onChange={(event) =>
                                            setNoteDrafts((prev) => ({
                                                ...prev,
                                                [item.id]: event.target.value.slice(0, 200),
                                            }))
                                        }
                                        rows={4}
                                        placeholder="比如：已经到了、排队有点久、这家店值得再来。"
                                        className="mt-3 w-full rounded-[18px] border border-[#eaded2] bg-[#fdfbf8] px-4 py-3 text-sm text-[#2f241c] outline-none transition focus:border-[#cda57c]"
                                    />
                                ) : item.runtimeState.note ? (
                                    <div className="mt-3 rounded-[18px] bg-[#f8f3ee] px-4 py-3 text-sm leading-7 text-[#6a5649]">
                                        {item.runtimeState.note}
                                    </div>
                                ) : (
                                    <div className="mt-3 text-sm text-[#8e7666]">还没有备注。</div>
                                )}

                                {canEdit ? (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d1b69c] bg-[#fff3e7] px-4 py-2 text-sm font-medium text-[#8a4c23] transition hover:bg-[#ffe7cf]">
                                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                                            {uploading ? '上传中...' : '拍照 / 上传照片'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                className="hidden"
                                                onChange={(event) => {
                                                    void handlePhotoUpload(item.id, event.target.files);
                                                    event.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <div className="text-sm text-[#8d7565]">建议一段拍一张就够，后面回看会轻松很多。</div>
                                    </div>
                                ) : null}

                                {item.runtimeState.photos.length ? (
                                    <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-4">
                                        {item.runtimeState.photos.map((photo) => (
                                            <a
                                                key={photo.id}
                                                href={photo.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="overflow-hidden rounded-[18px] border border-[#eadfd2] bg-[#f8f4ef]"
                                            >
                                                <img src={photo.url} alt={photo.name || item.title} className="h-28 w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                ) : null}
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeViewDay = activeView !== 'progress' && activeView !== 'overview'
        ? groupedDays.find((day) => day.date === activeView) || null
        : null;
    const activeViewDayIndex = activeViewDay ? groupedDays.findIndex((day) => day.date === activeViewDay.date) : -1;
    const isDayView = Boolean(activeViewDay);

    const viewLabel =
        activeView === 'progress'
            ? '旅途进程'
            : activeView === 'overview'
              ? '一页总览'
              : groupedDays.find((day) => day.date === activeView)?.title || '每日页';
    const topLine =
        activeView === 'progress'
            ? '只看眼前这一站，其他节奏我帮你记着。'
            : activeView === 'overview'
              ? '扫一眼就知道往哪走，不用被攻略淹没。'
              : '今天只保留主线，想细看再点卡片。';
    const mobileViewLabel = isDayView && activeViewDayIndex >= 0 ? `D${activeViewDayIndex + 1}` : viewLabel;
    const topCompactLabel =
        activeView === 'progress'
            ? compactText(currentItem?.title || '还没到第一段', 12)
            : activeView === 'overview'
              ? `${progress.completed}/${progress.total}`
              : compactText(groupedDays.find((day) => day.date === activeView)?.title || '每日页', 12);
    const topRightLabel =
        activeView === 'progress'
            ? compactText(currentItem?.windowLabel || tripCountdownText || '现在', 14)
            : activeView === 'overview'
              ? `D1-D${groupedDays.length}`
              : activeViewDay
                ? formatDayLabel(activeViewDay.date, timeZone)
                : '';
    const hasTopRightLabel = Boolean(topRightLabel);

    const viewOptions = [
        { key: 'progress', label: '进程' },
        { key: 'overview', label: '总览' },
        ...groupedDays.map((day, index) => ({ key: day.date, label: `D${index + 1}` })),
    ];

    return (
        <main className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,#fff8ea_0%,#fbe5c8_24%,#e6eff2_63%,#f6efe3_100%)] pb-24 text-[#2a1f18] md:pb-8">
            <div className="sticky top-0 z-30 px-3 pt-2 md:px-5 md:pt-3">
                <header
                    className={`mx-auto max-w-7xl overflow-hidden rounded-[24px] border border-[#daccc0] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(255,248,239,0.82)_100%)] shadow-[0_14px_36px_rgba(75,43,22,0.07)] backdrop-blur transition-all duration-500 ${
                        isCondensed ? 'px-4 py-2.5 md:px-5 md:py-3' : 'px-4 py-3.5 md:px-5 md:py-4'
                    }`}
                >
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <div className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9a6a45]">
                                <Sparkles size={13} />
                                <span className="truncate">{snapshot.trip.city} · 陪你慢慢玩</span>
                            </div>
                            <div className={`flex items-center gap-2 transition-all duration-500 ${isCondensed ? 'mt-1' : 'mt-1.5'}`}>
                                <h1 className={`truncate font-semibold tracking-tight text-[#2c2018] transition-all duration-500 ${isCondensed ? 'text-lg md:text-xl' : 'text-[24px] md:text-[30px]'}`}>
                                    {isDayView ? (
                                        <>
                                            <span className="sm:hidden">{mobileViewLabel}</span>
                                            <span className="hidden sm:inline">{viewLabel}</span>
                                        </>
                                    ) : (
                                        viewLabel
                                    )}
                                </h1>
                            </div>
                            <p
                                className={`overflow-hidden text-[13px] leading-5 text-[#735f51] transition-all duration-500 ${
                                    isDayView ? 'hidden sm:block ' : ''
                                }${
                                    isCondensed ? 'mt-0 max-h-0 opacity-0' : 'mt-1 max-h-10 opacity-100'
                                }`}
                            >
                                {topLine}
                            </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            {!isCondensed ? (
                                <div className="hidden rounded-full border border-[#e7dbcf] bg-white/76 px-3 py-1.5 text-xs font-medium text-[#7e6757] md:block">
                                    {formatDateTime(now, timeZone)}
                                </div>
                            ) : null}
                            {isCondensed || hasTopRightLabel ? (
                                <div className="rounded-full border border-[#eadccd] bg-[#fff8ef] px-3 py-1.5 text-xs font-medium text-[#8a6b58]">
                                    {isCondensed ? topCompactLabel : topRightLabel}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>
            </div>

            <div className="mx-auto mt-2 max-w-7xl px-3 md:px-5">
                {activeView === 'progress'
                    ? renderProgressView()
                    : activeView === 'overview'
                      ? renderOverviewView()
                      : renderDayView(activeView)}
            </div>

            <nav className="pointer-events-none fixed bottom-3 right-3 z-40 md:bottom-4 md:right-5">
                <div className="pointer-events-auto flex flex-col items-end gap-2">
                    <div
                        className={`flex flex-col items-end gap-2 transition-all duration-300 ${
                            isViewMenuOpen ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
                        }`}
                    >
                        <div className="rounded-[22px] border border-[#decfbe] bg-white/92 px-4 py-3 text-right shadow-[0_14px_36px_rgba(75,43,22,0.12)] backdrop-blur">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9a7b66]">路途进程</div>
                            <div className="mt-1 text-sm font-semibold text-[#2a1f18]">
                                {currentIndex >= 0 ? currentIndex + 1 : 0} / {decoratedItems.length}
                            </div>
                        </div>
                        {viewOptions.map((view) => {
                            const active = activeView === view.key;
                            return (
                                <button
                                    key={view.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveView(view.key);
                                        setIsViewMenuOpen(false);
                                    }}
                                    className={`min-w-[96px] rounded-full px-4 py-2.5 text-right text-sm font-medium transition md:min-w-[112px] ${
                                        active
                                            ? 'bg-[#8c5227] text-white shadow-[0_12px_28px_rgba(140,82,39,0.28)]'
                                            : 'border border-[#dfd1c2] bg-white/92 text-[#6b5749] shadow-[0_10px_24px_rgba(75,43,22,0.10)] hover:bg-[#f9f2e9]'
                                    }`}
                                >
                                    {view.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsViewMenuOpen((open) => !open)}
                        className="flex items-center gap-2 rounded-[26px] border border-[#d8cabd] bg-white/94 px-3 py-2.5 shadow-[0_18px_55px_rgba(75,43,22,0.16)] backdrop-blur transition hover:-translate-y-[1px] md:gap-3 md:px-4 md:py-3"
                        aria-expanded={isViewMenuOpen}
                        aria-label="展开旅途进程导航"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#fff3e4_0%,#f6e3cd_100%)] text-[#8c5227] md:h-10 md:w-10">
                            <CalendarRange size={18} />
                        </div>
                        <div className="text-left">
                            <div className="hidden text-[10px] uppercase tracking-[0.2em] text-[#9a7b66] sm:block">旅途进程</div>
                            <div className="mt-0.5 text-sm font-semibold text-[#2a1f18]">
                                {viewOptions.find((view) => view.key === activeView)?.label || viewLabel}
                            </div>
                        </div>
                        <div className="rounded-full bg-[#f7f1ea] px-3 py-1 text-xs font-medium text-[#8a725f]">
                            {currentIndex >= 0 ? currentIndex + 1 : 0}/{decoratedItems.length}
                        </div>
                        <ChevronUp
                            size={18}
                            className={`text-[#8a725f] transition-transform duration-300 ${isViewMenuOpen ? 'rotate-0' : 'rotate-180'}`}
                        />
                    </button>
                </div>
            </nav>

            {selectedItem ? renderDetailModal(selectedItem) : null}
        </main>
    );
}
