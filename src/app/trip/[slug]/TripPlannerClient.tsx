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
    Clock3,
    Coffee,
    Copy,
    Landmark,
    Loader2,
    Luggage,
    MapPinned,
    MoonStar,
    NotebookPen,
    Plane,
    Route,
    RotateCcw,
    ShieldCheck,
    SkipForward,
    Sparkles,
    TrainFront,
    Utensils,
} from 'lucide-react';
import {
    countTripProgress,
    decorateTripItem,
    formatClock,
    formatDateTime,
    formatDayLabel,
    getDayKey,
    groupItemsByDay,
    pickFocusItem,
} from '@/lib/trip/runtime';
import type { DecoratedTripItem, TripDerivedStatus, TripSnapshot, TripItemType } from '@/lib/trip/types';

interface TripPlannerClientProps {
    initialSnapshot: TripSnapshot;
    token: string;
}

const statusStyles: Record<TripDerivedStatus, string> = {
    pending: 'border-[#d3b79e] bg-[#f8efe5] text-[#7a5942]',
    leave: 'border-[#d28a57] bg-[#fff0e3] text-[#9e4f22]',
    doing: 'border-[#5f8f78] bg-[#ebf6ef] text-[#205c45]',
    missed: 'border-[#d27f72] bg-[#fbeceb] text-[#912f26]',
    done: 'border-[#78a284] bg-[#eff8f1] text-[#2f684b]',
    skipped: 'border-[#c8beb2] bg-[#f4f0eb] text-[#695f56]',
};

const typeMeta: Record<TripItemType, { label: string; icon: LucideIcon }> = {
    train: { label: '车次', icon: TrainFront },
    flight: { label: '航班', icon: Plane },
    hotel: { label: '住宿', icon: BedDouble },
    spot: { label: '景点', icon: Landmark },
    meal: { label: '吃饭', icon: Utensils },
    transport: { label: '交通', icon: Route },
    rest: { label: '休息', icon: Coffee },
};

function isClosedStatus(status: TripDerivedStatus) {
    return status === 'done' || status === 'skipped';
}

