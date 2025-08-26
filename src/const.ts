// 定义插件选项类型
import {launch} from "puppeteer";

export interface ISkeletonScreenDeep{
    [routerPath: string]: number;
}

export interface SkeletonScreenOptions {
    routes: string[];
    elDeep?: ISkeletonScreenDeep | number; // 绘制深度
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
    elDeep: 7,
    puppeteerOptions: {},
    outputPath: 'assets',
    routerPath: 'src/router/index.ts',
    skeletonClass: 'skeleton-screen'
};

export const DEFAULT_PORT = 5002;


