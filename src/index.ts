import type { Plugin, ResolvedConfig } from 'vite';
import { launch } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { defaultOptions, type SkeletonScreenOptions } from './const';




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
  config: ResolvedConfig
): Promise<Record<string, string>> {
  const browser = await launch({ headless: 'new', ...options.puppeteerOptions });
  const page = await browser.newPage();
  const skeletonScreens: Record<string, string> = {};
  const baseUrl = `http://localhost:${config.server.port || 5173}`;

  try {
    for (const route of routes) {
      console.log(`Generating skeleton screen for route: ${route}`);
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0' });
      await page.waitForTimeout(options.delay || 2000);

      // 添加骨架屏样式
      await page.addStyleTag({
        content: `
          .${options.skeletonClass} * { visibility: hidden !important; }
          .${options.skeletonClass} .skeleton-block { visibility: visible !important; background: #e0e0e0; border-radius: 4px; }
          .${options.skeletonClass} .skeleton-text { visibility: visible !important; background: #e0e0e0; height: 16px; border-radius: 4px; }
        `
      });

      // 为主要元素添加骨架屏类
      await page.evaluate((skeletonClass) => {
        const body = document.body;
        skeletonClass && body.classList.add(skeletonClass);

        // 为div、p、span等元素添加骨架屏样式（简化实现）
        document.querySelectorAll('div, p, span, h1, h2, h3, h4, h5, h6').forEach(el => {
          el.classList.add('skeleton-block');
        });

        document.querySelectorAll('img').forEach(img => {
          img.style.visibility = 'hidden';
          const skeleton = document.createElement('div');
          skeleton.className = 'skeleton-block';
          skeleton.style.width = img.offsetWidth + 'px';
          skeleton.style.height = img.offsetHeight + 'px';
          img.parentNode?.insertBefore(skeleton, img);
        });
      }, options.skeletonClass);

      // 截图并转换为base64
      const screenshot = await page.screenshot({ type: 'png', encoding: 'base64' });
      skeletonScreens[route] = screenshot;
    }
  } finally {
    await browser.close();
  }

  return skeletonScreens;
}

// 注入骨架屏到HTML
function injectSkeletonToHtml(
  htmlPath: string,
  skeletonScreens: Record<string, string>,
  options: SkeletonScreenOptions
) {
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');

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
  
  fs.writeFileSync(htmlPath, htmlContent);
}

// 插件入口
export default function skeletonScreenPlugin(options: Partial<SkeletonScreenOptions> = {}): Plugin {
  const pluginOptions: SkeletonScreenOptions = { ...defaultOptions, ...options };
  let config: ResolvedConfig;
  
  return {
    name: 'vite-plugin-skeleton-screen',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async buildEnd() {
      // 解析路由
      const routes = pluginOptions.routes.length > 0
        ? pluginOptions.routes 
        : await parseRoutes(path.resolve(config.root, (pluginOptions.routerPath ?? defaultOptions.routerPath) as string));
      
      if (routes.length === 0) {
        console.warn('No routes found for skeleton screen generation');
        return;
      }

      console.log('routes',routes);
      
      // // 生成骨架屏
      // const skeletonScreens = await generateSkeletonScreens(routes, pluginOptions, config);
      //
      // // 注入到HTML
      // const htmlPath = path.resolve(config.build.outDir, 'index.html');
      // if (fs.existsSync(htmlPath)) {
      //   injectSkeletonToHtml(htmlPath, skeletonScreens, pluginOptions);
      //   console.log('Skeleton screens injected into index.html');
      // } else {
      //   console.error('index.html not found in output directory');
      // }
    }
  };
}