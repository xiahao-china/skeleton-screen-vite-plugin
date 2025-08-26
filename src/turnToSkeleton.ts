import type {Page} from 'puppeteer';
import {Jimp, ResizeStrategy} from 'jimp';
import {ISkeletonScreenDeep} from "./const";


export async function compressBase64WithJimp(dataUrl: string, maxW=480, maxH=270,) {
    const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
    const base64 = match ? match[2] : dataUrl;

    const img = await Jimp.read(Buffer.from(base64, 'base64'));
    img.resize({
        w: maxW,
        h: maxH,
        mode: ResizeStrategy.NEAREST_NEIGHBOR
    });

    const buf = await img.getBase64("image/png");
    return buf;
}

export async function startTurnToSkeleton(page: Page){
    return await page.evaluate(() => {
        function setSkeletonStyle(element: HTMLElement){
            if (element.tagName.toLowerCase() === 'img') {
                // 换为灰色base64
                (element as HTMLImageElement).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIYAAAByCAIAAAAZGD7JAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABIElEQVR4nO3RQQ0AIBDAMMC/yJPCHwPs0SpYsj0zi5LzO4CXJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0nOBc7LA4QURF9DAAAAAElFTkSuQmCC';
                return;
            }
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            element.style.background = '#e0e0e0';
            element.style.borderRadius = '4px';
            element.style.width = `${width}px`;
            element.style.height = `${height}px`;
            element.innerHTML = '';
        }

        function handleTextNode(element: Text) {
            // 获取文本节点尺寸
            const font = element.textContent.length;
            const fontSize = element.parentElement ? window.getComputedStyle(element.parentElement).fontSize : '14px';
            const width = font * parseInt(fontSize.replace('px', ''));
            const height = fontSize;
            const divEl = document.createElement("div");
            divEl.style.width = `${width}px`;
            divEl.style.height = `${height}`;
            divEl.style.background = '#e0e0e0';
            divEl.style.borderRadius = '4px';
            (element.parentElement as HTMLElement).insertBefore(divEl,element);
            element.remove();
        }

        function turnToSkeleton(deep: number | ISkeletonScreenDeep){
            const historyPath = window.location.pathname.replace('/','');
            const hashPath = window.location.hash.replace('#', '');
            const handlePath = hashPath || historyPath;
            const handleDeep = deep instanceof Object ? (deep[handlePath] || 7): deep
            // 页面黑白灰化
            document.body.style.filter = 'grayscale(100%)';
            document.body.style.overflow = 'hidden';
            // 删除超出视窗的元素
            const elements = document.querySelectorAll('*');
            elements.forEach(el => {
                if (el.getBoundingClientRect().top > window.innerHeight || window.getComputedStyle(el).position === 'fixed') {
                    el.remove();
                }
            });
            // 由body开始遍历指定深度的元素
            const body = document.body;
            // 遍历指定深度的元素
            const traverse = (el: HTMLElement, depth: number) => {
                if (depth > 0 && el.childNodes.length > 0) {
                    Array.from(el.childNodes).forEach(child => {
                        if (child instanceof HTMLElement) {
                            traverse(child, depth - 1);
                        } else if(child instanceof Text && child.textContent.replace(/\s+/g, '').length){
                            handleTextNode(child);
                        }else{
                            child.remove();
                        }
                    });
                }else {
                    setSkeletonStyle(el);
                }
            };
            traverse(body, handleDeep);

        }

        const deep = JSON.parse(new URLSearchParams(window.location.search).get('skeleton_screen_vite_plugin_deep') || '{}');
        turnToSkeleton(deep);
    });
}