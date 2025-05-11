import type { DirectoryItem } from '@/lib/models/directory';

export interface TreeNode extends DirectoryItem {
    children: TreeNode[];
}