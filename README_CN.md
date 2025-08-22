# vite-plugin-skeleton-screen

一个为Vue 3应用自动生成骨架屏的Vite插件，通过捕获Vue Router路由页面结构来生成骨架屏。

## 功能特点
- 自动读取Vue Router配置
- 使用Puppeteer为每个路由生成骨架屏
- 将base64编码的骨架屏图片注入到index.html
- 支持hash和history两种路由模式
- 根据当前路由显示相应的骨架屏

## 安装

```bash
npm install vite-plugin-skeleton-screen --save-dev
# 或
yarn add vite-plugin-skeleton-screen -D
```

## 使用方法

1. 在`vite.config.ts`中添加插件：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import skeletonScreenPlugin from 'vite-plugin-skeleton-screen';

export default defineConfig({
  plugins: [
    vue(),
    skeletonScreenPlugin({
      // 可选配置
      routes: ['/', '/about', '/contact'], // 手动指定路由或让插件自动检测
      delay: 3000, // 捕获页面前的延迟时间(毫秒)
      puppeteerOptions: {}, // 自定义Puppeteer启动选项
      routerPath: 'src/router/index.ts', // Vue Router配置文件路径
    })
  ]
});
```

2. 运行构建命令：

```bash
npm run build
```

插件将在构建过程中自动生成骨架屏并注入到`dist/index.html`文件中。

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|---------|------|
| routes | string[] | [] | 要生成骨架屏的路由数组。如果为空，将从Vue Router自动检测。 |
| delay | number | 2000 | 捕获页面前的延迟时间(毫秒)，确保页面正确渲染。 |
| puppeteerOptions | PuppeteerLaunchOptions | {} | Puppeteer的自定义启动选项。 |
| routerPath | string | 'src/router/index.ts' | Vue Router配置文件路径。 |
| skeletonClass | string | 'skeleton-screen' | 骨架屏元素的CSS类名。 |
| outputPath | string | 'dist' | 输出目录，index.html所在位置。 |

## 工作原理

1. Vite构建完成后，插件读取Vue Router配置
2. 使用Puppeteer启动无头Chromium实例
3. 为每个路由捕获页面结构并生成骨架屏
4. 将骨架屏转换为base64编码的图片
5. 将这些图片注入到index.html文件中
6. 应用加载时，根据当前路由显示相应的骨架屏

## 注意事项

- 插件需要应用中正确配置Vue Router
- 安装过程中Puppeteer会下载Chromium（可能需要一些时间）
- 生产环境使用时，如果使用history模式路由，请确保服务器正确配置
- 骨架屏仅在构建过程中生成，开发模式下不生成

## 许可证

MIT