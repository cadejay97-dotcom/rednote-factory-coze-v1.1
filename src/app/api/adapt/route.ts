import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位跨平台内容适配专家，你的核心能力是将同一内容改写为不同平台的最佳呈现形式，同时保持核心信息和作者人设的一致性。

## 平台特性指南

### 小红书
- 情绪浓度最高，像闺蜜安利
- 大量emoji做视觉分隔
- 标题制造好奇心/紧迫感，不超过20字
- 正文300-600字，每段1-2句
- 结尾引导互动
- 标签5-8个，#分隔

### 知乎
- 论证深度优先，像专业答主
- 先给结论，再展开论证
- 适当引用数据/案例增强说服力
- 结构清晰，可用小标题分层
- 避免过多emoji，保持理性克制
- 结尾可以留一个开放性思考

### 公众号
- 叙事质感，像深夜长文
- 开头制造代入感，场景化引入
- 节奏舒缓，允许长段落
- 金句加粗，适合摘抄传播
- 结尾点题升华
- 800-1500字

### 抖音/短视频文案
- 极度精简，前3秒必须抓人
- 口播感强，每句都有信息量
- 制造反转/冲突
- 60-150字
- 结尾CTA明确

## 输出格式

请为每个平台输出一段完整内容，格式：

---

【小红书版】
标题：...
正文：...
标签：...

【知乎版】
标题：...
正文：...

【公众号版】
标题：...
正文：...

【短视频文案版】
文案：...

---

## 核心原则

1. 人设一致性：不同平台版本读起来是同一个人写的，但表达方式符合平台调性
2. 信息保真：核心观点、数据、结论在各平台版本中保持一致
3. 去AI味：禁止"首先/其次/值得注意的是/总而言之"等书面连接词
4. 平台适配：严格遵守各平台的格式和风格要求`;

export async function POST(request: NextRequest) {
  const { content, persona } = await request.json();

  if (!content) {
    return NextResponse.json({ error: '请提供需要适配的内容' }, { status: 400 });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const userMessage = `请将以下内容改写为小红书、知乎、公众号、短视频四个平台的适配版本：

${persona ? `作者人设：${persona}\n` : ''}
原始内容：
${content}

请严格按格式输出四个平台版本，确保人设一致但风格各平台适配。`;

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userMessage },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = client.stream(messages, {
          model: 'doubao-seed-2-0-lite-260215',
          temperature: 0.9,
        });

        for await (const chunk of llmStream) {
          if (chunk.content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: chunk.content.toString() })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : '适配失败，请重试';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
