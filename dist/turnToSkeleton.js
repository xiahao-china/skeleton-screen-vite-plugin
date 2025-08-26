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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressBase64WithJimp = compressBase64WithJimp;
exports.startTurnToSkeleton = startTurnToSkeleton;
const jimp_1 = require("jimp");
function compressBase64WithJimp(dataUrl_1) {
    return __awaiter(this, arguments, void 0, function* (dataUrl, maxW = 480, maxH = 270) {
        const match = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
        const base64 = match ? match[2] : dataUrl;
        const img = yield jimp_1.Jimp.read(Buffer.from(base64, 'base64'));
        img.resize({
            w: maxW,
            h: maxH,
            mode: jimp_1.ResizeStrategy.NEAREST_NEIGHBOR
        });
        const buf = yield img.getBase64("image/png");
        return buf;
    });
}
function startTurnToSkeleton(page) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield page.evaluate(() => {
            function setSkeletonStyle(element) {
                if (element.tagName.toLowerCase() === 'img') {
                    // 换为灰色base64
                    element.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIYAAAByCAIAAAAZGD7JAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABIElEQVR4nO3RQQ0AIBDAMMC/yJPCHwPs0SpYsj0zi5LzO4CXJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0mOJTmW5FiSY0nOBc7LA4QURF9DAAAAAElFTkSuQmCC';
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
            function handleTextNode(element) {
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
                element.parentElement.insertBefore(divEl, element);
                element.remove();
            }
            function turnToSkeleton(deep) {
                const historyPath = window.location.pathname.replace('/', '');
                const hashPath = window.location.hash.replace('#', '');
                const handlePath = hashPath || historyPath;
                const handleDeep = deep instanceof Object ? (deep[handlePath] || 7) : deep;
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
                const traverse = (el, depth) => {
                    if (depth > 0 && el.childNodes.length > 0) {
                        Array.from(el.childNodes).forEach(child => {
                            if (child instanceof HTMLElement) {
                                traverse(child, depth - 1);
                            }
                            else if (child instanceof Text && child.textContent.replace(/\s+/g, '').length) {
                                handleTextNode(child);
                            }
                            else {
                                child.remove();
                            }
                        });
                    }
                    else {
                        setSkeletonStyle(el);
                    }
                };
                traverse(body, handleDeep);
            }
            const deep = JSON.parse(new URLSearchParams(window.location.search).get('skeleton_screen_vite_plugin_deep') || '{}');
            turnToSkeleton(deep);
        });
    });
}
