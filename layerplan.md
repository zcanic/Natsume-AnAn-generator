# Meme Generator 图层功能革新计划 (Layer Refactor Plan)

## 1. 目标概述

本计划旨在对 "夏目安安bot - Meme Generator" 进行核心架构升级，从单一的模版文字生成器转变为支持多图层、自定义素材的轻量级图片编辑器。核心变更包括：
- **自定义底图**：不再局限于单一模板。
- **图层系统**：支持无限添加文字图层和图片图层。
- **所见即所得交互**：支持对图层元素进行拖拽移动、缩放和旋转。
- **保持现有特性**：完全保留原有的文字排版、自动字号适配等高级文字控制功能。

## 2. 核心架构设计

### 2.1 数据结构重构

当前状态分散在 `page.tsx` 的多个独立 state 中。新架构将通过 `useReducer` 或 Context 集中管理。

#### 图层接口定义

```typescript
type LayerType = 'text' | 'image';

interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;          // 画布坐标 x
  y: number;          // 画布坐标 y
  width: number;      // 宽度 (px)
  height: number;     // 高度 (px)
  rotation: number;   // 旋转角度
  scale: number;      // 缩放比例
  zIndex: number;     // 层级
  visible: boolean;   // 是否可见
  locked: boolean;    // 是否锁定
}

interface TextLayer extends BaseLayer {
  type: 'text';
  content: string;
  fontFamily: string;
  fontSize: number;   // 基础字号
  fontWeight: 'normal' | 'bold';
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  maxWidth: number;     // 换行宽度限制
  autoFit: boolean;     // 是否自动适配字号
  // ...以及其他特有属性
}

interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;        // 图片源 (URL/Base64)
  opacity: number;    // 透明度
}

interface CanvasState {
  size: { width: number; height: number };
  background: ImageLayer | null; // 底图特殊处理，或者作为最底层图层
  layers: (TextLayer | ImageLayer)[];
  selectedLayerId: string | null;
}
```

### 2.2 渲染管线 (Render Pipeline)

从单一的 `drawCanvas` 函数重构为基于图层列表的渲染循环：

1.  **清空画布**。
2.  **绘制背景**：绘制自定义底图或默认白色/透明背景。
3.  **图层排序**：根据 `zIndex` 对 `layers` 排序。
4.  **循环绘制**：
    *   `ctx.save()`
    *   应用变换 (Translate -> Rotate -> Scale)
    *   根据 `type` 调用 `drawText()` 或 `drawImage()`
    *   `ctx.restore()`
5.  **绘制辅助线/控制柄 (仅在编辑器模式)**：
    *   如果在 Web 页面上操作，建议使用 HTML DOM 覆盖在 Canvas 上方作为“交互层”，或者直接在 Canvas 上绘制选中框（Selection Box）。
    *   *方案选择*：为了性能和实现简便，采用 Canvas 绘制内容 + HTML/SVG 覆盖层处理交互手柄（Resizer/Rotator）。这样可以避免在 Canvas 内部处理复杂的鼠标事件点击判定。

## 3. Web 端实施计划

### 3.1 界面重组 (UI Layout)

将页面分为三个主要区域：

*   **左侧：图层面板 & 素材库**
    *   **图层列表**：显示所有图层，支持拖拽排序（React-DND 或简单按钮上移下移）、隐藏/显示、删除。
    *   **添加按钮**：[+ 文字] [+ 图片] [+ 更换底图]。
*   **中间：画布预览区**
    *   显示 Canvas。
    *   叠加交互层（Overlay）：用于显示选中框、缩放手柄、旋转手柄。
    *   支持鼠标滚轮缩放画布视图（View Zoom），而不改变实际图片大小。
*   **右侧：属性面板**
    *   根据 `selectedLayerId` 动态渲染。
    *   若选中文字图层：显示现有的文字控制器（字号、颜色、字体等）。
    *   若选中图片图层：显示透明度、滤镜（可选）、重置变换等。
    *   若未选中：显示全局画布设置（尺寸、背景色）。

### 3.2 交互逻辑

*   **点击选择**：在 Overlay 层监听点击事件，计算坐标命中哪个图层。
*   **拖拽移动**：监听 pointer down/move/up，更新选中图层的 x, y。
*   **变换控制**：在选中框四角显示控制点，拖拽控制点更新 width/height/scale/rotation。

### 3.3 图片处理

*   **图片上传**：支持从本地选择图片，转换为 Object URL 或 Base64 存储。
*   **底图模式**：底图也是一种特殊的 ImageLayer，通常锁定位置和大小，且始终位于最底层（zIndex = 0）。

## 4. 桌面端 (Electron) 适配计划

### 4.1 菜单与快捷键

*   **新增快捷键**：
    *   `Ctrl+V` (Web/Electron通用)：侦听粘贴事件。如果有图片数据，自动作为新 ImageLayer 插入；如果有文本，作为新 TextLayer 插在中心。
    *   `Del`/`Backspace`：删除选中图层。
    *   `Ctrl+Z`/`Ctrl+Y`：撤销/重做（如时间允许，基于状态快照实现）。

### 4.2 文件系统集成

*   **保存工程**：支持将当前 CanvasState 保存为 `.json` 文件，以便再次编辑。
*   **导出**：现有的 PNG 导出逻辑只需适配新的渲染函数即可。

### 4.3 剪贴板增强

*   现有的全局快捷键 `Ctrl+Shift+M` 逻辑保持不变：
    *   读取剪贴板文字 -> 创建一个默认的 TextLayer -> 渲染 -> 复制结果。
    *   *改进*：如果剪贴板里是图片，则作为底图或新图层插入，不立即生成，而是让用户编辑。

## 5. 开发步骤分解

1.  **Phase 1: 基础设施搭建 (Web)**
    *   建立 `LayerContext` 和 `useLayerReducer`。
    *   定义图层数据类型。
    *   重构 `page.tsx`，剥离现有逻辑到新的 State Management 中。

2.  **Phase 2: 渲染引擎重构**
    *   修改 `drawCanvas` 以支持遍历图层数组。
    *   实现 `drawTextLayer` (复用原有文字逻辑) 和 `drawImageLayer`。
    *   验证现有功能（文字自动适配等）在图层模式下是否正常。

3.  **Phase 3: 交互层实现**
    *   实现 Canvas 上的交互覆盖层 (Selection Overlay)。
    *   实现拖拽移动 (Drag & Drop)。
    *   实现缩放和旋转 (Transform)。

4.  **Phase 4: 图层管理 UI**
    *   开发左侧图层列表组件。
    *   开发图片上传/插入功能。
    *   适配右侧属性面板，使其响应选中状态。

5.  **Phase 5: 桌面端集成与优化**
    *   测试 Electron 环境下的图片粘贴。
    *   优化性能（避免频繁重绘）。

## 6. 注意事项

*   **兼容性**：确保旧版本逻辑（如果有保存的数据）能迁移，或者直接视为全新版本。
*   **性能**：图片图层过多可能导致 Canvas 绘制变慢，需注意 `drawImage` 的性能，必要时使用离屏 Canvas 缓存静态图层。
*   **字体加载**：文字图层使用的字体需确保已加载完成再绘制，否则可能出现闪动。
