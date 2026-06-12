import { NextResponse } from 'next/server';

interface Tool {
  id: number;
  name: string;
  github: string;
  coreFeature: string;
  techStack: string;
  star?: string;
  rating: number;
  category: string;
  scenario: string;
  highlight: string;
}

const tools: Tool[] = [
  {
    id: 1,
    name: 'XHS_ALL_IN_ONE',
    github: 'https://github.com/cv-cat/XHS_ALL_IN_ONE',
    coreFeature: '采集→内容库→AI改写→图片润色→一键发布→定时自动运营全链路打通',
    techStack: 'Python + Vue/React',
    star: '快速增长中',
    rating: 5,
    category: '全链路运营',
    scenario: '矩阵二创(核心)、多账号运营、批量内容生产',
    highlight: '草稿工坊三栏布局，AI图片润色并排对比预览，2小时自动健康巡检',
  },
  {
    id: 2,
    name: 'xiaohongshu-mcp',
    github: 'https://github.com/xpzouying/xiaohongshu-mcp',
    coreFeature: 'MCP协议小红书自动化，支持登录验证、图文/视频发布、内容搜索、评论互动',
    techStack: 'Go + go-rod',
    star: '9.7K+',
    rating: 4,
    category: '全链路运营',
    scenario: '矩阵二创(配合n8n编排)、AI驱动自动化运营',
    highlight: '可被n8n/AI Agent调度，构建全自动内容生产线',
  },
  {
    id: 3,
    name: 'Spider_XHS',
    github: 'https://github.com/cv-cat/Spider_XHS',
    coreFeature: '小红书数据运营+爬虫+创作者平台操作，AI一键改写笔记直接上传',
    techStack: 'Python',
    rating: 4,
    category: '数据采集',
    scenario: '矩阵二创(数据采集+自动上传)、竞品分析、舆情监控',
    highlight: 'AI一键改写笔记直接上传——从采集到发布的闭环',
  },
  {
    id: 4,
    name: 'rednote-skills',
    github: 'https://github.com/Anning01/rednote-skills',
    coreFeature: 'Python+Playwright自动化交互：笔记搜索、内容提取、点赞/收藏/评论、图文发布',
    techStack: 'Python + Playwright',
    rating: 3,
    category: '全链路运营',
    scenario: '个人IP(轻量级小红书自动化)、二次开发集成',
    highlight: '通过window.__INITIAL_STATE__直接获取笔记JSON数据',
  },
  {
    id: 5,
    name: 'social-auto-upload',
    github: 'https://github.com/dreammis/social-auto-upload',
    coreFeature: '跨平台视频自动发布，支持抖音/B站/小红书/快手/视频号/TikTok',
    techStack: 'Python 3.10+ + Playwright + SQLite + Vue.js',
    star: '10K+',
    rating: 5,
    category: '多平台分发',
    scenario: '矩阵二创(核心分发工具)、视频矩阵运营、MCN日常运营',
    highlight: '完整前后端架构，Web管理界面，单机日处理100+视频',
  },
  {
    id: 6,
    name: '矩媒 MatrixMedia',
    github: 'https://github.com/hanliang97/MatrixMedia',
    coreFeature: '本地自媒体矩阵发布工具，GUI+CLI双模式，可被AI智能体调度',
    techStack: 'Electron + Puppeteer',
    rating: 4,
    category: '多平台分发',
    scenario: '矩阵二创(AI Agent可调度)、视频矩阵、技术型运营者',
    highlight: 'GUI和CLI共享登录态，退出码语义化适合自动化编排',
  },
  {
    id: 7,
    name: 'Wechatsync',
    github: 'https://github.com/wechatsync/Wechatsync',
    coreFeature: 'Chrome扩展，一键同步微信公众号文章到29+平台',
    techStack: 'Chrome Extension + JavaScript',
    rating: 4,
    category: '多平台分发',
    scenario: '矩阵二创(图文分发)、个人IP(品牌一致性分发)',
    highlight: '零门槛浏览器扩展，安全合规，29+平台覆盖最广',
  },
  {
    id: 8,
    name: 'kebenxiaoming/matrix',
    github: 'https://github.com/kebenxiaoming/matrix',
    coreFeature: 'Playwright自动化发布视频到抖音/快手/视频号/小红书等多平台',
    techStack: 'Python 3 + Playwright',
    rating: 3,
    category: '多平台分发',
    scenario: '矩阵二创(视频多平台分发)',
    highlight: '轻量级视频分发方案，部署简单',
  },
  {
    id: 9,
    name: 'MoneyPrinterTurbo',
    github: 'https://github.com/harry0703/MoneyPrinterTurbo',
    coreFeature: '一键AI短视频生成：文案→语音→字幕→画面→渲染，全流程自动化',
    techStack: 'Python + Streamlit/Web UI',
    star: '30K+',
    rating: 5,
    category: 'AI视频生成',
    scenario: '矩阵二创(AI视频批量生成)、知识类短视频',
    highlight: '集成GPT-4写文案+Edge-TTS配音+FFmpeg渲染，全流程无人值守',
  },
  {
    id: 10,
    name: ' NarratoAI',
    github: 'https://github.com/NarratoAI/narrato',
    coreFeature: 'AI驱动的故事化短视频生成：剧本→分镜→画面→旁白→成片',
    techStack: 'Python + MoviePy',
    rating: 4,
    category: 'AI视频生成',
    scenario: '矩阵二创(故事化短视频)、知识科普、品牌故事',
    highlight: '从文字大纲自动生成完整故事短视频，支持多种叙事模板',
  },
  {
    id: 11,
    name: 'PyWxDump',
    github: 'https://github.com/xaoyaoo/PyWxDump',
    coreFeature: '微信数据库解密与数据分析，支持聊天记录导出和关键词监控',
    techStack: 'Python',
    star: '18K+',
    rating: 4,
    category: '数据采集',
    scenario: '个人IP(微信内容二次利用)、数据分析、舆情监控',
    highlight: '微信生态数据解密能力，可导出为多种格式',
  },
  {
    id: 12,
    name: 'XHS-Tracker',
    github: 'https://github.com/ReaJason/xhs',
    coreFeature: '小红书数据采集SDK，支持笔记搜索/用户信息/评论采集/话题分析',
    techStack: 'Python',
    rating: 4,
    category: '数据采集',
    scenario: '矩阵二创(竞品分析)、热点追踪、内容效果追踪',
    highlight: '完善的Python SDK，可作为数据管道集成到自动化流程',
  },
  {
    id: 13,
    name: 'wx_channel',
    github: 'https://github.com/nobiyou/wx_channel',
    coreFeature: '视频号视频下载：单视频/批量、加密解密、多分辨率、Web控制台',
    techStack: 'Go 1.23+ + SunnyNet',
    rating: 4,
    category: '视频号专属',
    scenario: '矩阵二创(视频号素材采集)、视频号内容监控',
    highlight: '基于代理拦截+脚本注入，支持批量下载+断点续传+智能去重',
  },
  {
    id: 14,
    name: 'ip-publisher',
    github: 'https://github.com/veeicwgy/ip-publisher',
    coreFeature: '个人IP内容自动化工作流：热点发现→人设对齐→内容策略→平台改写→去AI味→封面生成→多平台发布',
    techStack: 'Python + Claude Code/OpenClaw Skills',
    rating: 5,
    category: '个人IP',
    scenario: '个人IP(核心工具)、跨平台品牌一致性维护',
    highlight: '以"人设一致性"为核心，同一选题自动生成不同平台差异化版本',
  },
  {
    id: 15,
    name: 'clipsketch-ai',
    github: 'https://github.com/RanFeng/clipsketch-ai',
    coreFeature: '视频转手绘分镜+AI文案：自动提取视频关键帧→手绘风格渲染→AI生成脚本',
    techStack: 'Python + AI绘画',
    rating: 3,
    category: 'AI视频生成',
    scenario: '个人IP(创意内容)、知识类视频二创',
    highlight: '视频→手绘分镜的独特创意路径，差异化内容生成',
  },
];

