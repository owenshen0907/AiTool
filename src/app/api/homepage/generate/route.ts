import { NextRequest, NextResponse } from 'next/server';
import { withUser } from '@/lib/api/auth';
import { generateHomepagePlanWithAI } from '@/lib/personalHomeGenerator';
import { getPersonalHomeTemplate, type HomepageFormAnswers, type PersonalHomeTemplateId } from '@/lib/personalHome';

interface GenerateHomepageRequest {
    templateId?: PersonalHomeTemplateId;
    answers?: HomepageFormAnswers;
}

function badRequest(message: string, status: number = 400) {
    return NextResponse.json({ ok: false, message }, { status });
}

export const POST = withUser(async (req: NextRequest) => {
    let body: GenerateHomepageRequest;

    try {
        body = (await req.json()) as GenerateHomepageRequest;
    } catch {
        return badRequest('请求体不是合法 JSON');
    }

    const templateId = body?.templateId;
    const answers = body?.answers;

    if (!templateId) {
        return badRequest('缺少模板类型');
    }

    const template = getPersonalHomeTemplate(templateId);
    if (!template) {
        return badRequest('不支持的首页模板');
    }

    if (!answers || typeof answers !== 'object') {
        return badRequest('缺少表单信息');
    }

    const hasEnoughInput = template.fields.some((field) => String(answers[field.id] || '').trim());
    if (!hasEnoughInput) {
        return badRequest('请至少填写一项关键信息后再生成');
    }

    const plan = await generateHomepagePlanWithAI(template, answers);

    return NextResponse.json({
        ok: true,
        template: {
            id: template.id,
            name: template.name,
        },
        plan,
    });
});
