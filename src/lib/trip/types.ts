export type TripItemType = 'train' | 'flight' | 'hotel' | 'spot' | 'meal' | 'transport' | 'rest';

export type TripManualStatus = 'pending' | 'doing' | 'done' | 'skipped';

export type TripDerivedStatus = 'pending' | 'leave' | 'doing' | 'missed' | 'done' | 'skipped';

export interface TripDay {
    date: string;
    title: string;
    focus: string;
}

export interface TripItem {
    id: string;
    startAt: string;
    endAt?: string;
    durationMin?: number;
    title: string;
    subtitle?: string;
    type: TripItemType;
    location?: string;
    address?: string;
    transport?: string;
    leaveAheadMin?: number;
    tips?: string[];
    bookingNote?: string;
    highlight?: string;
    isOptional?: boolean;
}

export interface TripPhoto {
    id: string;
    url: string;
    uploadedAt: string;
    name?: string;
}

export interface TripItemRuntimeState {
    itemId: string;
    manualStatus?: TripManualStatus;
    actualStartAt?: string;
    actualEndAt?: string;
    delayMin?: number;
    note?: string;
    photos: TripPhoto[];
    updatedAt?: string;
}

export interface TripRuntimeState {
    slug: string;
    updatedAt: string;
    items: Record<string, TripItemRuntimeState>;
}

export interface TripDefinitionPublic {
    slug: string;
    title: string;
    city: string;
    companion: string;
    timezone: string;
    intro: string;
    coverNote: string;
    checklist: string[];
    days: TripDay[];
    items: TripItem[];
}

export interface TripDefinition extends TripDefinitionPublic {
    tokens: {
        view: string;
        edit: string;
        usingDefault: boolean;
    };
}

export type TripAccessLevel = 'view' | 'edit';

export interface TripShareTokens {
    view: string;
    edit: string;
}

export interface TripSnapshot {
    trip: TripDefinitionPublic;
    state: TripRuntimeState;
    accessLevel: TripAccessLevel;
    usingDefaultToken: boolean;
    generatedAt: string;
    shareTokens?: TripShareTokens;
}

export interface DecoratedTripItem extends TripItem {
    dayKey: string;
    delayMin: number;
    effectiveStartAt: string;
    effectiveEndAt?: string;
    status: TripDerivedStatus;
    statusLabel: string;
    statusDetail: string;
    countdownText: string;
    windowLabel: string;
    runtimeState: TripItemRuntimeState;
}
