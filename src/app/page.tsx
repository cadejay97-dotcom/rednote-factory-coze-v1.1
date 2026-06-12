'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Tool, Combo, ToolsResponse } from '@/lib/types';

// ─── SSE Stream Reader Hook ───────────────────────────────────
function useSSEStream() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const call = useCallback(async (url: string, body: Record<string, string>) => {
    setLoading(true);
    setResult('');
    setError('');
    setVersion((v) => v + 1);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('请求失败');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) { setError(data.error); setLoading(false); return; }
              if (data.done) { setLoading(false); return; }
              if (data.content) { setResult((p) => p + data.content); setVersion((v) => v + 1); }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const copy = useCallback(() => { navigator.clipboard.writeText(result); }, [result]);

  return { result, loading, error, version, call, copy };
}

// ─── Result Display ───────────────────────────────────────────
function ResultPanel({ result, loading, error, version, onCopy }: {
  result: string; loading: boolean; error: string; version: number; onCopy: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && result) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [version, result]);

  const skeletonWidths = ['75%', '90%', '60%', '85%', '70%', '95%', '80%'];

  return (
    <Card className="h-full border-border/60 bg-white">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium text-foreground">生成结果</span>
          {result && !loading && (
            <button onClick={onCopy} className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-xhs">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              复制
            </button>
          )}
        </div>
        <div ref={scrollRef} className="min-h-[400px] max-h-[500px] overflow-y-auto rounded-lg bg-amber-50/30 p-4">
          {loading && !result && (
            <div className="space-y-3">
              {skeletonWidths.map((w, i) => (
                <div key={i} className="skeleton-shimmer h-4 rounded" style={{ width: w }} />
              ))}
            </div>
          )}
          {!loading && !result && !error && (
            <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
              <svg className="mb-3 h-12 w-12 text-xhs/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-xs">输入内容，点击生成按钮</p>
            </div>
          )}
          {result && (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground animate-fade-in">
              {result}
              {loading && <span className="typing-cursor" />}
            </div>
          )}
          {error && <div className="flex h-40 items-center justify-center"><p className="text-sm text-destructive">{error}</p></div>}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Star Rating ──────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} className={`h-3.5 w-3.5 ${i < rating ? 'text-xhs' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

const categoryColors: Record<string, string> = {
  '全链路运营': 'bg-xhs/10 text-xhs border-xhs/20',
  '多平台分发': 'bg-blue-50 text-blue-600 border-blue-200',
  'AI视频生成': 'bg-purple-50 text-purple-600 border-purple-200',
  '数据采集': 'bg-amber-50 text-amber-600 border-amber-200',
  '视频号专属': 'bg-green-50 text-green-600 border-green-200',
  '个人IP': 'bg-pink-50 text-pink-600 border-pink-200',
};
const levelColors: Record<string, string> = {
  '入门': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  '进阶': 'bg-blue-50 text-blue-600 border-blue-200',
  '高阶': 'bg-purple-50 text-purple-600 border-purple-200',
};

// ─── Tool Card ────────────────────────────────────────────────
function ToolCard({ tool }: { tool: Tool }) {
  return (
    <Card className="group border-border/60 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">{tool.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <StarRating rating={tool.rating} />
              {tool.star && <span className="text-xs text-muted-foreground">{tool.star}</span>}
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] ${categoryColors[tool.category] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
            {tool.category}
          </Badge>
        </div>
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.coreFeature}</p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tool.techStack.split(/[+,/]/).map((tech) => (
            <span key={tech} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{tech.trim()}</span>
          ))}
        </div>
        <div className="rounded-md bg-xhs-bg/60 p-2.5">
          <p className="text-[11px] leading-relaxed text-xhs">{tool.highlight}</p>
        </div>
        <a href={tool.github} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-xhs">
          <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>
      </CardContent>
    </Card>
  );
}

// ─── Combo Card ───────────────────────────────────────────────
function ComboCard({ combo }: { combo: Combo }) {
  return (
    <Card className="border-border/60 bg-white">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">{combo.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{combo.description}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] ${levelColors[combo.level]}`}>{combo.level}</Badge>
        </div>
        <div className="space-y-3">
          {combo.steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-xhs text-[10px] font-bold text-white">{idx + 1}</div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{step.desc}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {step.tools.map((tool) => (
                      <Badge key={tool} variant="outline" className="text-[10px] text-xhs border-xhs/20">{tool}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              {idx < combo.steps.length - 1 && <div className="absolute left-[11px] top-6 h-3 w-px bg-xhs/20" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Content Factory ──────────────────────────────────────────
function ContentFactory() {
  const [topic, setTopic] = useState('');
  const [template, setTemplate] = useState('图文笔记');
  const [style, setStyle] = useState('活泼俏皮');
  const [keywords, setKeywords] = useState('');
  const [persona, setPersona] = useState('');
  const [showPersona, setShowPersona] = useState(false);
  const stream = useSSEStream();

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    stream.call('/api/generate', { topic, template, style, keywords, persona });
  }, [topic, template, style, keywords, persona, stream]);

  const templates = [
    { value: '图文笔记', label: '图文笔记', desc: '日常分享' },
    { value: '种草推荐', label: '种草推荐', desc: '好物推荐' },
    { value: '干货教程', label: '干货教程', desc: '知识分享' },
    { value: '个人IP', label: '个人IP', desc: '观点输出' },
  ];
  const styles = [
    { value: '活泼俏皮', label: '活泼俏皮' },
    { value: '温柔治愈', label: '温柔治愈' },
    { value: '专业干练', label: '专业干练' },
    { value: '幽默吐槽', label: '幽默吐槽' },
  ];

  return (
    <section id="factory" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">内容创作工作台</h2>
          <p className="mt-2 text-sm text-muted-foreground">AI驱动，一键生成小红书爆款内容</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">选题内容</label>
                  <Textarea placeholder="例如：2026年最值得入手的AI工具推荐" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-[80px] resize-none text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">笔记模板</label>
                  <div className="grid grid-cols-2 gap-2">
                    {templates.map((t) => (
                      <button key={t.value} onClick={() => setTemplate(t.value)} className={`rounded-lg border p-2.5 text-left transition-all ${template === t.value ? 'border-xhs bg-xhs/5' : 'border-border/60 hover:border-xhs/30'}`}>
                        <span className={`text-xs font-medium ${template === t.value ? 'text-xhs' : 'text-foreground'}`}>{t.label}</span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground">{t.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">风格调性</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {styles.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">关键词 <span className="text-muted-foreground">（可选）</span></label>
                  <Input placeholder="用逗号分隔" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <button onClick={() => setShowPersona(!showPersona)} className="flex items-center gap-1.5 text-xs font-medium text-xhs hover:text-xhs-light transition-colors">
                    <svg className={`h-3.5 w-3.5 transition-transform ${showPersona ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M9 5l7 7-7 7" />
                    </svg>
                    个人IP人设卡 <span className="text-muted-foreground font-normal">（可选，灵感来自 ip-publisher）</span>
                  </button>
                  {showPersona && (
                    <div className="mt-2 animate-fade-in">
                      <Textarea placeholder="描述你的人设：你是谁、你的专业领域、说话风格、价值观等。例如：90后产品经理，3年小红书运营经验，擅长用大白话解释复杂概念" value={persona} onChange={(e) => setPersona(e.target.value)} className="min-h-[80px] resize-none text-xs" />
                      <p className="mt-1 text-[10px] text-muted-foreground">填入后，所有生成内容都会从此人的视角出发，确保人设一致性</p>
                    </div>
                  )}
                </div>
                <Button onClick={handleGenerate} disabled={!topic.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      AI 创作中...
                    </span>
                  ) : '开始创作'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Trending Topics Discovery ────────────────────────────────
function TopicsPanel() {
  const [niche, setNiche] = useState('');
  const [keywords, setKeywords] = useState('');
  const stream = useSSEStream();

  const handleDiscover = useCallback(() => {
    if (!niche.trim()) return;
    stream.call('/api/topics', { niche, keywords });
  }, [niche, keywords, stream]);

  const niches = ['美妆护肤', '穿搭', '美食', 'AI工具', '副业赚钱', '职场成长', '家居', '健身', '母婴', '旅行'];

  return (
    <section id="topics" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">爆款选题发现</h2>
          <p className="mt-2 text-sm text-muted-foreground">输入你的创作领域，AI帮你发现高潜力选题 — 灵感来自 Spider_XHS 的趋势采集能力</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">你的创作领域</label>
                  <Input placeholder="例如：AI工具推荐、美妆护肤、职场成长" value={niche} onChange={(e) => setNiche(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">关注方向 <span className="text-muted-foreground">（可选）</span></label>
                  <Input placeholder="例如：免费工具、新手入门、效率提升" value={keywords} onChange={(e) => setKeywords(e.target.value)} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">热门领域</label>
                  <div className="flex flex-wrap gap-1.5">
                    {niches.map((n) => (
                      <button key={n} onClick={() => setNiche(n)} className={`rounded-full border px-2.5 py-1 text-[10px] transition-colors ${niche === n ? 'border-xhs bg-xhs/5 text-xhs' : 'border-border/60 text-muted-foreground hover:border-xhs/30 hover:text-xhs'}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium text-amber-700">爆款选题 = 搜索热度 x 竞争空白 x 情绪共鸣</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">AI基于6大爆款公式 + 赛道趋势 + 内容空白分析，推荐高潜力选题</p>
                  </div>
                </div>
                <Button onClick={handleDiscover} disabled={!niche.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      分析中...
                    </span>
                  ) : '发现爆款选题'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Content Quality Scoring ──────────────────────────────────
function ScorePanel() {
  const [content, setContent] = useState('');
  const stream = useSSEStream();

  const handleScore = useCallback(() => {
    if (!content.trim()) return;
    stream.call('/api/score', { content });
  }, [content, stream]);

  return (
    <section id="score" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">内容质量评分</h2>
          <p className="mt-2 text-sm text-muted-foreground">这条笔记能火吗？5维度评分 + 具体优化建议</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">粘贴你的笔记内容</label>
                  <Textarea placeholder="把你写好的小红书笔记粘贴到这里，AI会从标题吸引力、开头钩子、内容结构、互动设计、爆款潜力5个维度打分并给出优化建议" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[200px] resize-none text-sm" />
                </div>
                <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium text-emerald-700">5维度评分体系</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">标题吸引力 / 开头钩子 / 内容结构 / 互动设计 / 爆款潜力，每项20分，总分100</p>
                  </div>
                </div>
                <Button onClick={handleScore} disabled={!content.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      评分中...
                    </span>
                  ) : '开始评分'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Matrix Batch Generation ──────────────────────────────────
function BatchPanel() {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('3');
  const [style, setStyle] = useState('');
  const [template, setTemplate] = useState('');
  const stream = useSSEStream();

  const handleBatch = useCallback(() => {
    if (!topic.trim()) return;
    stream.call('/api/batch', { topic, count, style, template });
  }, [topic, count, style, template, stream]);

  return (
    <section id="batch" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">矩阵批量生成</h2>
          <p className="mt-2 text-sm text-muted-foreground">一个选题生成多条差异化笔记，适合矩阵账号同时发布 — 灵感来自 XHS_ALL_IN_ONE 的批量生产能力</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">选题内容</label>
                  <Textarea placeholder="例如：2026年最值得入手的AI工具推荐" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-[80px] resize-none text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">生成条数</label>
                  <Select value={count} onValueChange={setCount}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2条 - 双号互补</SelectItem>
                      <SelectItem value="3">3条 - 小矩阵</SelectItem>
                      <SelectItem value="4">4条 - 中矩阵</SelectItem>
                      <SelectItem value="5">5条 - 大矩阵</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">风格偏好 <span className="text-muted-foreground">（可选）</span></label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="不限" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="不限">不限 - AI自动差异化</SelectItem>
                      <SelectItem value="活泼俏皮">活泼俏皮</SelectItem>
                      <SelectItem value="温柔治愈">温柔治愈</SelectItem>
                      <SelectItem value="专业干练">专业干练</SelectItem>
                      <SelectItem value="幽默吐槽">幽默吐槽</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">笔记类型 <span className="text-muted-foreground">（可选）</span></label>
                  <Select value={template} onValueChange={setTemplate}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="不限" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="不限">不限 - AI自动混搭</SelectItem>
                      <SelectItem value="图文笔记">图文笔记</SelectItem>
                      <SelectItem value="种草推荐">种草推荐</SelectItem>
                      <SelectItem value="干货教程">干货教程</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 rounded-lg border border-xhs/20 bg-xhs/5 p-3">
                  <svg className="h-5 w-5 shrink-0 text-xhs" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium text-xhs">差异化策略</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">每条笔记从不同视角切入、不同标题公式、不同标签组合，避免平台判定重复</p>
                  </div>
                </div>
                <Button onClick={handleBatch} disabled={!topic.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      批量生成中...
                    </span>
                  ) : '批量生成'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Multi-Platform Adapt ─────────────────────────────────────
function AdaptPanel() {
  const [content, setContent] = useState('');
  const [persona, setPersona] = useState('');
  const stream = useSSEStream();

  const handleAdapt = useCallback(() => {
    if (!content.trim()) return;
    stream.call('/api/adapt', { content, persona });
  }, [content, persona, stream]);

  return (
    <section id="adapt" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">多平台内容适配</h2>
          <p className="mt-2 text-sm text-muted-foreground">同一内容，四种平台风格 — 灵感来自 ip-publisher 的跨平台差异化改写</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">原始内容</label>
                  <Textarea placeholder="粘贴你已有的笔记内容，AI将改写为小红书/知乎/公众号/短视频四个版本" value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[160px] resize-none text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">作者人设 <span className="text-muted-foreground">（可选）</span></label>
                  <Input placeholder="描述你的人设，确保四个版本都是同一个人" value={persona} onChange={(e) => setPersona(e.target.value)} className="h-9 text-sm" />
                </div>
                <div className="flex gap-3 rounded-lg border border-xhs/20 bg-xhs/5 p-3">
                  <svg className="h-5 w-5 shrink-0 text-xhs" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium text-xhs">参考 ip-publisher 的核心能力</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">同一选题自动生成不同平台版本，小红书情绪浓度/知乎论证深度/公众号叙事质感/短视频极简口播</p>
                  </div>
                </div>
                <Button onClick={handleAdapt} disabled={!content.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      适配中...
                    </span>
                  ) : '一键四平台适配'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Video Script Generator ───────────────────────────────────
function VideoScriptPanel() {
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState('60秒');
  const [vstyle, setVStyle] = useState('知识科普');
  const stream = useSSEStream();

  const handleGenerate = useCallback(() => {
    if (!topic.trim()) return;
    stream.call('/api/video-script', { topic, duration, style: vstyle });
  }, [topic, duration, vstyle, stream]);

  return (
    <section id="video" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">AI视频脚本生成</h2>
          <p className="mt-2 text-sm text-muted-foreground">生成可直接喂给 MoneyPrinterTurbo / NarratoAI 的视频脚本</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">视频选题</label>
                  <Textarea placeholder="例如：为什么普通人也要学AI？3个真实案例告诉你" value={topic} onChange={(e) => setTopic(e.target.value)} className="min-h-[80px] resize-none text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">目标时长</label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30秒">30秒 - 极简口播</SelectItem>
                      <SelectItem value="60秒">60秒 - 短视频</SelectItem>
                      <SelectItem value="90秒">90秒 - 中长视频</SelectItem>
                      <SelectItem value="3分钟">3分钟 - 深度视频</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">内容风格</label>
                  <Select value={vstyle} onValueChange={setVStyle}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="知识科普">知识科普</SelectItem>
                      <SelectItem value="生活分享">生活分享</SelectItem>
                      <SelectItem value="情感共鸣">情感共鸣</SelectItem>
                      <SelectItem value="种草推荐">种草推荐</SelectItem>
                      <SelectItem value="干货教程">干货教程</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 rounded-lg border border-purple-200 bg-purple-50/50 p-3">
                  <svg className="h-5 w-5 shrink-0 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-[11px] font-medium text-purple-600">脚本可直接用于 AI 视频工具</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">MoneyPrinterTurbo (30K+ Star) 或 NarratoAI，从文案到成片全自动</p>
                  </div>
                </div>
                <Button onClick={handleGenerate} disabled={!topic.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      生成脚本中...
                    </span>
                  ) : '生成视频脚本'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── AI Tool Recommender ──────────────────────────────────────
function RecommendPanel() {
  const [scenario, setScenario] = useState('');
  const stream = useSSEStream();

  const handleRecommend = useCallback(() => {
    if (!scenario.trim()) return;
    stream.call('/api/recommend', { scenario });
  }, [scenario, stream]);

  const presets = [
    '我刚做小红书，想从0开始做矩阵账号',
    '我是个人博主，想做知识类短视频',
    '我有5个小红书账号，想做批量内容生产',
    '我想做个人IP，保持跨平台人设一致',
    '我想做视频号内容，需要采集+分发',
  ];

  return (
    <section id="recommend" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">AI工具推荐</h2>
          <p className="mt-2 text-sm text-muted-foreground">描述你的场景，AI从25+工具中推荐最佳组合并生成操作指南</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-white">
              <CardContent className="space-y-4 p-5">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">描述你的场景和需求</label>
                  <Textarea placeholder="例如：我有3个小红书账号，想做美妆领域的矩阵运营，每天需要发布5-10条笔记" value={scenario} onChange={(e) => setScenario(e.target.value)} className="min-h-[120px] resize-none text-sm" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">快速场景</label>
                  <div className="flex flex-wrap gap-1.5">
                    {presets.map((p) => (
                      <button key={p} onClick={() => setScenario(p)} className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-xhs/30 hover:text-xhs">
                        {p.length > 15 ? p.slice(0, 15) + '...' : p}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleRecommend} disabled={!scenario.trim() || stream.loading} className="h-10 w-full bg-xhs text-white hover:bg-xhs-light" size="sm">
                  {stream.loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      分析中...
                    </span>
                  ) : '获取工具推荐'}
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <ResultPanel result={stream.result} loading={stream.loading} error={stream.error} version={stream.version} onCopy={stream.copy} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Tools Section ────────────────────────────────────────────
function ToolsSection({ tools }: { tools: Tool[] }) {
  const categories = ['全部', '全链路运营', '多平台分发', 'AI视频生成', '数据采集', '视频号专属', '个人IP'];
  const [activeCategory, setActiveCategory] = useState('全部');

  return (
    <section id="tools" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">工具库</h2>
          <p className="mt-2 text-sm text-muted-foreground">精选 GitHub 开源自媒体创作工具，按场景分类</p>
        </div>
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="mb-6 flex h-auto w-full justify-start gap-1 overflow-x-auto bg-transparent p-0">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat} className="rounded-full border border-border/60 px-3 py-1.5 text-xs data-[state=active]:border-xhs data-[state=active]:bg-xhs data-[state=active]:text-white data-[state=active]:shadow-none">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(cat === '全部' ? tools : tools.filter((t) => t.category === cat)).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}

// ─── Combo Section ────────────────────────────────────────────
function ComboSection({ combos }: { combos: Combo[] }) {
  return (
    <section id="combos" className="scroll-mt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">组合方案</h2>
          <p className="mt-2 text-sm text-muted-foreground">按不同场景和阶段推荐的最佳工具组合</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {combos.map((combo) => (<ComboCard key={combo.id} combo={combo} />))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function HomePage() {
  const [data, setData] = useState<ToolsResponse | null>(null);
  const [activeTab, setActiveTab] = useState('factory');

  useEffect(() => {
    fetch('/api/tools').then((res) => res.json()).then(setData).catch(console.error);
  }, []);

  const navItems = [
    { id: 'factory', label: '创作台' },
    { id: 'topics', label: '选题' },
    { id: 'score', label: '评分' },
    { id: 'batch', label: '矩阵' },
    { id: 'adapt', label: '多平台' },
    { id: 'video', label: '视频' },
    { id: 'recommend', label: '推荐' },
    { id: 'tools', label: '工具库' },
    { id: 'combos', label: '方案' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-xhs">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-foreground">小红书内容工厂</span>
          </div>
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  const el = document.getElementById(item.id);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs transition-colors ${activeTab === item.id ? 'bg-xhs/10 text-xhs font-medium' : 'text-muted-foreground hover:text-xhs'}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-xhs/5 via-transparent to-xhs-light/5" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge variant="outline" className="mb-4 border-xhs/20 bg-xhs/5 text-xhs">
            基于 GitHub 25+ 开源工具调研
          </Badge>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold leading-tight tracking-tight text-foreground">
            一站式小红书<span className="text-xhs">内容创作</span>工厂
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            爆款选题发现 + AI笔记生成 + 质量评分 + 矩阵批量 + 多平台适配 + 视频脚本 + 智能工具推荐
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="#factory">
              <Button className="h-10 bg-xhs text-white hover:bg-xhs-light" size="sm">开始创作</Button>
            </a>
            <a href="#topics">
              <Button variant="outline" className="h-10 border-border/60" size="sm">发现选题</Button>
            </a>
          </div>
          {/* Feature Cards */}
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: '✏️', title: 'AI内容生成', desc: '4种模板·4种风格', color: 'text-xhs' },
              { icon: '🔥', title: '爆款选题', desc: '6大公式·趋势分析', color: 'text-amber-500' },
              { icon: '📊', title: '质量评分', desc: '5维度100分', color: 'text-emerald-500' },
              { icon: '📋', title: '矩阵批量', desc: '一选题多条差异化', color: 'text-blue-500' },
              { icon: '🔄', title: '多平台适配', desc: '4平台风格改写', color: 'text-indigo-500' },
              { icon: '🎬', title: '视频脚本', desc: 'MoneyPrinter可用', color: 'text-purple-500' },
              { icon: '🎯', title: '人设卡', desc: 'ip-publisher人设', color: 'text-pink-500' },
              { icon: '🧭', title: '智能推荐', desc: '25+工具精准匹配', color: 'text-teal-500' },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-white p-3 shadow-sm">
                <div className="text-lg">{f.icon}</div>
                <div className={`mt-1 text-xs font-semibold ${f.color}`}>{f.title}</div>
                <div className="text-[10px] text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Factory */}
      <section className="py-10"><ContentFactory /></section>

      {/* Topics Discovery */}
      <section className="py-10"><TopicsPanel /></section>

      {/* Content Score */}
      <section className="py-10"><ScorePanel /></section>

      {/* Matrix Batch */}
      <section className="py-10"><BatchPanel /></section>

      {/* Multi-Platform Adapt */}
      <section className="py-10"><AdaptPanel /></section>

      {/* Video Script */}
      <section className="py-10"><VideoScriptPanel /></section>

      {/* AI Recommender */}
      <section className="py-10"><RecommendPanel /></section>

      {/* Tools */}
      <section className="py-10">
        {data ? <ToolsSection tools={data.tools} /> : (
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="border-border/60 bg-white"><CardContent className="p-5"><div className="skeleton-shimmer mb-3 h-4 w-2/3 rounded" /><div className="skeleton-shimmer mb-2 h-3 w-full rounded" /><div className="skeleton-shimmer h-3 w-4/5 rounded" /></CardContent></Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Combo */}
      <section className="py-10">
        {data ? <ComboSection combos={data.combos} /> : (
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Card key={i} className="border-border/60 bg-white"><CardContent className="p-6"><div className="skeleton-shimmer mb-3 h-5 w-1/2 rounded" /><div className="skeleton-shimmer mb-2 h-3 w-full rounded" /></CardContent></Card>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Risk */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl">
          <Card className="border-amber-200/60 bg-amber-50/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">风险提示与合规建议</h3>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <li>- 爬虫类工具存在法律风险，请遵守robots.txt和平台服务条款</li>
                    <li>- 自动化发布工具可能触发平台风控，建议使用草稿模式+人工确认</li>
                    <li>- AI生成内容需人工审核，避免虚假信息和版权问题</li>
                    <li>- 多账号运营请遵守平台规则，避免被封号风险</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <p className="text-xs text-muted-foreground">小红书内容工厂 - 基于 GitHub 开源工具调研报告构建</p>
          <p className="mt-1 text-[11px] text-muted-foreground/60">数据来源于公开开源项目，仅供学习研究使用</p>
        </div>
      </footer>
    </div>
  );
}
