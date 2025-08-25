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
exports.startStaticServer = startStaticServer;
const http_1 = __importDefault(require("http"));
const serve_handler_1 = __importDefault(require("serve-handler"));
/**
 * 启动一个本地静态服务器
 * @param root 静态资源目录
 * @param port 端口号（默认 5000）
 */
function startStaticServer(root_1) {
    return __awaiter(this, arguments, void 0, function* (root, port = 5000) {
        const server = http_1.default.createServer((req, res) => {
            return (0, serve_handler_1.default)(req, res, {
                public: root,
                cleanUrls: true,
                rewrites: [
                    // 所有路径都回退到 index.html（SPA history 模式）
                    { source: '**', destination: '/index.html' },
                ],
            });
        });
        return new Promise((resolve) => {
            server.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
                resolve({
                    url: `http://localhost:${port}`,
                    close: () => server.close(),
                });
            });
        });
    });
}
