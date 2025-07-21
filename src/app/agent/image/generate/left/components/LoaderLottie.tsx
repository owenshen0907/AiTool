'use client';
import React, { useRef, useEffect } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';

interface LoaderLottieProps {
    json: any;
    text?: string;
    size?: number;
    speed?: number;
    className?: string;
    hoverSpeed?: number;
}

export default function LoaderLottie({
                                         json,
                                         text = '加载中...',
                                         size = 120,
                                         speed = 1,
                                         hoverSpeed = 1.6,
                                         className = ''
                                     }: LoaderLottieProps) {
    const ref = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        ref.current?.setSpeed(speed);
    }, [speed]);

    return (
        <div
            className={`flex flex-col items-center justify-center select-none ${className}`}
            onMouseEnter={() => ref.current?.setSpeed(hoverSpeed)}
            onMouseLeave={() => ref.current?.setSpeed(speed)}
        >
            <Lottie
                lottieRef={ref}
                animationData={json}
                loop
                style={{ width: size, height: size }}
            />
            {text && (
                <p className="mt-2 text-xs text-pink-600 font-medium tracking-wide animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
}