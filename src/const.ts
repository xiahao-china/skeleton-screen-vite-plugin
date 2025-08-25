// 定义插件选项类型
import {launch} from "puppeteer";

export interface SkeletonScreenOptions {
    routes: string[];
    delay?: number;
    puppeteerOptions?: Parameters<typeof launch>[0];
    routerPath?: string;
    outputPath?: string;
    skeletonClass?: string;
}
// 默认选项
export const defaultOptions: SkeletonScreenOptions = {
    routes: [],
    delay: 2000,
    puppeteerOptions: {},
    routerPath: 'src/router/index.ts',
    skeletonClass: 'skeleton-screen'
};

export const DEFAULT_PORT = 5002;
