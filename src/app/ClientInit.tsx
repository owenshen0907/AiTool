'use client';                       // 关键！让它在浏览器端执行

import '@/lib/fetchPatch';          // side-effect 打补丁，无需导出任何东西

export default function ClientInit() {
    return null;                      // 不渲染 UI，仅做初始化
}