"use client";
import { useEffect } from 'react';
export default function Workspace(){useEffect(()=>{const s=document.createElement('script');s.type='module';s.src='/app.js';document.body.appendChild(s);return ()=>{s.remove();};},[]);return <><div id="app"><p style={{padding:40}}>正在载入青禾顾问工作台…</p></div><div id="toast" role="status"/><dialog id="dialog"/></>;}
