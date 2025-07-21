// File: src/components/LoadingIndicator/config.ts

import intentExtractAnim from './animations/catMarkloading.json';
import promptGenerateAnim from './animations/CuteBoyRunning.json';
import { INTENT_TIPS } from './tips';

/**
 * LoadingSceneConfig 说明
 * -------------------------------------------------------------
 * animationData      : Lottie JSON 数据
 * tipList            : 打字机循环提示。与 staticTip 互斥，优先生效
 * staticTip          : 固定提示文本（不需要打字机时使用）
 * estimatedSeconds   : 动画/进度条 0→100% 所用秒数
 * size               : Lottie 渲染区域（宽=高）
 * speed              : Lottie 播放速度倍数（1 = 原速）
 * hoverSpeed         : 鼠标悬停时的播放速度倍数（组件内部可选实现）
 * typeSpeed          : 打字机每个字符间隔(ms)
 * pauseBetweenTips   : 打完一条提示后停顿(ms)
 * showProgress       : 是否显示进度条
 * showText           : 是否显示提示文字（staticTip / tipList）
 * containerPadding   : 最外层容器 padding(px)
 * alignment          : 在普通模式下，整体水平对齐方式
 * slideDirection     : 滑块模式方向
 *                      'none'  : 使用普通模式 (Lottie + 进度条)
 *                      'ltr'   : Lottie 作为滑块从左向右移动
 *                      'rtl'   : Lottie 作为滑块从右向左移动
 * -------------------------------------------------------------
 */
export interface LoadingSceneConfig {
    animationData: any;
    tipList?: string[];
    staticTip?: string;
    estimatedSeconds?: number;
    size?: number;
    speed?: number;
    hoverSpeed?: number;
    typeSpeed?: number;
    pauseBetweenTips?: number;
    showProgress?: boolean;
    showText?: boolean;
    containerPadding?: number;
    alignment?: 'center' | 'left' | 'right';
    slideDirection?: 'none' | 'ltr' | 'rtl';
}

export const loadingConfig: Record<string, LoadingSceneConfig> = {
    /**
     * 场景：img_intent_extract —— 意图抽取
     */
    img_intent_extract: {
        animationData: intentExtractAnim,
        tipList: INTENT_TIPS,
        estimatedSeconds: 20,
        size: 140,
        speed: 0.9,
        hoverSpeed: 1.5,
        typeSpeed: 60,
        pauseBetweenTips: 2200,
        showProgress: true,
        showText: true,
        containerPadding: 0,
        alignment: 'center',
        slideDirection: 'none' // 使用普通模式
    },

    /**
     * 场景：img_prompt_generate —— 生成插画提示
     */
    img_prompt_generate: {
        animationData: promptGenerateAnim,
        // 不需要打字机；静态提示可在组件外给出；如需提示可加 staticTip
        estimatedSeconds: 15,
        size: 58,
        speed: 1,
        hoverSpeed: 1.6,
        typeSpeed: 28,
        pauseBetweenTips: 1600,
        showProgress: false,    // 隐藏进度条
        showText: true,         // 若需要可改为 false
        containerPadding: 0,
        alignment: 'center',
        slideDirection: 'ltr'   // 启用滑块模式，从左滑到右
    }
};