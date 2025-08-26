"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PORT = exports.defaultOptions = void 0;
// 默认选项
exports.defaultOptions = {
    routes: [],
    delay: 2000,
    elDeep: 7,
    puppeteerOptions: {},
    outputPath: 'assets',
    routerPath: 'src/router/index.ts',
    skeletonClass: 'skeleton-screen'
};
exports.DEFAULT_PORT = 5002;
