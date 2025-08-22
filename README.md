# vite-plugin-skeleton-screen

A Vite plugin that automatically generates skeleton screens for Vue 3 applications by capturing page structures from your Vue Router routes.

## Features
- Automatically reads Vue Router configuration
- Uses Puppeteer to generate skeleton screens for each route
- Injects base64 encoded skeleton images into index.html
- Supports both hash and history routing modes
- Displays appropriate skeleton screens based on current route

## Installation

```bash
npm install vite-plugin-skeleton-screen --save-dev
# or
yarn add vite-plugin-skeleton-screen -D
```

## Usage

1. Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import skeletonScreenPlugin from 'vite-plugin-skeleton-screen';

export default defineConfig({
  plugins: [
    vue(),
    skeletonScreenPlugin({
      // Optional configuration
      routes: ['/', '/about', '/contact'], // Specify routes manually or let the plugin auto-detect
      delay: 3000, // Delay before capturing each page (in ms)
      puppeteerOptions: {}, // Custom Puppeteer launch options
      routerPath: 'src/router/index.ts', // Path to your Vue Router configuration
    })
  ]
});
```

2. Run your build command:

```bash
npm run build
```

The plugin will automatically generate skeleton screens during the build process and inject them into your `dist/index.html` file.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| routes | string[] | [] | Array of routes to generate skeleton screens for. If empty, will auto-detect from Vue Router. |
| delay | number | 2000 | Delay (in milliseconds) before capturing each page to ensure proper rendering. |
| puppeteerOptions | PuppeteerLaunchOptions | {} | Custom launch options for Puppeteer. |
| routerPath | string | 'src/router/index.ts' | Path to your Vue Router configuration file. |
| skeletonClass | string | 'skeleton-screen' | CSS class name for skeleton screen elements. |
| outputPath | string | 'dist' | Output directory where your index.html is located. |

## How It Works

1. After your Vite build completes, the plugin reads your Vue Router configuration
2. It launches a headless Chromium instance using Puppeteer
3. For each route, it captures the page structure and generates a skeleton screen
4. The skeleton screens are converted to base64 encoded images
5. These images are injected into your index.html file
6. When your application loads, the appropriate skeleton screen is displayed based on the current route

## Notes

- The plugin requires Vue Router to be properly configured in your application
- Puppeteer will download Chromium during installation (this may take some time)
- For production use, ensure your server properly handles history mode routing if using it
- Skeleton screens are only generated during the build process, not in development mode

## License

MIT