# 夏目安安bot - Meme Generator

![何意味](https://raw.githubusercontent.com/zcanic/Natsume-AnAn-generator/main/public/images/natsumeanan-meme-1764747777082.png)

一个基于 Next.js 的在线 Meme 生成器，可以在模板图片上添加自定义文字并生成专属表情包。

## 功能特性

- 🎨 实时预览：Canvas 实时渲染文字效果
- 📝 丰富的文字设置：
  - 多种中英文字体选择
  - 自定义字号、行高、字间距
  - 文字颜色和粗细调整
  - 左对齐/居中/右对齐
- 🎯 精确的位置控制：
  - 行宽度调节
  - 水平/垂直偏移
  - 文字旋转（-180° 到 180°）
- 💾 一键下载高质量图片

## 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **组件**: Radix UI + Shadcn UI
- **绘图**: HTML5 Canvas API
- **图标**: Lucide React

## 本地运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 桌面端工具

本项目也包含一个基于 Electron 的桌面端版本，位于 `tool/` 目录下。

### 功能特性

- 🖥️ 独立桌面应用（Windows）
- ⌨️ 全局快捷键支持：`Ctrl+Shift+M`
- 📋 剪贴板集成：
  1. 复制任意文字
  2. 按下快捷键
  3. 自动读取剪贴板文字并生成 Meme
  4. 生成图片自动复制回剪贴板

### 构建桌面版

```bash
cd tool
npm install

# 开发模式
npm run electron-dev

# 构建 Windows 版本
npm run build
npx electron-builder --win dir
```

构建产物位于 `tool/dist/win-unpacked/` 目录。

## 项目结构

```
.
├── app/                 # Next.js App Router 页面
├── components/          # React 组件 (Shadcn UI)
├── hooks/               # React Hooks
├── lib/                 # 工具函数
├── public/              # 静态资源
└── tool/                # Electron 桌面版
    ├── app/             # 桌面版页面
    ├── public/          # 桌面版静态资源
    ├── main.js          # Electron 主进程
    └── preload.js       # Electron 预加载脚本
```

## License

MIT License - 详见 [LICENSE](LICENSE) 文件
