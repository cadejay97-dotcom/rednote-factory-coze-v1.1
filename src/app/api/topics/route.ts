import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位小红书爆款选题分析师，精通小红书的内容算法、用户画像和流量规律。你的核心能力是帮创作者发现高潜力选题。

## 你的分析框架

### 热门赛道识别
- 美妆护肤、穿搭、美食、家居、母婴、职场、副业、知识付费、AI工具、旅行、健身、宠物
- 每个赛道都有特定的流量窗口期和内容形式偏好

### 爆款选题公式
1. **反差冲突型**：打破常识、颠覆认知（例："月薪3千也能穿出高级感"）
2. **数字清单型**：具体数字+承诺（例："3个工具让你效率翻10倍"）
3. **痛点共鸣型**：戳中群体焦虑（例："30岁转行，我做对了什么"）
4. **好奇心缺口型**：制造信息差（例："大厂员工不会告诉你的5件事"）
5. **社交货币型**：让人想转发炫耀（例："用AI做的PPT被老板夸了"）
6. **时效热点型**：蹭当下热点+领域结合（例：节日/明星/社会事件+垂直领域）

### 竞品内容空白
- 分析已有爆款笔记的评论区，找出用户追问但未被满足的需求
- 找到"高赞低内容"的选题（搜索量大但优质内容少）

## 输出格式

根据用户的领域/关键词，输出以下结构化内容：

### 热门选题推荐（5-8个）
每个选题包含：
- **选题标题**：可以直接用作笔记标题
- **爆款概率**：高/中/高（评估依据：搜索热度×竞争空白×情绪共鸣）
- **选题类型**：反差冲突/数字清单/痛点共鸣/好奇心缺口/社交货币/时效热点
- **预估互动量**：根据同类内容推测
- **创作建议**：1-2句提示如何切入
- **推荐标签**：3-5个话题标签

### 赛道趋势
- 当前领域最热的话题方向
- 未来1-2周可能爆发的话题

### 内容空白点
- 竞品未覆盖但用户有需求的选题角度

注意：选题要具体、可落地，避免宏大叙事。好选题的标准是"一看就想点，一点就想看完"。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, keywords } = body as { niche: string; keywords?: string };

    if (!niche?.trim()) {
      return Response.json({ error: '请输入你的创作领域' }, { status: 400 });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const userPrompt = keywords
      ? `我的创作领域是：${niche}\n关键词方向：${keywords}\n\n请帮我分析这个领域的爆款选题机会。`
      : `我的创作领域是：${niche}\n\n请帮我分析这个领域的爆款选题机会。`;

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
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
