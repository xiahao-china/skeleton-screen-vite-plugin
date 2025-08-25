import http from "http";
import serveHandler from "serve-handler";
import path from "path";

/**
 * 启动一个本地静态服务器
 * @param root 静态资源目录
 * @param port 端口号（默认 5000）
 */
export async function startStaticServer(root: string, port = 5000) {
    const server = http.createServer((req, res) => {
        return serveHandler(req, res, {
            public: root,
            cleanUrls: true,
            rewrites: [
                // 所有路径都回退到 index.html（SPA history 模式）
                { source: '**', destination: '/index.html' },
            ],
        });
    });

    return new Promise<{ url: string; close: () => void }>((resolve) => {
        server.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
            resolve({
                url: `http://localhost:${port}`,
                close: () => server.close(),
            });
        });
    });
}
