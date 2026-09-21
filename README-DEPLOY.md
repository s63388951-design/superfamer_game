# 联网模式部署说明

## 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

本地开发默认地址通常是：

```
http://127.0.0.1:8787
```

WebSocket 地址是：

```
ws://127.0.0.1:8787/ws?code=ROOMCODE
```

## 2. 启动前端

在项目根目录用任意静态服务器即可，例如：

```bash
npx serve .
```

然后打开首页，选择“联网模式”。

## 3. 部署到 Cloudflare

### 后端

```bash
cd backend
npx wrangler login
npx wrangler deploy
```

部署完成后会得到一个后端地址，例如：

```
https://super-farmer-game-server.<你的子域>.workers.dev
```

### 前端

在项目根目录执行：

```bash
npx wrangler pages deploy . --project-name super-farmer-game
```

部署完成后会得到一个前端地址，例如：

```
https://super-farmer-game.pages.dev
```

最后把 `config.js` 里的 `window.GAME_API_URL` 改成你的后端地址：

```js
window.GAME_API_URL = 'https://super-farmer-game-server.<你的子域>.workers.dev';
```

再重新部署一次前端。
