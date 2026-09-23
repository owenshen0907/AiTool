export type QuickView = 'all' | 'product' | 'life' | 'ai' | 'tools';

export interface PostFrontmatter {
    title: string;
    date: string | Date;
    publishedAt?: string | Date;
    tags?: string[];
    series?: string | null;
    cover?: string | null;
    excerpt?: string | null;
    draft?: boolean;
    visibility?: 'public' | 'private';
    projects?: string[];
}

export interface PostMeta {
    slug: string;
    title: string;
    date: string;
    publishedAt: string;
    tags: string[];
    series: string | null;
    cover: string | null;
    excerpt: string | null;
    projects: string[];
}

export interface Post extends PostMeta {
    content: string;
}

export interface SeriesFrontmatter {
    title?: string;
    order?: number;
    excerpt?: string | null;
    draft?: boolean;
    visibility?: 'public' | 'private';
}

export interface SeriesInfo {
    slug: string;
    series: string;
    excerpt: string | null;
    content: string | null;
    order: number | null;
    count: number;
    latestPublishedAt: string;
    defined: boolean;
}

export interface QuickViewSpec {
    id: QuickView;
    label: string;
    matches: string[];
}

export const QUICK_VIEWS: QuickViewSpec[] = [
    { id: 'all', label: '全部', matches: [] },
    { id: 'product', label: '产品', matches: ['产品', 'product'] },
    { id: 'life', label: '生活', matches: ['生活', 'life', 'daily'] },
    { id: 'ai', label: 'AI', matches: ['ai', 'AI'] },
    { id: 'tools', label: '工具', matches: ['工具', 'tools', 'software'] },
];

export function postMatchesView(post: PostMeta, view: QuickView): boolean {
    if (view === 'all') return true;
    const spec = QUICK_VIEWS.find((v) => v.id === view);
    if (!spec || spec.matches.length === 0) return true;
    const lowered = post.tags.map((t) => t.toLowerCase());
    return spec.matches.some((m) => lowered.includes(m.toLowerCase()));
}
