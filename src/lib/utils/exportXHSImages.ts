// 小红书风导出 v2：卡片化布局 + 表格卡片 + 智能分页（iframe 隔离，规避 oklch 报错）
import { marked } from 'marked';

export interface ExportOptions {
    width?: number;             // 1080
    height?: number;            // 1440
    pageMargin?: { top: number; right: number; bottom: number; left: number }; // 页面安全区（留白）
    bg?: string;                // 仅 hex/rgb（避免 oklch）
    fg?: string;
    accent?: string;            // 强调色（链接/强调）
    card?: {
        gapY?: number;            // 卡片垂直间距
        padding?: number;         // 卡片内边距
        radius?: number;          // 圆角
        shadow?: string;          // 阴影（用 rgba/hex）
        border?: string;          // 边框色
    };
    fontSize?: number;          // 正文字号
    lineHeight?: number;        // 行高
    header?: {
        enabled?: boolean;
        height?: number;          // 头部高度
        title?: string;
        summary?: string;         // 仅首页可选显示
        titleFontSize?: number;
        titleColor?: string;
        summaryColor?: string;
        showDivider?: boolean;
        dividerColor?: string;
    };
    footer?: {
        showPageNumber?: boolean;
        numberColor?: string;
        numberFontSize?: number;
        watermarkText?: string;   // 例：@你的账号
        watermarkColor?: string;
        watermarkFontSize?: number;
    };
    filePrefix?: string;        // zip 前缀
    includeHeader?: { title?: string; summary?: string }; // 兼容旧参数
}

/** -------- 基础工具 -------- */
function ensureBrowser() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('exportMarkdownToXHSImages 只能在浏览器环境调用。');
    }
}

function createIsolatedIframe(width: number) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-99999px';
    iframe.style.top = '0';
    iframe.style.width = `${width}px`;
    iframe.style.height = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);
    return iframe;
}

