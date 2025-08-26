import type { Plugin, ResolvedConfig } from 'vite';
import { launch } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { executablePath } from 'puppeteer';

import {DEFAULT_PORT, defaultOptions, type SkeletonScreenOptions} from './const';
import { checkChromeAndInstall } from './envPreCheck';
import {startStaticServer} from "./pageServer";
import {compressBase64WithJimp, startTurnToSkeleton} from "./turnToSkeleton";



// 解析Vue路由配置文件
async function parseRoutes(routerFilePath: string): Promise<string[]> {
  try {
    // 简单解析路由配置中的path（实际应用可能需要更复杂的解析）
    const content = fs.readFileSync(routerFilePath, 'utf-8');
    const routeMatches = content.match(/path:\s*['"](.*?)['"]/g);
    return routeMatches ? routeMatches.map(match => match.split(/['"]/)[1]) : [];
  } catch (error) {
    console.error('Failed to parse routes:', error);
    return [];
  }
}

// 使用Puppeteer生成骨架屏图片
async function generateSkeletonScreens(
  routes: string[],
  options: SkeletonScreenOptions,
): Promise<Record<string, string>> {
  const browser = await launch({
    headless: 'new',
    // 浏览器视窗尺寸
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    ...options.puppeteerOptions,
    executablePath: executablePath()  // 使用 puppeteer 自带的 Chrome
  });
  const page = await browser.newPage();
  const skeletonScreens: Record<string, string> = {};
  const baseUrl = `http://localhost:${DEFAULT_PORT}`;

  try {
    for (const route of routes) {
      console.log(`Generating skeleton screen for: ${route}`);
      await page.goto(`${baseUrl}${route}?skeleton_screen_vite_plugin_deep=${(JSON.stringify(options.elDeep || defaultOptions.elDeep as number))}`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(options.delay || 2000);
      await startTurnToSkeleton(page);

      // 截图并转换为base64
      const screenshot = await page.screenshot({ type: 'png', encoding: 'base64' });
      console.log(`route ${route} 生成完成`);
      skeletonScreens[route.replace('/','').replace('#','')] = `data:image/png;base64,${screenshot}`;
    }
  } finally {
    await browser.close();
  }

  return skeletonScreens;
}

function saveSkeletonScreens(skeletonScreens: Record<string, string>, outputDir: string) {
  Object.entries(skeletonScreens).forEach(([route, base64]) => {
    const filePath = path.join(outputDir, `${route.replace('/', 'skeleton-screen-')}.png`);
    fs.writeFileSync(filePath, base64, 'base64');
  });
}

// 注入骨架屏到HTML
function injectSkeletonToHtml(htmlPath: string, skeletonScreens: Record<string, string>) {
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

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
  
  fs.writeFileSync(htmlPath, htmlContent);
}

// 插件入口
export function init (options: Partial<SkeletonScreenOptions> = {}): Plugin {
  const pluginOptions: SkeletonScreenOptions = { ...defaultOptions, ...options };
  let config: ResolvedConfig;

  return {
    name: 'vite-plugin-skeleton-screen',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async closeBundle() {
      // 解析路由
      const routes = pluginOptions.routes.length > 0
        ? pluginOptions.routes 
        : await parseRoutes(path.resolve(config.root, (pluginOptions.routerPath ?? defaultOptions.routerPath) as string));
      
      if (routes.length === 0) {
        console.warn('No routes found for skeleton screen generation');
        return;
      }

      await checkChromeAndInstall();

      console.log('outDir', config.build.outDir);
      const server = await startStaticServer(config.build.outDir, DEFAULT_PORT);

      // 生成骨架屏
      const skeletonScreens = await generateSkeletonScreens(routes, pluginOptions);

      // 关闭静态文件服务
      server.close();

      // 注入到HTML
      const htmlPath = path.resolve(config.build.outDir, 'index.html');
      if (fs.existsSync(htmlPath)) {
        // 保存骨架屏图片
        const outputDir = path.resolve(config.build.outDir, (pluginOptions.outputPath ?? defaultOptions.outputPath) as string);
        console.log('outputDir',`${outputDir}`);
        saveSkeletonScreens(skeletonScreens, outputDir);
        await Promise.all(Object.keys(skeletonScreens).map(async (screen) => {
          skeletonScreens[screen] = await compressBase64WithJimp(skeletonScreens[screen]);
          console.log('skeletonScreens compressBase64WithJimp', screen, '(done)');
        }))
        injectSkeletonToHtml(htmlPath, skeletonScreens);
        console.log('Skeleton screens injected into index.html');
      } else {
        console.error('index.html not found in output directory');
      }
    }
  };
}