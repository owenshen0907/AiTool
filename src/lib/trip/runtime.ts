import type {
    DecoratedTripItem,
    TripDay,
    TripDerivedStatus,
    TripDefinitionPublic,
    TripItem,
    TripItemRuntimeState,
    TripRuntimeState,
} from '@/lib/trip/types';

const DEFAULT_DURATION_MIN = 90;

export function createEmptyTripState(slug: string): TripRuntimeState {
    return {
        slug,
        updatedAt: new Date().toISOString(),
        items: {},
    };
}

export function createEmptyItemState(itemId: string): TripItemRuntimeState {
    return {
        itemId,
        photos: [],
    };
}

export function normalizeItemState(
    itemId: string,
    state?: Partial<TripItemRuntimeState> | null
): TripItemRuntimeState {
    return {
        ...createEmptyItemState(itemId),
        ...(state || {}),
        itemId,
        photos: Array.isArray(state?.photos) ? state.photos : [],
    };
}

export function getDayKey(input: Date | string, timeZone: string) {
    const date = typeof input === 'string' ? new Date(input) : input;
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value || '0000';
    const month = parts.find((part) => part.type === 'month')?.value || '01';
    const day = parts.find((part) => part.type === 'day')?.value || '01';

    return `${year}-${month}-${day}`;
}

export function formatDayLabel(dateLike: Date | string, timeZone: string) {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone,
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    }).format(date);
}

export function formatClock(dateLike: Date | string, timeZone: string) {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

export function formatDateTime(dateLike: Date | string, timeZone: string) {
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    return new Intl.DateTimeFormat('zh-CN', {
        timeZone,
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);
}

function toIso(date: Date) {
    return date.toISOString();
}

function addMinutes(dateLike: Date | string, minutes: number) {
    const next = new Date(typeof dateLike === 'string' ? dateLike : dateLike.getTime());
    next.setMinutes(next.getMinutes() + minutes);
    return next;
}

function formatDurationFromMs(deltaMs: number) {
    const absMin = Math.max(0, Math.round(Math.abs(deltaMs) / 60000));
    const hours = Math.floor(absMin / 60);
    const minutes = absMin % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}小时${minutes}分`;
    }
    if (hours > 0) {
        return `${hours}小时`;
    }
    return `${minutes}分`;
}

function resolveEndAt(item: TripItem, start: Date, delayMin: number) {
    if (item.endAt) {
        return addMinutes(item.endAt, delayMin);
    }
    return addMinutes(start, item.durationMin ?? DEFAULT_DURATION_MIN);
}

export function decorateTripItem(
    item: TripItem,
    rawState: TripItemRuntimeState | undefined,
    now: Date,
    timeZone: string
): DecoratedTripItem {
    const runtimeState = normalizeItemState(item.id, rawState);
    const delayMin = runtimeState.delayMin ?? 0;
    const effectiveStart = addMinutes(item.startAt, delayMin);
    const effectiveEnd = resolveEndAt(item, effectiveStart, delayMin);
    const leaveAt = addMinutes(effectiveStart, -(item.leaveAheadMin ?? 30));
    const nowMs = now.getTime();
    const startMs = effectiveStart.getTime();
    const endMs = effectiveEnd.getTime();

    let status: TripDerivedStatus = runtimeState.manualStatus || 'pending';
    let statusLabel = '待开始';
    let statusDetail = '还没轮到这一步';
    let countdownText = `距离提醒还有 ${formatDurationFromMs(leaveAt.getTime() - nowMs)}`;

    if (runtimeState.manualStatus === 'done') {
        status = 'done';
        statusLabel = '已完成';
        statusDetail = runtimeState.actualEndAt
            ? `完成于 ${formatDateTime(runtimeState.actualEndAt, timeZone)}`
            : '这一段已经打卡';
        countdownText = '已完成';
    } else if (runtimeState.manualStatus === 'skipped') {
        status = 'skipped';
        statusLabel = '已跳过';
        statusDetail = '这一段被手动跳过';
        countdownText = '已跳过';
    } else if (runtimeState.manualStatus === 'doing') {
        status = 'doing';
        statusLabel = '进行中';
        statusDetail = runtimeState.actualStartAt
            ? `开始于 ${formatDateTime(runtimeState.actualStartAt, timeZone)}`
            : '这一步正在进行';
        countdownText = `预计还剩 ${formatDurationFromMs(endMs - nowMs)}`;
    } else if (nowMs < leaveAt.getTime()) {
        status = 'pending';
        statusLabel = '待开始';
        statusDetail = '还没到提醒时间';
        countdownText = `距离提醒还有 ${formatDurationFromMs(leaveAt.getTime() - nowMs)}`;
    } else if (nowMs < startMs) {
        status = 'leave';
        statusLabel = '该出发了';
        statusDetail = '建议现在收拾一下准备动身';
        countdownText = `距离开始还有 ${formatDurationFromMs(startMs - nowMs)}`;
    } else if (nowMs <= endMs) {
        status = 'doing';
        statusLabel = '进行中';
        statusDetail = '当前时间已经进入这一段';
        countdownText = `预计还剩 ${formatDurationFromMs(endMs - nowMs)}`;
    } else {
        status = 'missed';
        statusLabel = '已超时';
        statusDetail = '计划时间已经过去，还没有标记完成';
        countdownText = `已经超出 ${formatDurationFromMs(nowMs - endMs)}`;
    }

    const startClock = formatClock(effectiveStart, timeZone);
    const endClock = formatClock(effectiveEnd, timeZone);
    const windowLabel = delayMin > 0
        ? `${startClock} - ${endClock} · 已顺延 ${delayMin} 分钟`
        : `${startClock} - ${endClock}`;

    return {
        ...item,
        dayKey: getDayKey(effectiveStart, timeZone),
        delayMin,
        effectiveStartAt: toIso(effectiveStart),
        effectiveEndAt: toIso(effectiveEnd),
        status,
        statusLabel,
        statusDetail,
        countdownText,
        windowLabel,
        runtimeState,
    };
}

export function groupItemsByDay(days: TripDay[], items: DecoratedTripItem[]) {
    return days.map((day) => ({
        ...day,
        items: items
            .filter((item) => item.dayKey === day.date)
            .sort((left, right) => new Date(left.effectiveStartAt).getTime() - new Date(right.effectiveStartAt).getTime()),
    }));
}

export function countTripProgress(trip: TripDefinitionPublic, state: TripRuntimeState) {
    let completed = 0;
    let skipped = 0;

    for (const item of trip.items) {
        const itemState = state.items[item.id];
        if (itemState?.manualStatus === 'done') completed += 1;
        if (itemState?.manualStatus === 'skipped') skipped += 1;
    }

    return {
        completed,
        skipped,
        total: trip.items.length,
    };
}

const focusPriority = {
    doing: 0,
    leave: 1,
    missed: 2,
    pending: 3,
    done: 4,
    skipped: 5,
} as const;

export function pickFocusItem(items: DecoratedTripItem[]) {
    return [...items].sort((left, right) => {
        const statusDelta = focusPriority[left.status] - focusPriority[right.status];
        if (statusDelta !== 0) return statusDelta;
        return new Date(left.effectiveStartAt).getTime() - new Date(right.effectiveStartAt).getTime();
    })[0];
}
