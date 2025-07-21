// File: src/components/LoadingIndicator/LoadingIndicator.tsx
'use client';

import React, {
    useState,
    useEffect,
    useLayoutEffect,
    useRef,
    useCallback
} from 'react';
import Lottie from 'lottie-react';
import { loadingConfig, LoadingSceneConfig } from './config';

interface LoadingIndicatorProps {
    /** 场景 key，对应 config.ts 中的 entry */
    scene: string;
}

export default function LoadingIndicator({ scene }: LoadingIndicatorProps) {
    // ---------- 读取配置 ----------
    const cfg: LoadingSceneConfig | undefined = loadingConfig[scene];
    if (!cfg) {
        console.warn(`LoadingIndicator: 未配置场景 ${scene}`);
        return null;
    }

    const {
        animationData,
        tipList,
        staticTip,
        /* 进度相关 */
        estimatedSeconds = 6,
        /* 尺寸 & 速度 */
        size = 160,
        speed = 1,
        /* 打字机 */
        typeSpeed = 28,
        pauseBetweenTips = 1600,
        /* 展示开关 */
        showProgress = true,
        showText = true,
        containerPadding = 0,
        alignment = 'center', // center | left | right
        slideDirection = 'none' // 'none' | 'ltr' | 'rtl'
    } = cfg;

    // ---------- 通用状态 ----------
    const [progress, setProgress] = useState(0);
    const [hovering, setHovering] = useState(false);

    // ---------- 打字机 ----------
    const [tipIndex, setTipIndex] = useState(0);
    const [typed, setTyped] = useState('');
    const [pausedTyping, setPausedTyping] = useState(false);
    const typingRef = useRef<number | null>(null);

    // ---------- 滑块模式专用 ----------
    const containerRef = useRef<HTMLDivElement>(null);
    const [distance, setDistance] = useState<number | null>(null); // 滑动距离

    // ---------- Lottie 引用 ----------
    const lottieRef = useRef<any>(null);

    /* 设置 Lottie 播放速率 */
    useEffect(() => {
        lottieRef.current?.setSpeed(speed);
    }, [speed]);

    /* 计算滑动距离（仅当 slideDirection ≠ 'none'） */
    useLayoutEffect(() => {
        if (slideDirection === 'none') return;

        const w = containerRef.current?.offsetWidth ?? 0;
        setDistance(Math.max(0, w - size));
    }, [slideDirection, size]);

    /* 进度推进（0 → 1） */
    useEffect(() => {
        const start = performance.now();
        const duration = estimatedSeconds * 1000;

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // ease-out
            const eased = 1 - Math.pow(1 - t, 3);
            setProgress(eased);
            if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [estimatedSeconds, slideDirection]);

    /* 打字机 */
    const startTyping = useCallback(() => {
        if (!showText || !tipList) return;
        clearTimeout(typingRef.current!);
        setTyped('');
        const full = tipList[tipIndex % tipList.length];
        let i = 0;

        const step = () => {
            setTyped(full.slice(0, i));
            if (i < full.length) {
                i++;
                typingRef.current = window.setTimeout(step, typeSpeed);
            } else {
                typingRef.current = window.setTimeout(
                    () => setTipIndex((idx) => idx + 1),
                    pauseBetweenTips
                );
            }
        };
        step();
    }, [tipIndex, tipList, typeSpeed, pauseBetweenTips, showText]);

    useEffect(() => {
        if (tipList) startTyping();
        return () => {
            clearTimeout(typingRef.current!);
        };
    }, [tipList, tipIndex, startTyping]);

    /* 悬停暂停 / 恢复打字机 */
    useEffect(() => {
        if (hovering) {
            clearTimeout(typingRef.current!);
            setPausedTyping(true);
        } else if (pausedTyping) {
            setPausedTyping(false);
            startTyping();
        }
    }, [hovering, pausedTyping, startTyping]);

    const fullTip = tipList ? tipList[tipIndex % tipList.length] : '';
    const displayText = staticTip ?? (tipList ? typed || fullTip : '');

    /* 对齐映射 */
    const alignCls = {
        center: 'items-center',
        left: 'items-start',
        right: 'items-end'
    }[alignment] as string;

    // ===================================================================
    // 滑块模式：slideDirection = 'ltr' | 'rtl'
    // ===================================================================
    if (slideDirection !== 'none') {
        // 距离尚未计算好，渲染占位
        if (distance === null)
            return (
                <div
                    ref={containerRef}
                    className="relative w-full"
                    style={{ padding: containerPadding, height: size }}
                />
            );

        const fillKey = `fill_${scene}`;
        const knobKey = `knob_${scene}`;
        const dur = estimatedSeconds;

        // 右向滑动时终点是 distance，左向滑动可以反转
        const fromX = slideDirection === 'rtl' ? distance : 0;
        const toX = slideDirection === 'rtl' ? 0 : distance;
        const fillFrom = slideDirection === 'rtl' ? '100%' : '0%';
        const fillTo = slideDirection === 'rtl' ? '0%' : '100%';

        return (
            <div
                ref={containerRef}
                className={`relative w-full overflow-hidden flex ${alignCls}`}
                style={{ padding: containerPadding, height: size }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                {/* 轨道填充 */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-pink-400 to-purple-400"
                    style={{
                        animation: `${fillKey} ${dur}s linear forwards`
                    }}
                />
                {/* 滑块 Lottie */}
                <div
                    className="absolute top-0"
                    style={{
                        width: size,
                        height: size,
                        animation: `${knobKey} ${dur}s linear forwards`
                    }}
                >
                    <Lottie
                        animationData={animationData}
                        loop
                        lottieRef={lottieRef}
                        style={{ width: size, height: size }}
                    />
                </div>

                {/* 动态 keyframes 注入 */}
                <style jsx>{`
          @keyframes ${fillKey} {
            from {
              width: ${fillFrom};
            }
            to {
              width: ${fillTo};
            }
          }
          @keyframes ${knobKey} {
            from {
              transform: translateX(${fromX}px);
            }
            to {
              transform: translateX(${toX}px);
            }
          }
        `}</style>
            </div>
        );
    }

    // ===================================================================
    // 默认模式：Lottie + 进度条 + 可选打字机
    // ===================================================================
    return (
        <div
            className={`flex flex-col ${alignCls} select-none`}
            style={{ padding: containerPadding }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* Lottie 动画 */}
            <div style={{ width: size, height: size }}>
                <Lottie
                    animationData={animationData}
                    loop
                    lottieRef={lottieRef}
                    style={{ width: size, height: size }}
                />
            </div>

            {/* 进度条 */}
            {showProgress && (
                <div className="w-full mt-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-[width] ease-out duration-200"
                            style={{ width: `${Math.round(progress * 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 提示文字 */}
            {showText && (
                <div
                    className="mt-2 overflow-hidden flex items-center justify-center"
                    style={{ height: '1.5rem' }}
                >
                    <div
                        key={tipIndex}
                        className="text-sm text-gray-600 transition-opacity duration-300"
                    >
                        {displayText}
                    </div>
                </div>
            )}
        </div>
    );
}