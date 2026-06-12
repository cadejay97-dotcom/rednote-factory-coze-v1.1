# AGENTS.md

## 项目概览

小红书内容工厂 - 基于GitHub自媒体创作工具调研报告构建的AI驱动内容创作平台。提供小红书爆款笔记AI生成、开源工具库浏览、组合方案推荐等功能。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **AI SDK**: coze-coding-dev-sdk (LLMClient + FetchClient)

## 目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # AI内容生成接口（SSE流式）
│   │   └── tools/route.ts      # 工具数据接口
│   ├── globals.css             # 全局样式 + 小红书品牌色
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页（单页应用：Hero + 创作台 + 工具库 + 组合方案）
├── components/ui/              # shadcn/ui 组件库
└── lib/
    ├── types.ts                # 类型定义（Tool, Combo, ToolsResponse）
    └── utils.ts                # 工具函数
```

## 构建与运行命令

- `pnpm install` - 安装依赖
- `pnpm run dev` - 开发环境启动
- `pnpm run build` - 生产构建
- `pnpm run start` - 生产环境启动
- `pnpm run ts-check` - TypeScript类型检查
- `pnpm run lint` - ESLint检查

## API 接口

### POST /api/generate
AI内容生成（SSE流式输出）

请求体:
```json
{
  "topic": "选题内容",
  "template": "图文笔记 | 种草推荐 | 干货教程 | 个人IP",
  "style": "活泼俏皮 | 温柔治愈 | 专业干练 | 幽默吐槽",
  "keywords": "可选关键词"
}
```

### GET /api/tools
获取工具库和组合方案数据

## 核心设计

- 品牌色: #FF2442（小红书红）
- 页面为单页应用，通过锚点导航切换区域
- AI生成使用SSE流式协议，前端逐字打字机效果
- 工具数据来源于GitHub自媒体创作工具调研报告PDF

## 编码规范

- 严禁隐式any，所有函数参数和返回值需有类型
- 后端API使用 `HeaderUtils.extractForwardHeaders` 转发请求头
- AI流式接口使用 nodejs runtime（非edge）
- 前端使用 'use client' 标记客户端组件