function writeIsolatedHTML(doc: Document, css: string, htmlBody: string) {
    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>export</title>
  <style>
    html,body{margin:0;padding:0;background:#ffffff;}
    ${css}
  </style>
</head>
<body>${htmlBody}</body>
</html>`);
    doc.close();
}

function escapeHtml(s: string) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/** -------- CSS：严格用 hex/rgb -------- */
/** -------- CSS：严格用 hex/rgb -------- */
function buildBaseCSS(p: {
    width: number; contentWidth: number; bg: string; fg: string; accent: string;
    fontSize: number; lineHeight: number;
    cardPad: number; cardRadius: number; cardShadow: string; cardBorder: string; cardGapY: number;
}) {
    const {
        width, contentWidth, bg, fg, accent,
        fontSize, lineHeight,
        cardPad, cardRadius, cardShadow, cardBorder, cardGapY
    } = p;

    return `
  .xhs-stage{ width:${width}px; background:${bg}; }
  .xhs-hidden{ position:absolute; left:-99999px; top:0; }

  .xhs-card{
    width:${contentWidth}px;
    background:#ffffff;
    color:${fg};
    padding:${cardPad}px;
    border-radius:${cardRadius}px;
    box-shadow:${cardShadow};
    border:1px solid ${cardBorder};
    margin:0 0 ${cardGapY}px 0;
    font-size:${fontSize}px;
    line-height:${lineHeight};
    font-family:"Noto Sans CJK SC","PingFang SC","Hiragino Sans","Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    box-sizing:border-box;
    overflow-wrap:break-word;
  }
  .xhs-card h1,.xhs-card h2,.xhs-card h3{ margin:0 0 .6em 0; color:${fg}; }
  .xhs-card a{ color:${accent}; text-decoration:none; }
  .xhs-card p{ margin:0 0 .8em 0; }
  .xhs-card ul, .xhs-card ol{ margin:.4em 0 .8em 1.2em; }
  .xhs-card code, .xhs-card pre{ background:#f6f8fa; border-radius:8px; }
  .xhs-card pre{ padding:12px; overflow:auto; }
  .xhs-card img{ max-width:100%; height:auto; display:block; border-radius:8px; }

  /* 表格卡片：轻边框+分隔线+圆角表头 */
  .xhs-table{
    width:100%;
    border-collapse:separate;
    border-spacing:0;
    table-layout:fixed;
    background:#ffffff;
    border:1px solid ${cardBorder};
    border-radius:${cardRadius}px;
    overflow:hidden;
  }
  .xhs-table thead th{
    background:#f3f4f6; /* 浅灰表头 */
    color:${fg};
    font-weight:600;
    padding:12px 14px;
    border-bottom:1px solid #e5e7eb;
  }
  .xhs-table tbody td{
    padding:12px 14px;
    border-bottom:1px solid #eeeeee;
    vertical-align:top;
    word-break:break-word;
    background:#ffffff;
  }
  .xhs-table tbody tr:last-child td{ border-bottom:none; }
  .xhs-table caption{
    caption-side:top;
    text-align:left;
    font-weight:700;
    margin-bottom:8px;
  }

  /* 页面容器（用于最终渲染） */
  .xhs-page{
    position:relative;
    width:${width}px;
    height:100%; /* 由脚本固定为目标高度 */
    background:${bg};
  }
  .xhs-header{
    width:100%;
    box-sizing:border-box;
  }
  .xhs-header-title{
    font-weight:800;
  }
  .xhs-header-summary{
    color:#666666;
  }
  .xhs-divider{ width:100%; height:1px; background:#e5e7eb; }

  .xhs-page-content{ box-sizing:border-box; }
  .xhs-footer{
    position:absolute; left:0; right:0; display:flex; align-items:center; justify-content:space-between;
    box-sizing:border-box;
  }
  `;
}

/** -------- Markdown → DOM 单元（卡片化） --------
 * 策略：
 *  - 以 h1/h2/h3 开启新卡片，普通段落/列表跟随当前卡片
 *  - 表格单独用“表格卡片”，后续可分页（按行拆）
 */
function buildUnitsFromMarkdown(doc: Document, html: string, contentWidth: number, cssClassCard = 'xhs-card') {
    const host = doc.createElement('div');
    host.innerHTML = html;

    const units: HTMLElement[] = [];
    let curCard: HTMLElement | null = null;

    const flushCard = () => {
        if (curCard && curCard.childNodes.length > 0) {
            units.push(curCard);
            curCard = null;
        }
    };

    const newCard = () => {
        const card = doc.createElement('div');
        card.className = cssClassCard;
        card.style.width = `${contentWidth}px`;
        return card;
    };

    const toTableCard = (tableEl: HTMLTableElement) => {
        const wrap = doc.createElement('div');
        wrap.className = cssClassCard;
        wrap.style.width = `${contentWidth}px`;

        // 提升视觉层次：表标题（若上一兄弟是 “表X：” 文本，可考虑捕获，这里简化）
        // 直接使用语义化 table with class
        tableEl.classList.add('xhs-table');
        wrap.appendChild(tableEl);
        return wrap;
    };

    const children = Array.from(host.childNodes);
    for (const node of children) {
        if (node.nodeType === 1) {
            const el = node as HTMLElement;
            if (['H1','H2','H3'].includes(el.tagName)) {
                flushCard();
                curCard = newCard();
                curCard.appendChild(el); // 标题放卡片内
                continue;
            }
            if (el.tagName === 'TABLE') {
                flushCard();
                units.push(toTableCard(el as HTMLTableElement));
                continue;
            }
            // 一般块：加入现有卡片；若没有则创建
            if (!curCard) curCard = newCard();
            curCard.appendChild(el);
        } else if (node.nodeType === 3) {
            const text = node.textContent?.trim();
            if (text) {
                if (!curCard) curCard = newCard();
                const p = doc.createElement('p');
                p.textContent = text;
                curCard.appendChild(p);
            }
        }
    }
    flushCard();
    return units;
}

/** 将 table 卡片按行拆分，保证不跨页 */
function splitTableCardByRows(doc: Document, card: HTMLElement, maxContentHeight: number) {
    const table = card.querySelector('table');
    if (!table) return [card];

    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    const result: HTMLElement[] = [];
    const rows = Array.from((tbody || table).querySelectorAll('tr')); // 兼容无 thead 的表

    let curWrap: HTMLElement | null = null;
    let curTable: HTMLTableElement | null = null;
    let curBody: HTMLElement | null = null;

    const startNew = () => {
        curWrap = doc.createElement('div');
        curWrap.className = card.className;
        curWrap.setAttribute('data-split', '1');

        curTable = doc.createElement('table');
        curTable.className = 'xhs-table';
        if (thead) {
            const thClone = thead.cloneNode(true);
            curTable.appendChild(thClone);
        }
        curBody = doc.createElement('tbody');
        curTable.appendChild(curBody!);
        curWrap.appendChild(curTable);
    };

    const finishCur = () => {
        if (curWrap) result.push(curWrap);
        curWrap = null;
        curTable = null;
        curBody = null;
    };

    startNew();

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i].cloneNode(true) as HTMLElement;
        curBody!.appendChild(row);

        // 临时插入到文档测高
        doc.body.appendChild(curWrap!);
        const h = curWrap!.offsetHeight;
        doc.body.removeChild(curWrap!);

        if (h > maxContentHeight) {
            // 超出，移除本行、结页，另起新页
            curBody!.removeChild(row);
            finishCur();

            startNew();
            curBody!.appendChild(row);

            // 如果单行依然超出，强插（避免死循环），实际会溢出一丢丢
            doc.body.appendChild(curWrap!);
            const h2 = curWrap!.offsetHeight;
            doc.body.removeChild(curWrap!);
            if (h2 > maxContentHeight) {
                finishCur();
                startNew();
            }
        }
    }

    finishCur();
    return result;
}

/** 将单位装箱到多页（不跨页；表格可按行拆） */
function packUnitsToPages(
    doc: Document,
    units: HTMLElement[],
    opt: {
        pageW: number; pageH: number;
        margin: { top: number; right: number; bottom: number; left: number };
        header: { enabled: boolean; height: number; title: string; summary?: string; showDivider: boolean; };
        footerH: number;
    }
) {
    const { pageW, pageH, margin, header, footerH } = opt;

    const pages: HTMLElement[] = [];
    let page!: HTMLElement;               // ✅ 确定赋值断言
    let contentArea!: HTMLElement;        // ✅ 确定赋值断言

    const newPage = (isFirst: boolean) => {
        const p = doc.createElement('div');
        p.className = 'xhs-page';
        p.style.width = `${pageW}px`;
        p.style.height = `${pageH}px`;
        p.style.position = 'relative';
        p.style.background = '#ffffff';

        // header
        let y = margin.top;
        if (header.enabled) {
            const headerWrap = doc.createElement('div');
            headerWrap.className = 'xhs-header';
            headerWrap.style.position = 'absolute';
            headerWrap.style.left = `${margin.left}px`;
            headerWrap.style.right = `${margin.right}px`;
            headerWrap.style.top = `${margin.top}px`;
            headerWrap.style.height = `${header.height}px`;
            headerWrap.style.display = 'flex';
            headerWrap.style.flexDirection = 'column';
            headerWrap.style.justifyContent = 'center';

            const titleEl = doc.createElement('div');
            titleEl.className = 'xhs-header-title';
            titleEl.textContent = header.title || '';
            titleEl.style.fontSize = '40px';
            titleEl.style.fontWeight = '800';
            titleEl.style.color = '#111111';
            titleEl.style.lineHeight = '1.1';
            headerWrap.appendChild(titleEl);

            if (isFirst && header.summary) {
                const sumEl = doc.createElement('div');
                sumEl.className = 'xhs-header-summary';
                sumEl.textContent = header.summary;
                sumEl.style.marginTop = '6px';
                sumEl.style.fontSize = '20px';
                sumEl.style.color = '#666666';
                headerWrap.appendChild(sumEl);
            }

            if (header.showDivider) {
                const divEl = doc.createElement('div');
                divEl.className = 'xhs-divider';
                divEl.style.position = 'absolute';
                divEl.style.left = '0';
                divEl.style.right = '0';
                divEl.style.bottom = '0';
                divEl.style.height = '1px';
                divEl.style.background = '#e5e7eb';
                headerWrap.appendChild(divEl);
            }

            p.appendChild(headerWrap);
            y += header.height;
        }

        // content
        const area = doc.createElement('div');
        area.className = 'xhs-page-content';
        area.style.position = 'absolute';
        area.style.left = `${margin.left}px`;
        area.style.right = `${margin.right}px`;
        area.style.top = `${y}px`;
        area.style.bottom = `${margin.bottom + footerH}px`;
        area.style.overflow = 'hidden';
        p.appendChild(area);

        // footer
        const footerWrap = doc.createElement('div');
        footerWrap.className = 'xhs-footer';
        footerWrap.style.position = 'absolute';
        footerWrap.style.left = `${margin.left}px`;
        footerWrap.style.right = `${margin.right}px`;
        footerWrap.style.bottom = `${margin.bottom}px`;
        footerWrap.style.height = `${footerH}px`;
        footerWrap.style.display = 'flex';
        footerWrap.style.alignItems = 'center';
        footerWrap.style.justifyContent = 'space-between';
        p.appendChild(footerWrap);

        // ✅ 最后再写回到外部变量，TS 知道它们已被赋值
        page = p;
        contentArea = area;

        pages.push(p);
    };

    // 第 1 页
    newPage(true);

    const hMax = () => contentArea.clientHeight;

    for (let i = 0; i < units.length; i++) {
        const unit = units[i];

        contentArea.appendChild(unit);
        let hNow = contentArea.scrollHeight;

        if (hNow <= hMax()) continue;

        // 放不下：回退
        contentArea.removeChild(unit);

        // 表格卡片尝试拆分
        const isTableCard = !!unit.querySelector('table.xhs-table');
        if (isTableCard) {
            const parts = splitTableCardByRows(doc, unit, hMax());
            for (const part of parts) {
                contentArea.appendChild(part);
                hNow = contentArea.scrollHeight;
                if (hNow > hMax()) {
                    contentArea.removeChild(part);
                    newPage(false);
                    contentArea.appendChild(part);
                }
            }
            continue;
        }

        // 普通卡片：另起一页
        newPage(false);
        contentArea.appendChild(unit);
    }

    return pages;
}

/** -------- 主函数：小红书风导出 -------- */
export async function exportMarkdownToXHSImages(markdown: string, options: ExportOptions = {}) {
    ensureBrowser();

    const width = options.width ?? 1080;
    const height = options.height ?? 1440;
    const pageMargin = options.pageMargin ?? { top: 64, right: 64, bottom: 64, left: 64 };

    const bg = options.bg ?? '#ffffff';
    const fg = options.fg ?? '#111111';
    const accent = options.accent ?? '#2563eb';

    const cardPad = options.card?.padding ?? 24;
    const cardRadius = options.card?.radius ?? 20;
    const cardShadow = options.card?.shadow ?? '0 6px 18px rgba(0,0,0,0.06)';
    const cardBorder = options.card?.border ?? '#f0f0f0';
    const cardGapY = options.card?.gapY ?? 20;

    const fontSize = options.fontSize ?? 18;
    const lineHeight = options.lineHeight ?? 1.6;

    const headerEnabled = options.header?.enabled !== false;
    const headerHeight = options.header?.height ?? 96;
    const headerTitle = (options.header?.title ?? options.includeHeader?.title ?? '');
    const headerSummary = options.header?.summary ?? options.includeHeader?.summary ?? '';
    const headerShowDivider = options.header?.showDivider ?? true;

    const footerShowPageNumber = options.footer?.showPageNumber ?? true;
    const footerWatermark = options.footer?.watermarkText ?? '';
    const footerNumberColor = options.footer?.numberColor ?? '#666666';
    const footerNumberFontSize = options.footer?.numberFontSize ?? 20;
    const footerWatermarkColor = options.footer?.watermarkColor ?? '#9ca3af';
    const footerWatermarkFontSize = options.footer?.watermarkFontSize ?? 18;
    const footerHeight = Math.max(
        footerShowPageNumber ? footerNumberFontSize + 10 : 0,
        footerWatermark ? footerWatermarkFontSize + 10 : 0,
        28
    );

    const [
        { default: html2canvas },
        { default: JSZip },
        fileSaverMod,
    ] = await Promise.all([
        import('html2canvas'),
        import('jszip'),
        import('file-saver'),
    ]);
    const saveAs: typeof import('file-saver').saveAs =
        (fileSaverMod as any).saveAs ?? (fileSaverMod as any).default;

    // 1) iframe 隔离
    const iframe = createIsolatedIframe(width);
    const idoc = iframe.contentDocument!;

    // 2) 先把 Markdown 转 HTML，再卡片化为“单元”
    const mdHtml = marked.parse(markdown ?? '') as string;

    const contentWidth = width - pageMargin.left - pageMargin.right;
    const baseCSS = buildBaseCSS({
        width,
        contentWidth,
        bg, fg, accent,
        fontSize, lineHeight,
        cardPad, cardRadius, cardShadow, cardBorder, cardGapY
    });

    // staging 容器仅用于测量和拆分
    writeIsolatedHTML(idoc, baseCSS, `<div class="xhs-stage xhs-hidden" id="staging"></div><div id="pages"></div>`);
    const staging = idoc.getElementById('staging') as HTMLElement;
    const pagesWrap = idoc.getElementById('pages') as HTMLElement;

    // 构建单元
    const units = buildUnitsFromMarkdown(idoc, mdHtml, contentWidth);

    // 把单位先放 staging（为了测量高度/拆表）
    for (const u of units) staging.appendChild(u);

    // 3) 分页装箱：不跨页，表格可按行拆
    const pages = packUnitsToPages(idoc, Array.from(staging.children) as unknown as HTMLElement[], {
        pageW: width,
        pageH: height,
        margin: pageMargin,
        header: { enabled: headerEnabled, height: headerHeight, title: headerTitle, summary: headerSummary, showDivider: headerShowDivider },
        footerH: footerHeight,
    });

    // 在每一页加 footer 内容（页码/水印）
    pages.forEach((p, idx) => {
        const footer = p.querySelector('.xhs-footer') as HTMLElement;
        if (!footer) return;
        footer.style.fontFamily = '"Noto Sans CJK SC","PingFang SC","Hiragino Sans","Segoe UI",Roboto,Helvetica,Arial,sans-serif';

        // 左：水印
        const left = idoc.createElement('div');
        left.textContent = footerWatermark;
        left.style.color = footerWatermarkColor;
        left.style.fontSize = `${footerWatermarkFontSize}px`;

        // 右：页码
        const right = idoc.createElement('div');
        right.style.color = footerNumberColor;
        right.style.fontSize = `${footerNumberFontSize}px`;
        right.textContent = footerShowPageNumber ? `${idx + 1} / ${pages.length}` : '';

        footer.appendChild(left);
        footer.appendChild(right);
    });

    // 将页面插入可见容器，供 html2canvas 渲染
    for (const p of pages) pagesWrap.appendChild(p);

    // 等一帧，等待布局/图片加载
    await new Promise((r) => setTimeout(r, 60));

    // 4) 逐页渲染
    const scale = 2;
    const blobs: Blob[] = [];
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        // 固定高度，防误差
        page.style.height = `${height}px`;

        // 单页转图片
        // eslint-disable-next-line no-await-in-loop
        const canvas = await html2canvas(page, {
            backgroundColor: bg,
            scale,
            useCORS: true,
            windowWidth: width,
        });

        // eslint-disable-next-line no-await-in-loop
        const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b as Blob), 'image/png', 1));
        blobs.push(blob);
    }

    // 5) 打包 ZIP
    const zip = new JSZip();
    blobs.forEach((blob, idx) => {
        zip.file(`page_${String(idx + 1).padStart(2, '0')}.png`, blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const fileName = `${(options.filePrefix ?? 'markdown_export').replace(/\s+/g, '_')}_${width}x${height}.zip`;
    saveAs(zipBlob, fileName);

    // 6) 清理
    document.body.removeChild(iframe);
}