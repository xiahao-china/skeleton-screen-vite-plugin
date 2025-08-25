import { execSync } from 'child_process';
import fs from 'fs';
import { install, computeExecutablePath } from '@puppeteer/browsers';
import {executablePath} from "puppeteer";

export const throttle = (cb: Function, wait = 3000) =>{
    let previous = 0;
    return (...args: any[]) => {
        const now = +new Date();
        if( now - previous > wait ){
            previous = now;
            cb.apply(this, args);
        }
    }
}

function logDownloadProgress(downloadedBytes: number, totalBytes: number) {
    const progress = Math.round(downloadedBytes / totalBytes * 100);
    console.log(`Chrome download progress: ${progress}% ${(downloadedBytes/1024/1024).toFixed(2)}M ${(totalBytes/1024/1024).toFixed(2)}M`);
}

async function ensureChromeInstalled() {
    // puppeteer 默认下载缓存目录
    const cacheDir = process.env.PUPPETEER_CACHE_DIR ||
        require('os').homedir() + '/.cache/puppeteer';
    const browser = 'chrome';
    const platform = 'win64';
    const buildId = '121.0.6167.85'; // 你的插件报错里要求的版本

    // 目标路径
    // @ts-ignore
    const executablePath = computeExecutablePath({cacheDir, browser, buildId});

    if (!process.platform) {
        console.error('platform not supported');
        return;
    }

    if (!require('fs').existsSync(executablePath)) {
        console.log('[vite-plugin-skeleton-screen] Start install Chrome...');
        const throttledLog = throttle(logDownloadProgress, 1000);
        // @ts-ignore
        await install({
            cacheDir,
            browser,
            buildId,
            platform,
            unpack: true,
            downloadProgressCallback: throttledLog
        });
    }
}

export async function checkChromeAndInstall() {
    try {
        const chromePath = executablePath();
        if (!fs.existsSync(chromePath)) {
            console.log('[vite-plugin-skeleton-screen] Chrome not found, installing...');
            await ensureChromeInstalled();
        }
    } catch (e) {
        console.log('[vite-plugin-skeleton-screen] Failed to detect Chrome, ready install Chrome...', e);
        await ensureChromeInstalled();
    }
}
