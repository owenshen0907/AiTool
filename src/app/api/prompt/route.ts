// File: src/app/api/prompt/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withUser } from '@/lib/api/auth'
import {
    createPromptSchema,
    updatePromptSchema,
} from '@/lib/utils/validators'
import * as service from '@/lib/services/promptService'

/**
 * GET /api/prompt
 * 支持：
 *  - ?search=xxx    —— 全文搜索
 *  - ?term=xxx      —— 同上（兼容旧参数）
 *  - ?id=xxx        —— 获取单条
 *  - ?parent_id=yyy —— 列表查询
 */
export const GET = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url)

    // 0. 全文搜索
    const q = searchParams.get('search')
    if (q) {
        const list = await service.searchPrompts(q)
        return NextResponse.json(list)
    }
    // 兼容 term 参数
    const term = searchParams.get('term')
    if (term !== null) {
        const all = await service.searchPrompts(term)
        return NextResponse.json(all)
    }

    // 1. 按 id 查询
    const id = searchParams.get('id')
    if (id) {
        const item = await service.getPromptById(id)
        if (!item) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }
        return NextResponse.json(item)
    }

    // 2. 按 parent_id 列表
    const parent_id = searchParams.get('parent_id') || undefined
    const list = await service.listPrompts(parent_id)
    return NextResponse.json(list)
})

/**
 * POST /api/prompt
 * 新建一个目录或 Prompt
 */
export const POST = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json()
    const parse = createPromptSchema.safeParse(body)
    if (!parse.success) {
        return NextResponse.json(
            { error: parse.error.format() },
            { status: 400 }
        )
    }
    const created = await service.createPrompt(userId, parse.data)
    return NextResponse.json(created, { status: 201 })
})

/**
 * PUT /api/prompt
 * 更新一个已有的 Prompt（只更新内容、标题等，不改 created_by）
 */
export const PUT = withUser(async (req: NextRequest, userId: string) => {
    const body = await req.json()
    const parse = updatePromptSchema.safeParse(body)
    if (!parse.success) {
        return NextResponse.json(
            { error: parse.error.format() },
            { status: 400 }
        )
    }
    const updated = await service.updatePromptService(
        userId,
        parse.data.id!,
        parse.data
    )
    if (!updated) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
})

/**
 * DELETE /api/prompt?id=xxx
 * 删除一个 Prompt 或 目录
 */
export const DELETE = withUser(async (req: NextRequest, userId: string) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const deleted = await service.deletePromptService(userId, id)
    if (!deleted) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
})

/**
 * PATCH /api/prompt
 * 用于对子节点重新排序，body 格式：
 *   { parent_id: string|null, ordered_ids: string[] }
 */
export const PATCH = withUser(async (req: NextRequest, userId: string) => {
    const { parent_id, ordered_ids }: { parent_id: string | null; ordered_ids: string[] } = await req.json()
    await service.reorderPrompts(userId, parent_id, ordered_ids)
    return NextResponse.json({ success: true })
})