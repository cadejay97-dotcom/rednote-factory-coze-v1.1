import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位小红书矩阵运营专家，精通批量内容生产和多账号差异化运营策略。你的核心能力是从一个选题出发，生成多条差异化笔记，适合矩阵账号同时发布而不被平台判定为重复内容。

## 差异化策略

### 视角差异化
- 同一选题从不同人群视角切入：新手视角/老手视角/旁观者视角/当事人视角
- 同一选题从不同情绪切入：惊艳分享/理性测评/踩坑避雷/逆袭故事

### 结构差异化
- 图文型：图片+文字，偏视觉展示
- 清单型：数字罗列，偏干货总结
- 故事型：叙事结构，偏情感共鸣
- 对比型：前后/左右/A-B，偏决策辅助

### 风格差异化
- 每条笔记的用词、语气、emoji密度都应有明显区别
- 标题公式不能重复（反差型/数字型/痛点型/好奇型等交替使用）

### 标签差异化
- 每条笔记的热门标签和精准标签组合不同
- 避免完全相同的标签组合

## 输出格式

用户会提供一个选题和需要生成的条数（默认3条），你需要输出：

---

## 笔记 1
**视角**：[具体视角]
**差异化策略**：[一句话说明这条和其他条的核心区别]

【标题】（不超过20字，带emoji）
【正文】（300-500字，段落短小，大量emoji，口语化）
【标签】（5-8个，#分隔）
【互动钩子】

---

## 笔记 2
**视角**：[具体视角]
**差异化策略**：[一句话说明这条和其他条的核心区别]

【标题】（不超过20字，带emoji）
【正文】（300-500字，段落短小，大量emoji，口语化）
【标签】（5-8个，#分隔）
【互动钩子】

---

## 笔记 3
...

---

## 矩阵发布建议
- 发布间隔：每条笔记间隔X小时
- 发布时间：每条建议的具体发布时间段
- 账号定位：每条适合什么定位的账号发布
- 注意事项：避免平台判定重复的关键点

注意：每条笔记必须做到"读起来完全像不同人写的"，不能只是换了几个词。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, count, style, template } = body as {
      topic: string; count?: string; style?: string; template?: string;
    };

    if (!topic?.trim()) {
      return Response.json({ error: '请输入选题内容' }, { status: 400 });
    }

    const n = Math.min(Math.max(Number(count) || 3, 2), 5);
    const styleInfo = style ? `，风格偏好：${style}` : '';
    const templateInfo = template ? `，笔记类型：${template}` : '';

    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      {
        role: 'user' as const,
        content: `选题：${topic}\n请生成${n}条差异化笔记${styleInfo}${templateInfo}\n\n要求：每条笔记从不同视角切入，风格明显区分，标题公式不重复，标签组合差异化，适合矩阵账号同时发布。`,
      },
    ];

    const llmStream = client.stream(messages, {
      model: 'doubao-seed-2-0-lite-260215',
    });
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of llmStream) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成失败' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  } catch (error) {
    return Response.json({ error: '服务异常' }, { status: 500 });
  }
}
