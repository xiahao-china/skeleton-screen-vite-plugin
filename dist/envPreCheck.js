"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = void 0;
exports.checkChromeAndInstall = checkChromeAndInstall;
const fs_1 = __importDefault(require("fs"));
const browsers_1 = require("@puppeteer/browsers");
const puppeteer_1 = require("puppeteer");
const throttle = (cb, wait = 3000) => {
    let previous = 0;
    return (...args) => {
        const now = +new Date();
        if (now - previous > wait) {
            previous = now;
            cb.apply(this, args);
        }
    };
};
exports.throttle = throttle;
function logDownloadProgress(downloadedBytes, totalBytes) {
    const progress = Math.round(downloadedBytes / totalBytes * 100);
    console.log(`Chrome download progress: ${progress}% ${(downloadedBytes / 1024 / 1024).toFixed(2)}M ${(totalBytes / 1024 / 1024).toFixed(2)}M`);
}
function ensureChromeInstalled() {
    return __awaiter(this, void 0, void 0, function* () {
        // puppeteer 默认下载缓存目录
        const cacheDir = process.env.PUPPETEER_CACHE_DIR ||
            require('os').homedir() + '/.cache/puppeteer';
        const browser = 'chrome';
        const platform = 'win64';
        const buildId = '121.0.6167.85'; // 你的插件报错里要求的版本
        // 目标路径
        // @ts-ignore
        const executablePath = (0, browsers_1.computeExecutablePath)({ cacheDir, browser, buildId });
        if (!process.platform) {
            console.error('platform not supported');
            return;
        }
        if (!require('fs').existsSync(executablePath)) {
            console.log('[vite-plugin-skeleton-screen] Start install Chrome...');
            const throttledLog = (0, exports.throttle)(logDownloadProgress, 1000);
            // @ts-ignore
            yield (0, browsers_1.install)({
                cacheDir,
                browser,
                buildId,
                platform,
                unpack: true,
                downloadProgressCallback: throttledLog
            });
        }
    });
}
function checkChromeAndInstall() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const chromePath = (0, puppeteer_1.executablePath)();
            if (!fs_1.default.existsSync(chromePath)) {
                console.log('[vite-plugin-skeleton-screen] Chrome not found, installing...');
                yield ensureChromeInstalled();
            }
        }
        catch (e) {
            console.log('[vite-plugin-skeleton-screen] Failed to detect Chrome, ready install Chrome...', e);
            yield ensureChromeInstalled();
        }
    });
}
