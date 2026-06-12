import { NextRequest } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `你是一位小红书爆款内容创作专家，精通小红书的内容算法和用户偏好。你的任务是根据用户提供的选题和需求，生成高质量的小红书笔记内容。

## 输出规范

根据用户选择的模板类型，输出对应格式的内容：

### 图文笔记模板
输出格式：
【标题】（不超过20字，带emoji，制造好奇心或紧迫感）
【正文】（300-600字，段落短小，每段1-2句话，大量使用emoji，口语化表达，避免AI腔调）
【标签】（5-8个话题标签，用#分隔，包含热门标签+精准标签）
【互动钩子】（1句引导评论的话术）

### 种草推荐模板
输出格式：
【标题】（突出产品/体验亮点，制造向往感）
【正文】（痛点引入→解决方案→使用体验→效果对比→购买建议，每部分2-3句）
【标签】
【互动钩子】

### 干货教程模板
输出格式：
【标题】（数字+承诺，如"3步搞定xxx"）
【正文】（场景痛点→步骤拆解→注意事项→总结，步骤用①②③标记）
【标签】
【互动钩子】

### 个人IP模板
输出格式：
【标题】（个人观点/经历+反常识/冲突感）
【正文】（故事引入→观点表达→经验分享→价值输出，保持"人设一致性"）
【标签】
【互动钩子】

## 创作原则

1. 标题：制造好奇心/紧迫感/反差感，善用数字和emoji
2. 正文：短句为主，每段不超过3行；善用emoji做视觉分隔；口语化，像和朋友聊天
3. 去AI味：禁止使用"首先/其次/最后"、"值得注意的是"、"总而言之"等书面连接词
4. 互动：结尾必须有引导互动的话术
5. 标签：混合使用大流量标签和精准长尾标签
6. 人设一致性：如果提供了人设信息，所有内容必须从"这个人"的视角出发，确保3个月后写的和今天写的是同一个人在说话`;

export async function POST(request: NextRequest) {
  const { topic, template, style, keywords, persona } = await request.json();

  if (!topic) {
    return new Response(JSON.stringify({ error: '请提供选题内容' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const templateDesc: Record<string, string> = {
    '图文笔记': '图文笔记模板',
    '种草推荐': '种草推荐模板',
    '干货教程': '干货教程模板',
    '个人IP': '个人IP模板',
  };

  const styleDesc: Record<string, string> = {
    '活泼俏皮': '活泼俏皮，多用emoji和感叹号，像闺蜜安利',
    '温柔治愈': '温柔治愈，语调柔软，像深夜电台',
    '专业干练': '专业干练，条理清晰，像行业大咖分享',
    '幽默吐槽': '幽默吐槽，自嘲+反讽，像脱口秀',
  };

  const personaBlock = persona
    ? `\n## 作者人设（核心约束，所有内容必须符合此人设）\n${persona}\n请确保生成的内容完全符合这个人的说话方式、价值观和专业领域，让读者感觉是同一个真人在说话。`
    : '';

  const userMessage = `请根据以下信息生成小红书笔记内容：

选题：${topic}
模板类型：${templateDesc[template] || '图文笔记模板'}
风格调性：${styleDesc[style] || '活泼俏皮'}
${keywords ? `关键词/要点：${keywords}` : ''}${personaBlock}

请严格按照对应模板格式输出，确保内容有爆款潜力。`;

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
            const text = chunk.content.toString();
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
            );
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '生成失败，请重试';
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: errorMessage })}\n\n`
          )
        );
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
