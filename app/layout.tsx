import type { Metadata } from 'next';
import './globals.css';
import { TopBar } from '@/components/TopBar';

export const metadata: Metadata = {
  title: '校園公告系統',
  description: '台灣高中校園公告系統 — 統一發布、標籤篩選、附件管理',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-200 bg-white py-4 text-center text-xs text-ink-500">
          校園公告系統 · 建置中
        </footer>
      </body>
    </html>
  );
}
