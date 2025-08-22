import type { Plugin } from 'vite';
import type { LaunchOptions } from 'puppeteer';

interface SkeletonScreenOptions {
  /**
   * 需要生成骨架屏的路由数组
   * @default []
   */
  routes?: string[];

  /**
   * 页面加载延迟时间(毫秒)
   * @default 2000
   */
  delay?: number;

  /**
   * Puppeteer启动选项
   * @default {}
   */
  puppeteerOptions?: LaunchOptions;

  /**
   * Vue Router配置文件路径
   * @default 'src/router/index.ts'
   */
  routerPath?: string;

  /**
   * 骨架屏元素的CSS类名
   * @default 'skeleton-screen'
   */
  skeletonClass?: string;

  /**
   * 输出目录
   * @default 'dist'
   */
  outputPath?: string;
}

/**
 * Vite骨架屏插件
 * @param options 插件配置选项
 * @returns Vite插件对象
 */
declare function skeletonScreenPlugin(options?: Partial<SkeletonScreenOptions>): Plugin;

export default skeletonScreenPlugin;