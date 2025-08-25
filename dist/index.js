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
exports.init = init;
const puppeteer_1 = require("puppeteer");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const puppeteer_2 = require("puppeteer");
const const_1 = require("./const");
const envPreCheck_1 = require("./envPreCheck");
const pageServer_1 = require("./pageServer");
// 解析Vue路由配置文件
function parseRoutes(routerFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 简单解析路由配置中的path（实际应用可能需要更复杂的解析）
            const content = fs_1.default.readFileSync(routerFilePath, 'utf-8');
            const routeMatches = content.match(/path:\s*['"](.*?)['"]/g);
            return routeMatches ? routeMatches.map(match => match.split(/['"]/)[1]) : [];
        }
        catch (error) {
            console.error('Failed to parse routes:', error);
            return [];
        }
    });
}
// 使用Puppeteer生成骨架屏图片
function generateSkeletonScreens(routes, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield (0, puppeteer_1.launch)(Object.assign(Object.assign({ headless: 'new' }, options.puppeteerOptions), { executablePath: (0, puppeteer_2.executablePath)() // 使用 puppeteer 自带的 Chrome
         }));
        const page = yield browser.newPage();
        const skeletonScreens = {};
        const baseUrl = `http://localhost:${const_1.DEFAULT_PORT}`;
        try {
            for (const route of routes) {
                console.log(`Generating skeleton screen for: ${route}`);
                yield page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
                yield page.waitForTimeout(options.delay || 2000);
                // 添加骨架屏样式
                yield page.addStyleTag({
                    content: `
          .${options.skeletonClass} * { visibility: hidden !important; }
          .${options.skeletonClass} .skeleton-block { visibility: visible !important; background: #e0e0e0; border-radius: 4px; }
          .${options.skeletonClass} .skeleton-text { visibility: visible !important; background: #e0e0e0; height: 16px; border-radius: 4px; }
        `
                });
                // 为主要元素添加骨架屏类
                yield page.evaluate((skeletonClass) => {
                    const body = document.body;
                    skeletonClass && body.classList.add(skeletonClass);
                    // 为div、p、span等元素添加骨架屏样式（简化实现）
                    document.querySelectorAll('div, p, span, h1, h2, h3, h4, h5, h6').forEach(el => {
                        el.classList.add('skeleton-block');
                    });
                    document.querySelectorAll('img').forEach(img => {
                        var _a;
                        img.style.visibility = 'hidden';
                        const skeleton = document.createElement('div');
                        skeleton.className = 'skeleton-block';
                        skeleton.style.width = img.offsetWidth + 'px';
                        skeleton.style.height = img.offsetHeight + 'px';
                        (_a = img.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(skeleton, img);
                    });
                }, options.skeletonClass);
                // 截图并转换为base64
                const screenshot = yield page.screenshot({ type: 'png', encoding: 'base64' });
                console.log(`route ${route}: ${screenshot}`);
                skeletonScreens[route] = screenshot;
            }
        }
        finally {
            yield browser.close();
        }
        return skeletonScreens;
    });
}
// 注入骨架屏到HTML
function injectSkeletonToHtml(htmlPath, skeletonScreens, options) {
    let htmlContent = fs_1.default.readFileSync(htmlPath, 'utf-8');
    // 创建骨架屏样式
    const style = `
    <style>
      .skeleton-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: white; display: none; }
      .skeleton-container.visible { display: block; }
      .skeleton-image { width: 100%; height: 100%; object-fit: cover; }
    </style>
  `;
    // 创建骨架屏容器
    const containers = Object.entries(skeletonScreens)
        .map(([route, base64]) => `
      <div class="skeleton-container" data-route="${route}"><img src="data:image/png;base64,${base64}" class="skeleton-image" /></div>
    `).join('\n');
    // 将样式插入到head中
    htmlContent = htmlContent.replace('</head>', `${style}</head>`);
    // 将骨架屏容器插入到body中
    htmlContent = htmlContent.replace('</body>', `${containers}</body>`);
    // 添加路由监听脚本
    const script = `
    <script>
      // 监听路由变化显示对应骨架屏
      function showSkeletonForRoute(route) {
        document.querySelectorAll('.skeleton-container').forEach(container => {
          container.classList.toggle('visible', container.dataset.route === route);
        });
      }
      
      // 初始路由
      showSkeletonForRoute(window.location.pathname);
      
      // 监听hash变化 (Vue Router hash模式)
      window.addEventListener('hashchange', () => {
        showSkeletonForRoute(window.location.hash.replace('#', ''));
      });
      
      // 监听history变化 (Vue Router history模式)
      if (window.history && window.history.pushState) {
        const originalPushState = window.history.pushState;
        window.history.pushState = function(...args) {
          originalPushState.apply(this, args);
          showSkeletonForRoute(window.location.pathname);
        };
        
        window.addEventListener('popstate', () => {
          showSkeletonForRoute(window.location.pathname);
        });
      }
    </script>
  `;
    htmlContent = htmlContent.replace('</body>', `${script}</body>`);
    fs_1.default.writeFileSync(htmlPath, htmlContent);
}
// 插件入口
function init(options = {}) {
    const pluginOptions = Object.assign(Object.assign({}, const_1.defaultOptions), options);
    let config;
    return {
        name: 'vite-plugin-skeleton-screen',
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        closeBundle() {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                // 解析路由
                const routes = pluginOptions.routes.length > 0
                    ? pluginOptions.routes
                    : yield parseRoutes(path_1.default.resolve(config.root, ((_a = pluginOptions.routerPath) !== null && _a !== void 0 ? _a : const_1.defaultOptions.routerPath)));
                if (routes.length === 0) {
                    console.warn('No routes found for skeleton screen generation');
                    return;
                }
                yield (0, envPreCheck_1.checkChromeAndInstall)();
                console.log('outDir', config.build.outDir);
                const server = yield (0, pageServer_1.startStaticServer)(config.build.outDir, const_1.DEFAULT_PORT);
                // 生成骨架屏
                const skeletonScreens = yield generateSkeletonScreens(routes, pluginOptions);
                server.close();
                // 注入到HTML
                const htmlPath = path_1.default.resolve(config.build.outDir, 'index.html');
                if (fs_1.default.existsSync(htmlPath)) {
                    injectSkeletonToHtml(htmlPath, skeletonScreens, pluginOptions);
                    console.log('Skeleton screens injected into index.html');
                }
                else {
                    console.error('index.html not found in output directory');
                }
            });
        }
    };
}
