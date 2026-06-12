import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位AI视频脚本创作专家，专长是为 MoneyPrinterTurbo 和 NarratoAI 这类AI视频生成工具编写可直接使用的脚本。

## 输出格式

请严格按照以下格式输出，每个字段都要填写：

### 视频元信息
- 标题：（5-15字，有吸引力的标题）
- 时长：（30秒/60秒/90秒/3分钟，根据内容复杂度选择）
- 风格：（知识科普/生活分享/情感共鸣/种草推荐/干货教程）
- BGM建议：（背景音乐风格建议）

### 旁白文案（逐句分段，每段对应一个画面）

[画面1] 画面描述：...
旁白：...

[画面2] 画面描述：...
旁白：...

...（按此格式继续）

### 字幕样式建议
- 字体：（如：思源黑体/站酷快乐体）
- 位置：（底部居中/顶部/侧边）
- 动效：（逐字出现/弹入/打字机）

### 视觉风格建议
- 主色调
- 画面风格（实拍混剪/动画/图文字幕/真人出镜）
- 转场方式

### 封面文案
- 主标题：（大字）
- 副标题：（小字补充）

## 创作原则

1. 前3秒必须有钩子（数字/提问/反常/痛点）
2. 每个画面段不超过8秒
3. 旁白口语化，避免书面语
4. 画面描述要具体到可以搜索素材的程度
5. 情绪有起伏，不能平铺直叙
6. 结尾有明确的CTA（关注/点赞/评论引导）`;

export async function POST(request: NextRequest) {
  const { topic, duration, style } = await request.json();

  if (!topic) {
    return NextResponse.json({ error: '请提供视频选题' }, { status: 400 });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const userMessage = `请为以下选题生成AI视频脚本：

选题：${topic}
${duration ? `目标时长：${duration}` : ''}
${style ? `内容风格：${style}` : ''}

请严格按照输出格式生成完整脚本，脚本可以直接用于 MoneyPrinterTurbo 或 NarratoAI 等工具。`;

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
          temperature: 1.0,
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
        const msg = error instanceof Error ? error.message : '脚本生成失败，请重试';
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
