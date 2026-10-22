import type { Metadata } from 'next';
export const metadata: Metadata={title:'青禾 · 顾问工作台 v0.2',description:'咨询成交与老客经营的一体化顾问工作台'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><head><link rel="stylesheet" href="/style.css"/></head><body>{children}</body></html>;}
