import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: '小红书内容工厂 | AI驱动的内容创作平台',
  description:
    '基于GitHub自媒体创作工具调研，AI驱动的小红书内容创作平台。一键生成爆款笔记、种草推荐、干货教程，助力矩阵运营与个人IP打造。',
  keywords: [
    '小红书',
    '内容创作',
    'AI写作',
    '爆款笔记',
    '自媒体工具',
    '矩阵运营',
    '个人IP',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
