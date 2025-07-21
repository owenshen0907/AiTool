# LoadingIndicator 组件使用说明

本 **LoadingIndicator** 是一个基于 Lottie 动画、React 打字机效果与进度条模拟的通用加载指示器组件，支持「普通模式」与「滑块进度模式」。

---

## 目录结构

```plaintext
src/
└── components/
    └── LoadingIndicator/
        ├── animations/           # 存放所有 Lottie JSON 文件
        │   ├── catMarkloading.json        # 意图抽取动画
        │   ├── CuteBoyRunning.json        # 生成提示动画
        │   └── …
        ├── config.ts             # 场景配置：动画 + 行为参数
        ├── tips.ts               # 打字机提示列表
        └── LoadingIndicator.tsx  # 通用组件实现
```

---

## 快速上手

1. **安装依赖**（若尚未安装）：

   ```bash
   npm install lottie-react
   ```

2. **在需要的位置引入并渲染**：

   ```jsx
   import LoadingIndicator from '@/components/LoadingIndicator/LoadingIndicator';

   function MyComponent({ loading }) {
     return (
       <div className="relative">
         {loading && (
           <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
             {/* img_intent_extract / img_prompt_generate / 自定义场景 */}
             <LoadingIndicator scene="img_intent_extract" />
           </div>
         )}
         {/* 其余业务内容 */}
       </div>
     );
   }
   ```

    - **scene** 参数需与 `config.ts` 中的键保持一致。

---

## 场景配置（config.ts）

```typescript
export interface LoadingSceneConfig {
  animationData: any;             // Lottie JSON 数据
  tipList?: string[];             // 多条打字机提示（与 staticTip 互斥）
  staticTip?: string;             // 单条静态提示
  estimatedSeconds?: number;      // 进度条 / 滑块行程总时长（秒）
  size?: number;                  // Lottie 渲染宽高(px)
  speed?: number;                 // Lottie 播放速率倍数
  hoverSpeed?: number;            // 悬停时速率倍数
  typeSpeed?: number;             // 打字机每字符间隔(ms)
  pauseBetweenTips?: number;      // 打完一条提示停顿(ms)
  showProgress?: boolean;         // 是否显示进度条
  showText?: boolean;             // 是否显示提示文字
  containerPadding?: number;      // 外层 padding(px)
  alignment?: 'center' | 'left' | 'right'; // 对齐方式（普通模式）
  slideDirection?: 'none' | 'ltr' | 'rtl'; // 滑块方向
}

export const loadingConfig: Record<string, LoadingSceneConfig> = {
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
    slideDirection: 'none'
  },
  img_prompt_generate: {
    animationData: promptGenerateAnim,
    estimatedSeconds: 15,
    size: 58,
    speed: 1,
    hoverSpeed: 1.6,
    showProgress: false,
    showText: true,
    containerPadding: 0,
    alignment: 'center',
    slideDirection: 'ltr' // 启用滑块模式
  }
};
```

---

## 父级容器推荐最小尺寸

| 模式 | 建议最小宽 × 高 | 说明 |
| --- | --- | --- |
| **滑块模式** (`slideDirection ≠ 'none'`) | 宽 ≥ `size × 3`<br>高 = `size` | 例如 `size = 60` ➜ ≥ `180 × 60 px`。轨道与滑块同高，需足够宽度让滑块平滑移动。 |
| **普通模式**（含进度条、不含文字） | `size × (size + 12)` | 进度条高度约 `8 px`，上下各留 `2 px` 间距。 |
| **普通模式 + 文字** | `size × (size + 12 + 24)` | 文字区固定 `1.5 rem ≈ 24 px`，避免打字机抖动。 |

### 示例（典型 size）：

| size | 滑块模式最小宽度 | 普通+进度 | 普通+进度+文字 |
| --- | --- | --- | --- |
| 58 | 174 × 58 px | 58 × 70 px | 58 × 94 px |
| 140 | 420 × 140 px | 140 × 152 px | 140 × 176 px |
| 160 | 480 × 160 px | 160 × 172 px | 160 × 196 px |

**提示**：若父级容器尺寸超出以上建议，组件会自动居中/对齐；若不足，则文字或进度条可能被裁切。

---

## 打字机提示列表（tips.ts）

```typescript
export const INTENT_TIPS: string[] = [
  '提示：加入 1~2 个例句…',
  '提示：标注“想对比 A 和 B”…',
  // …更多
];
```

---

## 添加新场景

1. **将动画 JSON 放入 `animations/`**。
2. **在 `config.ts` 里新增配置键**：

   ```typescript
   my_scene: {
     animationData: myAnim,
     staticTip: '自定义加载…',
     estimatedSeconds: 5,
     size: 120,
     showProgress: false,
     slideDirection: 'none'
   }
   ```

3. **在代码中使用**：

   ```jsx
   <LoadingIndicator scene="my_scene" />
   ```

---

## 样式 & 交互要点

- **如果启用 `showText`**，组件会预留固定高度 `1.5 rem`，保障文字替换时不跳动。
- **悬停时**可通过 `hoverSpeed` 加速 Lottie，增强体验。
- **在滑块模式下**，进度条由纯 CSS 动画驱动，不卡顿，滑块不会越界。

这样即可统一管理、多场景复用 Loading 动画。