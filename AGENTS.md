# AGENTS.md

TypeStation —— 基于 Bentley Systems 开源的 iTwin.js (itwinjs-core) 开发的桌面 CAD 软件。前端为浏览器界面，后端为 Electron 主进程 + 可选的 Web 服务进程。

## Setup commands

- Install deps: `npm install`（本机 npm 源 `mirrors.cloud.tencent.com` 经常 DNS 解析失败，失败时改用 `npm install --registry=https://registry.npmjs.org/`）
- Build: `npm run build`（= 前端 `tsc` 类型检查 + `vite build` + 后端 `tsc`）
- Build backend only: `npm run build:backend`
- Start dev: `npm start`（同时起 Vite 开发服务器 :3000 与 Electron 外壳；**先跑 `npm run build:backend`**，Electron 启动的是 `lib/backend/DtaElectronMain.js`）
- Lint: `npm run lint`
- Clean: `npm run clean`
- Bundle analysis: `npm run build:stats`
- 无测试命令：`test` / `cover` 脚本为空字符串，仓库内也没有任何 `*.test.ts` / `*.spec.ts`

## Project layout

- `src/frontend/` — UI、工具、视口、面板，由 Vite 打包成浏览器端 bundle
- `src/backend/` — Electron 主进程与 Web 服务进程，编译为 CommonJS，产物在 `lib/backend/`
- `src/common/` — 前后端共用代码（配置、RPC/IPC 传输），产物在 `lib/common/`
- `public/` — 静态资源源目录，构建时复制到 `lib/` 与 `.static-assets/`
- `assets/` — iTwin 展示规则集与设置 schema
- `config/rush-project.json` — Rush 构建配置残留，实际用的是普通 npm
- `docs/` — 项目说明与 drawio 源文件
- `index.html` — 前端入口，引用 `/src/index.ts`

## Code style

- TypeScript 严格模式，基础配置继承自 `@itwin/build-tools/tsconfig-base.json`（`strict`、`noImplicitOverride`，target ES2023）
- ESLint 9 扁平配置 `eslint.config.js`，基于 `@itwin/eslint-plugin` 的 `iTwinjsRecommendedConfig`
- 无 Prettier：2 空格缩进、双引号、带分号
- 提交前 `npm run lint` 必须零问题

## Testing instructions

- 本项目当前没有自动化测试。新增功能时至少保证 `npm run build` 与 `npm run lint` 通过，并手动验证受影响功能
- 改动 `src/frontend/` 后用 `npm start` 在 Electron 里跑一遍；改动 `src/backend/` 或 `src/common/` 后重新 `npm run build:backend`

## PR & commit conventions

- 从 `main` 切分支，不要直接推 `main`
- 提交信息用简短中文描述改动（如 `修改名字`、`删除imodelhub访问相关代码`），本仓库未使用 `feat:`/`fix:` 前缀
- 合入前 CI 无配置，靠本地 `npm run build` + `npm run lint` 把关

## Security

- `.env`、`.env.local`、`.env.*.local` 已在 `.gitignore` 中，不要提交凭据
- OIDC 与运行环境参数走环境变量注入：`IMJS_OIDC_CLIENT_ID`、`IMJS_OIDC_SCOPE`、`IMJS_OIDC_REDIRECT_URI`、`IMJS_URL_PREFIX`、`IMJS_STANDALONE_FILENAME`
- `package-lock.json` 同样在 `.gitignore` 内，仓库只提交 `package.json`

## 本项目关键约束

这几条踩过一次坑，改动时务必遵守：

- **所有 `@itwin/*` 包必须是同一个精确版本**（如全部 `5.14.4`）。5.x 的包之间用精确版本互相锁定，版本不一致会装出多份、运行时行为错乱
- **不要把 `src/common/` 的自建 RPC 层换成 `@itwin/core-electron`**。本项目自己实现了 `ElectronRpcManager` / `ElectronRpcProtocol` / `ElectronRpcRequest` / `ElectronPush`，后端 `ElectronHost.ts` 与前端 `ElectronApp.ts` 也是自己的一套，与官方示例不同
- **`vite.config.mts` 必须保持 ESM**。Vite 6 与 `vite-plugin-inspect@11` 只提供 ESM 产物；需要 `require.resolve` 时用文件顶部已有的 `createRequire(import.meta.url)`
- **前端与后端模块系统不同**：前端 `tsconfig.json` 用 `esnext` + `moduleResolution: Bundler`；后端 `tsconfig.backend.json` 用 `NodeNext`，输出 CommonJS
- **`useDefineForClassFields` 在 ES2023 下默认开启**。子类里声明字段会在 `super()` 之后覆盖基类同名属性（基类构造时赋的值会被清成 `undefined`）。本项目目前没有继承 `Element` 的类，但新增继承 iTwin.js 基类的类时，属性要么在构造函数里赋值，要么加 `declare`
- **`npm install` 后确认安装脚本已放行**：npm 11 默认拦截 `electron`、`@bentley/imodeljs-native`、`esbuild` 的安装脚本，`package.json` 的 `allowScripts` 字段负责放行，删掉它会导致安装后缺二进制