function summarizeDayTitles(titles: string[]) {
    if (titles.length <= 3) return titles.join(' · ');
    return `${titles.slice(0, 3).join(' · ')} · ...`;
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

export default function TripPlannerClient({ initialSnapshot, token }: TripPlannerClientProps) {
    const [snapshot, setSnapshot] = useState(initialSnapshot);
    const [now, setNow] = useState(() => new Date());
    const [busyItemId, setBusyItemId] = useState<string | null>(null);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
    const [copiedLinkKey, setCopiedLinkKey] = useState<'view' | 'edit' | null>(null);
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
                // 静默失败，避免每次轮询都打断用户。
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
    const activeDay =
        groupedDays.find((day) => day.date === todayKey) ||
        groupedDays.find((day) => day.items.some((item) => ['doing', 'leave', 'missed'].includes(item.status))) ||
        groupedDays[0];
    const nextItems = useMemo(() => {
        return decoratedItems
            .filter((item) => !isClosedStatus(item.status))
            .sort(
                (left, right) =>
                    new Date(left.effectiveStartAt).getTime() - new Date(right.effectiveStartAt).getTime()
            )
            .slice(0, 3);
    }, [decoratedItems]);
    const optionalItems = useMemo(
        () => snapshot.trip.items.filter((item) => item.isOptional),
        [snapshot.trip.items]
    );
    const hotelSummary = useMemo(() => {
        const hotelItems = snapshot.trip.items.filter((item) => item.type === 'hotel');
        const stayItem = hotelItems.find((item) => item.title.includes('连续住')) || hotelItems[0];
        return stayItem
            ? {
                  title: stayItem.location || stayItem.title,
                  note: stayItem.subtitle || stayItem.bookingNote || '这次住同一间房，不折腾换酒店。',
              }
            : null;
    }, [snapshot.trip.items]);
    const returnChain = useMemo(() => {
        const flight = snapshot.trip.items.find((item) => item.id.includes('return-flight'));
        const train = snapshot.trip.items.find((item) => item.id.includes('return-train'));
        if (!flight || !train) return null;

        return `${flight.title} -> ${train.title}`;
    }, [snapshot.trip.items]);

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

    return (
        <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe6_0%,#f8f5ef_28%,#efe3d0_100%)] text-[#2a1f18]">
            <div className="mx-auto max-w-6xl px-4 pb-12 pt-4 md:px-8 md:pb-16 md:pt-8">
                <section className="overflow-hidden rounded-[34px] border border-[#ddcbb8] bg-[radial-gradient(circle_at_top_left,#fff8f1_0%,#f4e7d8_42%,#ead8c2_100%)] p-5 shadow-[0_24px_90px_rgba(75,43,22,0.12)] md:p-8">
                    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#d9b897] bg-white/70 px-4 py-2 text-sm font-medium text-[#8d4f28]">
                                <Sparkles size={16} />
                                {snapshot.trip.city} / {snapshot.trip.companion}
                            </div>
                            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#2f2118] md:text-6xl">
                                {snapshot.trip.title}
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6b5546] md:text-lg">
                                {snapshot.trip.intro}
                            </p>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#866855] md:text-base">
                                {snapshot.trip.coverNote}
                            </p>
                            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ead3be] bg-[#fff8f1] px-4 py-2 text-sm text-[#7a5942]">
                                <MoonStar size={16} />
                                这一页会自己按时间切换，不用来回翻聊天记录找截图。
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                {snapshot.trip.checklist.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm text-[#5e483b]"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                            {snapshot.usingDefaultToken && canEdit ? (
                                <div className="mt-6 rounded-[24px] border border-[#d7c09d] bg-[#fff7ea] px-4 py-3 text-sm leading-7 text-[#7c5a31]">
                                    现在还是示例口令。正式发给她之前，先把 `TRIP_XIAN_VIEW_TOKEN` 和 `TRIP_XIAN_EDIT_TOKEN` 换成你自己的。
                                </div>
                            ) : null}
                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8a5a3a]">
                                        <CalendarRange size={16} />
                                        这次怎么走
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-[#715b4d]">
                                        27 号赶交通和兵马俑，28 号主打奥体演唱会，29 号只盯返程衔接。
                                    </p>
                                </div>
                                <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8a5a3a]">
                                        <MapPinned size={16} />
                                        方向提醒
                                    </div>
                                    <p className="mt-3 text-sm leading-7 text-[#715b4d]">
                                        长恨歌在临潼，大唐不夜城在城南，奥体在城东北，不是一条线。28 号如果想去不夜城，只能早点去早点走。
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {canEdit && sharePaths ? (
                                <div className="rounded-[26px] border border-[#e2c9ae] bg-[#fff7ef] p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)] sm:col-span-2 lg:col-span-1">
                                    <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8a4f2f]">
                                        <Copy size={16} />
                                        分享方式
                                    </div>
                                    <div className="mt-4 grid gap-3">
                                        <div className="rounded-[22px] border border-[#efdac7] bg-white/85 px-4 py-4">
                                            <div className="text-base font-semibold text-[#2b2018]">发她的只读链接</div>
                                            <div className="mt-1 text-sm leading-7 text-[#745d4e]">
                                                她打开后只看行程，不会误改状态和照片。
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void copyShareLink('view')}
                                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d8b694] bg-[#fff3e6] px-4 py-2 text-sm font-medium text-[#8c4b20] transition hover:bg-[#ffe6cf]"
                                            >
                                                {copiedLinkKey === 'view' ? <Check size={16} /> : <Copy size={16} />}
                                                {copiedLinkKey === 'view' ? '已复制只读链接' : '复制只读链接'}
                                            </button>
                                        </div>
                                        <div className="rounded-[22px] border border-[#e6ddd2] bg-[#fcfaf7] px-4 py-4">
                                            <div className="text-base font-semibold text-[#2b2018]">自己留的编辑链接</div>
                                            <div className="mt-1 text-sm leading-7 text-[#745d4e]">
                                                这个链接可以改状态、写备注、上传现场照片，不建议直接转发。
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => void copyShareLink('edit')}
                                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d8c5b1] bg-[#faf4ed] px-4 py-2 text-sm font-medium text-[#6f594b] transition hover:bg-[#f1e4d7]"
                                            >
                                                {copiedLinkKey === 'edit' ? <Check size={16} /> : <Copy size={16} />}
                                                {copiedLinkKey === 'edit' ? '已复制编辑链接' : '复制编辑链接'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#9b7e6a]">现在时间</div>
                                <div className="mt-3 text-2xl font-semibold text-[#2a1f18] md:text-3xl">
                                    {formatDateTime(now, timeZone)}
                                </div>
                                <div className="mt-2 text-sm text-[#816656]">手机打开时按这个时间判断当前步骤</div>
                            </div>
                            <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#9b7e6a]">进度</div>
                                <div className="mt-3 text-2xl font-semibold text-[#2a1f18] md:text-3xl">
                                    {progress.completed} / {progress.total}
                                </div>
                                <div className="mt-2 text-sm text-[#816656]">已完成 {progress.completed} 段，跳过 {progress.skipped} 段</div>
                            </div>
                            <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                <div className="text-xs uppercase tracking-[0.18em] text-[#9b7e6a]">链接权限</div>
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#d7c6b6] bg-[#f8f3ee] px-4 py-2 text-sm font-medium text-[#5f5045]">
                                    <ShieldCheck size={16} />
                                    {canEdit ? '可更新状态和照片' : '只读查看'}
                                </div>
                                <div className="mt-3 text-sm text-[#816656]">最近更新：{formatDateTime(snapshot.state.updatedAt, timeZone)}</div>
                            </div>
                            {hotelSummary ? (
                                <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)]">
                                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#9b7e6a]">
                                        <BedDouble size={16} />
                                        住宿安排
                                    </div>
                                    <div className="mt-3 text-lg font-semibold text-[#2a1f18]">
                                        {hotelSummary.title}
                                    </div>
                                    <div className="mt-2 text-sm leading-7 text-[#816656]">{hotelSummary.note}</div>
                                </div>
                            ) : null}
                            {returnChain ? (
                                <div className="rounded-[26px] border border-white/80 bg-white/72 p-4 shadow-[0_16px_45px_rgba(75,43,22,0.08)] sm:col-span-2 lg:col-span-1">
                                    <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#9b7e6a]">
                                        <Luggage size={16} />
                                        返程链路
                                    </div>
                                    <div className="mt-3 text-lg font-semibold text-[#2a1f18]">{returnChain}</div>
                                    <div className="mt-2 text-sm leading-7 text-[#816656]">
                                        29 号不是单段返程，是先飞青岛，再去青岛北接高铁。
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                    {groupedDays.map((day, index) => {
                        const isActive =
                            day.date === todayKey ||
                            day.items.some((item) => ['doing', 'leave', 'missed'].includes(item.status));

                        return (
                            <article
                                key={day.date}
                                className={`rounded-[28px] border p-5 shadow-[0_18px_60px_rgba(75,43,22,0.08)] ${
                                    isActive
                                        ? 'border-[#d39a68] bg-[#fff8ef]'
                                        : 'border-[#eaded1] bg-white/72'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#987965]">
                                        {formatDayLabel(day.date, timeZone)}
                                    </div>
                                    <span className="rounded-full border border-[#ead4bf] bg-white/80 px-3 py-1 text-xs text-[#7a5e4e]">
                                        Day {index + 1}
                                    </span>
                                </div>
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#2b2018]">
                                    {day.title}
                                </h2>
                                <p className="mt-3 text-sm leading-7 text-[#6f5a4c]">{day.focus}</p>
                                <div className="mt-4 rounded-[20px] bg-[#f8f1e8] px-4 py-3 text-sm leading-7 text-[#735d4d]">
                                    {summarizeDayTitles(day.items.map((item) => item.title))}
                                </div>
                            </article>
                        );
                    })}
                </section>

                {focusItem ? (
                    <section className="mt-6 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
                        <article className="rounded-[32px] border border-[#d7c2ae] bg-[#2f2118] p-6 text-white shadow-[0_24px_80px_rgba(39,24,17,0.28)] md:p-7">
                            <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#e8d5c5]">
                                现在该做什么
                            </div>
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span className={`rounded-full border px-4 py-2 text-sm font-medium ${statusStyles[focusItem.status]}`}>
                                    {focusItem.statusLabel}
                                </span>
                                <span className="text-sm text-[#d7c5b8]">{focusItem.countdownText}</span>
                            </div>
                            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
                                {focusItem.title}
                            </h2>
                            <p className="mt-3 text-base leading-8 text-[#dfd0c5]">
                                {focusItem.subtitle || focusItem.statusDetail}
                            </p>
                            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-[#dcccbf]">
                                {focusItem.isOptional
                                    ? '这段是可选安排。如果当天已经累了，直接跳过也不会影响主线。'
                                    : focusItem.highlight || '这段是当前最值得盯住的步骤，按这个时间走就不会乱。'}
                            </div>
                            <div className="mt-5 grid gap-3 text-sm text-[#d9c7b9] sm:grid-cols-2">
                                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#c8b4a5]">时间</div>
                                    <div className="mt-2 text-base font-medium text-white">{formatDayLabel(focusItem.effectiveStartAt, timeZone)}</div>
                                    <div className="mt-1">{focusItem.windowLabel}</div>
                                </div>
                                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="text-[11px] uppercase tracking-[0.18em] text-[#c8b4a5]">地点</div>
                                    <div className="mt-2 text-base font-medium text-white">{focusItem.location || '待补充'}</div>
                                    <div className="mt-1">{focusItem.transport || focusItem.address || '按实际情况出发'}</div>
                                </div>
                            </div>
                            {renderActions(focusItem)}
                        </article>

                        {activeDay ? (
                            <article className="rounded-[32px] border border-[#d9c8b6] bg-white/75 p-6 shadow-[0_22px_70px_rgba(75,43,22,0.10)] md:p-7">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#9a7c67]">接下来三件事</div>
                                    {optionalItems.length > 0 ? (
                                        <span className="rounded-full border border-[#ead7c4] bg-[#fff8ef] px-3 py-1 text-xs text-[#8a6242]">
                                            含 {optionalItems.length} 个可选安排
                                        </span>
                                    ) : null}
                                </div>
                                <div className="mt-5 space-y-3">
                                    {nextItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`rounded-[24px] border px-4 py-4 ${
                                                item.id === focusItem.id
                                                    ? 'border-[#d59a69] bg-[#fff5ea]'
                                                    : 'border-[#eaded1] bg-[#fcfaf7]'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#967763]">
                                                        <span>{index + 1}</span>
                                                        <ArrowRight size={12} />
                                                        {formatDayLabel(item.effectiveStartAt, timeZone)}
                                                    </div>
                                                    <div className="mt-2 text-lg font-semibold text-[#2e2119]">
                                                        {item.title}
                                                    </div>
                                                    <div className="mt-1 text-sm leading-7 text-[#715b4d]">
                                                        {item.windowLabel}
                                                    </div>
                                                    <div className="mt-1 text-sm leading-7 text-[#8a725f]">
                                                        {item.transport || item.location || item.statusDetail}
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                                                    {item.statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 rounded-[24px] border border-[#ebddcf] bg-[#faf6f1] px-4 py-4">
                                    <div className="text-xs uppercase tracking-[0.18em] text-[#9a7c67]">今日主线</div>
                                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#2a1f18]">
                                        {activeDay.title}
                                    </h2>
                                    <p className="mt-3 text-sm leading-7 text-[#6f5a4d] md:text-base">
                                        {activeDay.focus}
                                    </p>
                                    <div className="mt-4 rounded-[20px] bg-white px-4 py-3 text-sm leading-7 text-[#705a4c]">
                                        {summarizeDayTitles(activeDay.items.map((item) => item.title))}
                                    </div>
                                </div>
                            </article>
                        ) : null}
                    </section>
                ) : null}

                <section className="mt-6 space-y-4">
                    {groupedDays.map((day, index) => {
                        const open =
                            day.date === todayKey ||
                            day.items.some((item) => ['doing', 'leave', 'missed'].includes(item.status)) ||
                            index === 0;
                        const dayCompleted = day.items.filter((item) => item.runtimeState.manualStatus === 'done').length;

                        return (
                            <details
                                key={day.date}
                                open={open}
                                className="group overflow-hidden rounded-[32px] border border-[#d9c8b6] bg-white/72 shadow-[0_20px_70px_rgba(75,43,22,0.08)]"
                            >
                                <summary className="cursor-pointer list-none px-5 py-5 md:px-7">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-xs uppercase tracking-[0.18em] text-[#9b7d69]">{formatDayLabel(day.date, timeZone)}</div>
                                            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[#2a1f18]">{day.title}</h3>
                                            <p className="mt-2 text-sm leading-7 text-[#6e594c]">{day.focus}</p>
                                        </div>
                                        <div className="rounded-[24px] border border-[#ecdfd1] bg-[#faf6f1] px-4 py-3 text-sm text-[#6b584c]">
                                            已完成 {dayCompleted} / {day.items.length}
                                        </div>
                                    </div>
                                </summary>

                                <div className="border-t border-[#efe2d6] px-5 py-5 md:px-7 md:py-6">
                                    <div className="space-y-4">
                                        {day.items.map((item) => {
                                            const Icon = typeMeta[item.type].icon;
                                            const busy = busyItemId === item.id;
                                            const uploading = uploadingItemId === item.id;

                                            return (
                                                <article
                                                    key={item.id}
                                                    className={`rounded-[28px] border p-4 md:p-5 ${
                                                        item.id === focusItem?.id
                                                            ? 'border-[#d49a69] bg-[#fff8ef] shadow-[0_16px_48px_rgba(75,43,22,0.10)]'
                                                            : 'border-[#eadfd3] bg-[#fcfaf7]'
                                                    }`}
                                                >
                                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                        <div className="flex gap-4">
                                                            <div className="w-[86px] shrink-0 rounded-[24px] bg-[#efe0d0] px-3 py-3 text-[#7e5d48]">
                                                                <div className="text-[11px] uppercase tracking-[0.18em]">时间</div>
                                                                <div className="mt-2 text-2xl font-semibold text-[#2e2219]">
                                                                    {formatClock(item.effectiveStartAt, timeZone)}
                                                                </div>
                                                                <div className="mt-1 text-xs leading-5">{item.windowLabel}</div>
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="inline-flex items-center gap-2 rounded-full border border-[#e3d2c3] bg-white px-3 py-1 text-xs font-medium text-[#705949]">
                                                                        <Icon size={14} />
                                                                        {typeMeta[item.type].label}
                                                                    </span>
                                                                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[item.status]}`}>
                                                                        {item.statusLabel}
                                                                    </span>
                                                                    {item.highlight ? (
                                                                        <span className="rounded-full border border-[#e3c6ac] bg-[#fff4e7] px-3 py-1 text-xs font-medium text-[#975626]">
                                                                            重点提醒
                                                                        </span>
                                                                    ) : null}
                                                                    {item.isOptional ? (
                                                                        <span className="rounded-full border border-[#d8c7b6] bg-[#f6f1ea] px-3 py-1 text-xs font-medium text-[#756557]">
                                                                            可选安排
                                                                        </span>
                                                                    ) : null}
                                                                </div>

                                                                <h4 className="mt-3 text-2xl font-semibold tracking-tight text-[#2d2119]">
                                                                    {item.title}
                                                                </h4>
                                                                {item.subtitle ? (
                                                                    <p className="mt-2 text-sm leading-7 text-[#725c4f] md:text-base">
                                                                        {item.subtitle}
                                                                    </p>
                                                                ) : null}

                                                                <div className="mt-4 grid gap-2 text-sm text-[#705c50] md:grid-cols-2">
                                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a28570]">地点</div>
                                                                        <div className="mt-2 font-medium text-[#35281f]">{item.location || '待补充'}</div>
                                                                        {item.address ? <div className="mt-1 text-xs leading-6">{item.address}</div> : null}
                                                                    </div>
                                                                    <div className="rounded-[20px] bg-white px-4 py-3">
                                                                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a28570]">提醒</div>
                                                                        <div className="mt-2 font-medium text-[#35281f]">{item.countdownText}</div>
                                                                        <div className="mt-1 text-xs leading-6">{item.statusDetail}</div>
                                                                    </div>
                                                                </div>

                                                                {item.transport ? (
                                                                    <div className="mt-3 text-sm text-[#6e594c]">
                                                                        交通：{item.transport}
                                                                    </div>
                                                                ) : null}
                                                                {item.bookingNote ? (
                                                                    <div className="mt-3 rounded-[20px] border border-[#ead8c5] bg-[#fff8ef] px-4 py-3 text-sm leading-7 text-[#7a5d45]">
                                                                        订单备注：{item.bookingNote}
                                                                    </div>
                                                                ) : null}
                                                                {item.tips?.length ? (
                                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                                        {item.tips.map((tip) => (
                                                                            <span
                                                                                key={tip}
                                                                                className="rounded-full border border-[#ebdfd3] bg-white px-3 py-1 text-xs text-[#6f5849]"
                                                                            >
                                                                                {tip}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {renderActions(item)}

                                                    <div className="mt-4 rounded-[24px] border border-[#ebdfd3] bg-white px-4 py-4">
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
                                                                rows={3}
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
                                                                <div className="text-sm text-[#8d7565]">建议现场拍一张就够，页面会自动刷新。</div>
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
                                                                        <img
                                                                            src={photo.url}
                                                                            alt={photo.name || item.title}
                                                                            className="h-28 w-full object-cover"
                                                                        />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            </details>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
