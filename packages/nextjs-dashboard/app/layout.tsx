import '@/app/ui/global.css';
import { inter } from "@/app/ui/fonts";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: 'zack的nextjs学习 ｜ %s',
    default: 'zack的nextjs学习',
  },
  description: '如何使用nextjs进行全栈开发',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh')
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
