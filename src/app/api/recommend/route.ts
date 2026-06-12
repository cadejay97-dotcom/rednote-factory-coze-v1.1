import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';

const TOOLS_CONTEXT = `以下是GitHub开源自媒体创作工具清单，每条包含工具名、核心功能、技术栈、适用场景和亮点：

1. XHS_ALL_IN_ONE - 采集→内容库→AI改写→图片润色→一键发布→定时自动运营全链路(Python+Vue/React, ★★★★★) - 矩阵二创核心、多账号运营、批量内容生产 - 草稿工坊三栏布局+AI图片润色并排对比+2小时自动健康巡检
2. xiaohongshu-mcp - MCP协议小红书自动化，支持登录验证、图文/视频发布、搜索、评论互动(Go+go-rod, 9.7K+ Star, ★★★★☆) - 可被n8n/AI Agent调度，构建全自动内容生产线
3. Spider_XHS - 小红书数据运营+爬虫+创作者平台操作，AI一键改写笔记直接上传(Python, ★★★★☆) - 从采集到发布的闭环
4. rednote-skills - Python+Playwright自动化交互：搜索、内容提取、点赞/收藏/评论、图文发布(★★★☆☆) - 通过window.__INITIAL_STATE__直接获取笔记JSON
5. social-auto-upload - 跨平台视频自动发布，支持抖音/B站/小红书/快手/视频号/TikTok(Python+Playwright+Vue, 10K+ Star, ★★★★★) - Web管理界面，单机日处理100+视频
6. 矩媒MatrixMedia - 本地自媒体矩阵发布，GUI+CLI双模式，可被AI智能体调度(Electron+Puppeteer, ★★★★☆) - 退出码语义化适合自动化编排
7. Wechatsync - Chrome扩展，一键同步微信公众号文章到29+平台(Chrome Extension, ★★★★☆) - 零门槛、安全合规、29+平台覆盖最广
8. kebenxiaoming/matrix - Playwright自动化发布视频到多平台(Python+Playwright, ★★★☆☆)
9. MoneyPrinterTurbo - 一键AI短视频生成：文案→语音→字幕→画面→渲染(Python+Streamlit, 30K+ Star, ★★★★★) - GPT-4写文案+Edge-TTS配音+FFmpeg渲染
10. NarratoAI - AI驱动故事化短视频生成：剧本→分镜→画面→旁白→成片(Python+MoviePy, ★★★★☆)
11. PyWxDump - 微信数据库解密与数据分析(Python, 18K+ Star, ★★★★☆) - 微信生态数据解密
12. XHS-Tracker - 小红书数据采集SDK，笔记搜索/用户信息/评论采集/话题分析(Python, ★★★★☆) - 完善Python SDK可作数据管道
13. wx_channel - 视频号视频下载：批量/加密解密/多分辨率/Web控制台(Go+SunnyNet, ★★★★☆) - 代理拦截+脚本注入
14. wx_channels_download - 视频号API接口：搜索账号、视频列表、批量下载、RSS订阅(Python, ★★★☆☆)
15. ip-publisher - 个人IP内容自动化工作流：热点发现→人设对齐→内容策略→平台改写→去AI味→封面生成→多平台发布(Python+Claude Code, ★★★★★) - 以"人设一致性"为核心，同一选题自动生成不同平台差异化版本
16. clipsketch-ai - 视频转手绘分镜+AI文案(Python+AI绘画, ★★★☆☆) - 视频→手绘分镜独特创意路径`;

const SYSTEM_PROMPT = `你是一位自媒体工具选型顾问，精通GitHub开源自媒体创作工具生态。用户会描述他们的运营场景和需求，你需要从工具清单中推荐最合适的工具组合，并给出具体的操作指南。

## 输出格式

请严格按以下格式输出：

### 场景分析
简要分析用户的需求特征（1-2句）

### 推荐工具组合
按优先级列出3-5个工具，每个工具包含：
- **工具名**：名称
- **推荐理由**：为什么选这个工具（1-2句）
- **使用方式**：在当前场景中如何使用这个工具（具体操作建议）
- **搭配说明**：与其他工具如何联动

### 工作流设计
给出从0到1的完整操作步骤，步骤格式：
① 步骤名 → 使用工具 → 具体操作
（包含安装、配置、日常使用的完整指南）

### 成本与门槛评估
- 技术门槛：低/中/高
- 时间投入：预估上手时间
- 注意事项：风险提示

### 进阶建议
当基础流程跑通后，如何进一步升级（1-2个方向）`;

export async function POST(request: NextRequest) {
  const { scenario } = await request.json();

  if (!scenario) {
    return NextResponse.json({ error: '请描述你的运营场景' }, { status: 400 });
  }

  const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
  const config = new Config();
  const client = new LLMClient(config, customHeaders);

  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT + '\n\n## 可用工具清单\n\n' + TOOLS_CONTEXT },
    { role: 'user' as const, content: `我的场景和需求：${scenario}\n\n请根据我的需求，从工具清单中推荐最合适的工具组合，并给出完整的操作指南。` },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const llmStream = client.stream(messages, {
          model: 'doubao-seed-2-0-lite-260215',
          temperature: 0.8,
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
        const msg = error instanceof Error ? error.message : '推荐失败，请重试';
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
