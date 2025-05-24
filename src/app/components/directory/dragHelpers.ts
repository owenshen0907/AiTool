// File: src/components/directory/dragHelpers.ts
//-----------------------------------------------------------
// 将“拖动结果”应用到内存数组 (dirs / items) 上
//-----------------------------------------------------------

import type { ContentItem }    from '@/lib/models/content';
import type { DirectoryItem }  from '@/lib/models/directory';

/*───────────────────────────────────────────────────────────*/
/* 目录拖拽：排序 & 改父级                                   */
/*───────────────────────────────────────────────────────────*/
export const getDirId = (item: { directoryId?: string; directory_id?: string }) =>
    item.directoryId ?? (item as any).directory_id;