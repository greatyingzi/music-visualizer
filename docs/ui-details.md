# 🎵 Music Visualizer Player - UI/UX Details

## 1. 界面线框图（Wireframe）

### 1.1 桌面端布局（1200px+）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎵 MusicViz                  [URL: https://youtube.com/watch?v=____] [▶ Load] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                       ││
│  │                    [ YouTube iframe - 16:9 ]                          ││
│  │                                                                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                       ││
│  │                                                                       ││
│  │                    [ Canvas Visualization ]                           ││
│  │                                                                       ││
│  │                                                                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Bars ●] [Wave ○] [Circle ◎] [Particles ★]  │  Sensitivity: [████░░]  │ [🎨] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 移动端布局（<600px）

```
┌──────────────────────────┐
│ 🎵 MusicViz      [☰ Menu]│
├──────────────────────────┤
│                         │
│   [iframe - 100% width] │
│                         │
├──────────────────────────┤
│                         │
│   [Canvas - 50vh height]│
│                         │
├──────────────────────────┤
│ [Bars] [Wave] [Circle]  │
│ [Particles] [🎨 Theme]  │
└──────────────────────────┘
```

---

## 2. 组件详细设计

### 2.1 Header 组件

**元素组成：**
- Logo：🎵 图标 + "MusicViz" 文字（渐变色）
- URL 输入框：placeholder="Paste YouTube or Bilibili URL..."
- Load 按钮：实心 accent 色，hover 有上浮效果
- 平台选择：下拉菜单（YouTube / Bilibili / Auto Detect）

**样式规格：**
```css
height: 56px
background: var(--bg-card)
border-bottom: 1px solid var(--border)
padding: 0 20px
```

**交互行为：**
- 粘贴 URL 后按 Enter 或点击 Load 按钮加载视频
- 自动检测 URL 类型（youtube.com → YouTube, bilibili.com → Bilibili）
- 加载失败时显示错误提示（toast 通知）

---

### 2.2 iframe 播放器组件

**容器样式：**
```css
aspect-ratio: 16/9
max-height: 400px
border-radius: 12px
overflow: hidden
border: 1px solid var(--border)
background: #000
```

**iframe 属性：**
- YouTube: `https://www.youtube.com/embed/{VIDEO_ID}?enablejsapi=1&autoplay=0`
- Bilibili: `https://player.bilibili.com/player.html?bvid={BV_ID}&autoplay=0`

**通信协议：**

YouTube（通过 postMessage）：
```javascript
// 发送命令
player.postMessage(JSON.stringify({
  event: 'command',
  func: 'playVideo',
  args: ''
}), '*');

// 接收事件
window.addEventListener('message', (e) => {
  if (e.data.event === 'ready') onPlayerReady();
  if (e.data.event === 'stateChange') onStateChange(e.data.info);
  if (e.data.event === 'ping') onTimeUpdate(e.data.info);
});
```

Bilibili（通过 iframe API）：
```javascript
// Bilibili player API（通过 window.FLashPlayer 或 postMessage）
const player = document.getElementById('biliPlayer').contentWindow;
player.postMessage({method: 'play'}, '*');
```

---

### 2.3 Canvas 可视化组件

**容器样式：**
```css
flex: 1
min-height: 300px
position: relative
background: var(--bg-dark)
```

**Canvas 规格：**
- 宽度 = 容器宽度
- 高度 = 容器高度
- 像素比 = devicePixelRatio（Retina 屏幕适配）

**渲染管线：**
```
[Virtual Spectrum Data] → [Visualizer Effect] → [Canvas 2D Context]
         ↑                        ↑
    [Synth Engine]           [Theme Colors]
```

---

### 2.4 控制栏组件

**布局：**
```
┌────────────────────────────────────────────────────────────────┐
│  [Bars ●] [Wave ○] [Circle ◎] [Particles ★]  │  [🎨] [🔊] [⛶] │
└────────────────────────────────────────────────────────────────┘
```

**元素说明：**
- 效果切换按钮：4 个 pill 按钮，选中态有 accent 色边框
- 灵敏度滑块：水平 range input，范围 0-100，默认 50
- 主题色按钮：点击弹出主题选择面板
- 全屏按钮：最大化 Canvas 区域

**样式规格：**
```css
height: 48px
background: var(--bg-card)
border-top: 1px solid var(--border)
display: flex
align-items: center
justify-content: space-between
padding: 0 20px
gap: 12px
```

---

## 3. 主题色面板（Modal）

**触发方式：** 点击控制栏的 🎨 按钮

**面板内容：**
```
┌─────────────────────────────────────┐
│  Choose Theme                      │ [×]
├─────────────────────────────────────┤
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ 🟣  │ │ 🟠  │ │ 🔵  │ │ 🟢  │  │
│  │霓虹紫│ │火焰橙│ │海洋蓝│ │极光绿│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  Custom: [Color Picker] [Accent]   │
│                                     │
└─────────────────────────────────────┘
```

**交互行为：**
- 点击主题卡片应用该主题
- 自定义模式下可选择主色和辅助色
- 主题切换时平滑过渡（CSS transition）

---

## 4. Toast 通知系统

**用途：** 显示加载状态、错误提示、成功消息

**样式：**
```css
position: fixed
bottom: 80px
right: 20px
background: var(--bg-card)
border: 1px solid var(--border)
border-radius: 8px
padding: 12px 20px
box-shadow: 0 4px 20px rgba(0,0,0,0.3)
animation: slideIn 0.3s ease
```

**类型：**
- 成功：绿色边框 + ✓ 图标
- 错误：红色边框 + ✗ 图标
- 信息：蓝色边框 + ℹ 图标

**生命周期：**
- 出现：3 秒后自动消失
- 可手动关闭（点击 × 按钮）
- 最多同时显示 3 个 toast

---

## 5. 加载状态指示器

**场景：** iframe 加载中、视频缓冲中

**样式：**
```
┌─────────────────────────────────────┐
│                                     │
│         ⏳ Loading...               │
│         [Progress Bar]              │
│                                     │
└─────────────────────────────────────┘
```

**行为：**
- iframe 加载时显示骨架屏
- 视频缓冲时显示旋转动画
- 加载完成后淡出

---

## 6. 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Space | 播放/暂停 |
| 1-4 | 切换可视化效果（1=Bars, 2=Wave, 3=Circle, 4=Particles） |
| T | 打开主题选择面板 |
| F | 全屏模式 |
| ←/→ | 灵敏度调节（-5/+5） |

---

## 7. 动画与过渡

**全局过渡时长：** 0.2s ease

**具体动画：**
- 效果切换：旧效果淡出 + 新效果淡入（交叉淡化 0.3s）
- 主题切换：颜色平滑过渡（CSS transition）
- Toast 通知：从右侧滑入（translateX 100% → 0）
- 模态框：scale(0.9) → scale(1) + opacity 0 → 1

---

## 8. 无障碍访问（Accessibility）

- 所有按钮有 aria-label 属性
- 颜色对比度符合 WCAG AA 标准
- 键盘导航支持（Tab 键遍历所有交互元素）
- 屏幕阅读器兼容（语义化 HTML 标签）

---

## 9. 错误处理

**场景：**
1. URL 无效 → Toast 提示"Invalid URL"
2. iframe 加载失败 → 显示重试按钮
3. Web Audio API 不支持 → 降级为静态频谱数据
4. Canvas 不支持 → 显示 fallback 图片

**降级策略：**
- 无 iframe 通信 → 使用本地计时器模拟播放状态
- 无 Web Audio → 使用预生成的频谱数据数组
- 无 Canvas → 显示 CSS 动画替代方案
