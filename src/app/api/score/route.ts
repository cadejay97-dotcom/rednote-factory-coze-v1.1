import { NextRequest } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位小红书内容质量评审专家，你的任务是对用户提交的小红书笔记内容进行全面评分，并给出具体的优化建议。

## 评分维度（每项满分20分，总分100分）

### 1. 标题吸引力（20分）
- 是否在20字以内？
- 是否有emoji增强视觉？
- 是否制造了好奇心或紧迫感？
- 是否包含具体数字或承诺？
- 是否有明确的受众指向？

### 2. 开头钩子（20分）
- 前3秒/前3行是否足够抓人？
- 是否直击痛点或制造悬念？
- 读者会不会想继续看下去？

### 3. 内容结构（20分）
- 段落是否短小（1-2句话/段）？
- 是否有清晰的信息层次？
- emoji使用是否合理（不过密不过疏）？
- 是否口语化、避免AI腔调？

### 4. 互动设计（20分）
- 是否有引导评论的话术？
- 是否有引发争议/讨论的观点？
- 是否有鼓励收藏/转发的理由？
- 标签是否覆盖热门+精准两类？

### 5. 爆款潜力（20分）
- 情绪浓度是否足够（共鸣/惊讶/好奇/焦虑）？
- 选题是否踩中流量风口？
- 内容是否有"社交货币"属性（让人想分享）？
- 是否有二次传播的钩子？

## 输出格式

### 总分：XX/100
### 等级：S级(90+)/A级(80-89)/B级(70-79)/C级(60-69)/D级(<60)

### 各维度评分
| 维度 | 得分 | 评价 |
|------|------|------|
| 标题吸引力 | X/20 | 一句话评价 |
| 开头钩子 | X/20 | 一句话评价 |
| 内容结构 | X/20 | 一句话评价 |
| 互动设计 | X/20 | 一句话评价 |
| 爆款潜力 | X/20 | 一句话评价 |

### 优化建议（按优先级排列）
1. **最重要**：最需要改的一个点 + 具体改法
2. 次要优化点 + 具体改法
3. 加分项 + 具体改法

### 修改后标题建议（给出3个优化版标题）

### 推荐发布时间
根据内容类型推荐最佳发布时间段

注意：评分要严格、建议要具体。不用客套，直说问题。`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content } = body as { content: string };

    if (!content?.trim()) {
      return Response.json({ error: '请输入笔记内容' }, { status: 400 });
    }

    const config = new Config();
    const client = new LLMClient(config);

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: `请对以下小红书笔记内容进行质量评分：\n\n${content}` },
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '评分失败' })}\n\n`));
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
