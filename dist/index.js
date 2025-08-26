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
const turnToSkeleton_1 = require("./turnToSkeleton");
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
        const browser = yield (0, puppeteer_1.launch)(Object.assign(Object.assign({ headless: 'new', 
            // 浏览器视窗尺寸
            defaultViewport: {
                width: 1920,
                height: 1080,
            } }, options.puppeteerOptions), { executablePath: (0, puppeteer_2.executablePath)() // 使用 puppeteer 自带的 Chrome
         }));
        const page = yield browser.newPage();
        const skeletonScreens = {};
        const baseUrl = `http://localhost:${const_1.DEFAULT_PORT}`;
        try {
            for (const route of routes) {
                console.log(`Generating skeleton screen for: ${route}`);
                yield page.goto(`${baseUrl}${route}?skeleton_screen_vite_plugin_deep=${(JSON.stringify(options.elDeep || const_1.defaultOptions.elDeep))}`, { waitUntil: 'networkidle0' });
                yield page.waitForTimeout(options.delay || 2000);
                yield (0, turnToSkeleton_1.startTurnToSkeleton)(page);
                // 截图并转换为base64
                const screenshot = yield page.screenshot({ type: 'png', encoding: 'base64' });
                console.log(`route ${route} 生成完成`);
                skeletonScreens[route.replace('/', '').replace('#', '')] = `data:image/png;base64,${screenshot}`;
            }
        }
        finally {
            yield browser.close();
        }
        return skeletonScreens;
    });
}
function saveSkeletonScreens(skeletonScreens, outputDir) {
    Object.entries(skeletonScreens).forEach(([route, base64]) => {
        const filePath = path_1.default.join(outputDir, `${route.replace('/', 'skeleton-screen-')}.png`);
        fs_1.default.writeFileSync(filePath, base64, 'base64');
    });
}
// 注入骨架屏到HTML
function injectSkeletonToHtml(htmlPath, skeletonScreens) {
    let htmlContent = fs_1.default.readFileSync(htmlPath, 'utf-8');
    // 添加路由监听脚本
    const script = `
    <script>
      // 初始化时单次执行,获取当前路由
      (function() {
          var skeletonScreens = '${JSON.stringify(skeletonScreens)}';
          var historyPath = window.location.pathname.replace('/','');
          var hashPath = window.location.hash.replace('#', '');
          var handlePath = hashPath || historyPath;
          const imgEl = document.createElement('img');
          // imgEl.src = '/assets/' + 'skeleton-screen-' + handlePath + '.png';
          imgEl.src = JSON.parse(skeletonScreens)[handlePath];
          imgEl.id = 'skeleton-image';
          imgEl.style.width = '100%';
          imgEl.style.objectFit = 'cover';
          document.body.appendChild(imgEl);
      })();
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
                var _a, _b;
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
                // 关闭静态文件服务
                server.close();
                // 注入到HTML
                const htmlPath = path_1.default.resolve(config.build.outDir, 'index.html');
                if (fs_1.default.existsSync(htmlPath)) {
                    // 保存骨架屏图片
                    const outputDir = path_1.default.resolve(config.build.outDir, ((_b = pluginOptions.outputPath) !== null && _b !== void 0 ? _b : const_1.defaultOptions.outputPath));
                    console.log('outputDir', `${outputDir}`);
                    saveSkeletonScreens(skeletonScreens, outputDir);
                    yield Promise.all(Object.keys(skeletonScreens).map((screen) => __awaiter(this, void 0, void 0, function* () {
                        skeletonScreens[screen] = yield (0, turnToSkeleton_1.compressBase64WithJimp)(skeletonScreens[screen]);
                        console.log('skeletonScreens compressBase64WithJimp', screen, '(done)');
                    })));
                    injectSkeletonToHtml(htmlPath, skeletonScreens);
                    console.log('Skeleton screens injected into index.html');
                }
                else {
                    console.error('index.html not found in output directory');
                }
            });
        }
    };
}