interface Combo {
  id: number;
  name: string;
  description: string;
  steps: { title: string; tools: string[]; desc: string }[];
  level: '入门' | '进阶' | '高阶';
}

const combos: Combo[] = [
  {
    id: 1,
    name: '零基础小红书起步方案',
    description: '适合刚入局小红书的新手，从0到1搭建内容生产流程',
    level: '入门',
    steps: [
      {
        title: '素材采集与灵感发现',
        tools: ['Spider_XHS', 'XHS-Tracker'],
        desc: '采集竞品爆款笔记，发现热门话题和内容趋势',
      },
      {
        title: 'AI内容生成',
        tools: ['XHS_ALL_IN_ONE'],
        desc: '使用AI改写+润色，批量生成原创笔记内容',
      },
      {
        title: '发布与管理',
        tools: ['XHS_ALL_IN_ONE'],
        desc: '一键发布+定时自动运营，设置好后无人值守',
      },
    ],
  },
  {
    id: 2,
    name: '视频矩阵运营方案',
    description: '适合视频内容为主的矩阵运营者，覆盖主流视频平台',
    level: '进阶',
    steps: [
      {
        title: 'AI视频批量生产',
        tools: ['MoneyPrinterTurbo'],
        desc: '从文案到成片全流程AI生成，日产量可达50+条',
      },
      {
        title: '多平台自动分发',
        tools: ['social-auto-upload'],
        desc: '一键分发到抖音/B站/小红书/快手/视频号，单机日处理100+视频',
      },
      {
        title: '数据监控与优化',
        tools: ['Spider_XHS', 'XHS-Tracker'],
        desc: '追踪各平台数据表现，分析爆款规律，优化内容策略',
      },
    ],
  },
  {
    id: 3,
    name: 'AI Agent全自动方案',
    description: '技术型运营者的终极方案，AI Agent驱动的全自动化流水线',
    level: '高阶',
    steps: [
      {
        title: 'AI Agent编排',
        tools: ['xiaohongshu-mcp', '矩媒 MatrixMedia'],
        desc: '通过n8n/AI Agent调度MCP服务和CLI工具，构建自动化工作流',
      },
      {
        title: '内容生产管线',
        tools: ['MoneyPrinterTurbo', 'XHS_ALL_IN_ONE'],
        desc: 'AI视频+图文双线生产，自动改写+润色+标签生成',
      },
      {
        title: '多平台矩阵发布',
        tools: ['social-auto-upload', '矩媒 MatrixMedia'],
        desc: '6+平台自动发布，GUI+CLI双模式灵活切换',
      },
      {
        title: '全链路数据闭环',
        tools: ['Spider_XHS', 'PyWxDump', 'XHS-Tracker'],
        desc: '采集→分析→优化→生产→发布，数据驱动的迭代循环',
      },
    ],
  },
  {
    id: 4,
    name: '个人IP品牌方案',
    description: '打造个人IP的核心方案，确保跨平台人设一致性',
    level: '进阶',
    steps: [
      {
        title: '人设定义与内容策略',
        tools: ['ip-publisher'],
        desc: '基于profile.yaml定义人设，所有内容从"你是谁"出发',
      },
      {
        title: '多平台差异化创作',
        tools: ['ip-publisher', 'Wechatsync'],
        desc: '同一选题自动生成不同平台版本，保持风格差异但人设统一',
      },
      {
        title: '全平台同步分发',
        tools: ['Wechatsync', 'social-auto-upload'],
        desc: '图文29+平台一键同步，视频主流平台自动分发',
      },
    ],
  },
];

export async function GET() {
  return NextResponse.json({ tools, combos });
}
