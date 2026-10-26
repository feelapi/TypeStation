# TypeStation

基于 [Bentley Systems 开源的 iTwin.js](https://www.itwinjs.org/)（itwinjs-core）开发的桌面 CAD 软件。

前端跑在浏览器渲染进程里，后端是 Electron 主进程，宿主 iTwin.js 的 `IModelHost` 与 RPC 通信层。当前基于 **iTwin.js 5.14.4**。

---

## 功能特性

**浏览与选择**
- 空间视图 / 二维视图浏览，点选、框选、拾取
- 缩放到选中元素、模型裁剪、按元素几何裁剪
- 多视口管理：创建、克隆、聚焦、停靠、同步视口与视锥
- 网格设置、包围盒显示、比例尺

**编辑**
- 编辑会话（EditingSession）进入/退出
- 放置线串等几何元素（需以读写方式打开 iModel）
- 推送 / 拉取更改

**标注与装饰**
- 标注文本（Markup）、Markup 拾取测试
- 路径装饰、GLTF 装饰、阴影贴图、Aspect Ratio Skew 装饰器
- 事故标记（Incident Markers）、地形披挂（Terrain Drape）

**数据与现实模型**
- 打开本地 iModel 文件（standalone）
- 现实模型（Reality Model）设置、附加自定义现实数据
- 空间分类（Classifications）面板

**视效与诊断**
- 大气（Atmosphere）、环境编辑器、灯光编辑器
- 输出着色器（Output Shaders）、帧统计、瓦片尺寸记录
- 时间点对比（Time Point Comparison）
- 内置 [Frontend DevTools](https://www.itwinjs.org/reference/core/frontend-devtools/)

**窗口**
- 多窗口、窗口最大化/还原/缩放/关闭

---

## 技术栈

| 组件 | 版本 | 说明 |
|---|---|---|
| iTwin.js (`@itwin/*`) | 5.14.4 | 所有 `@itwin` 包必须使用**同一个精确版本** |
| Electron | 35.x | iTwin.js 5.0 要求的最低版本 |
| TypeScript | 5.6.x | 与 `@itwin/build-tools` 内置版本一致 |
| Vite | 6.4.x | 前端打包；`vite.config.mts` 为 ESM |
| ESLint | 9.x | 扁平配置 `eslint.config.js` |

前端依赖 `esnext` + `moduleResolution: Bundler`；后端用 `NodeNext`，编译为 CommonJS 产物。

---

## 环境要求

- **Node.js** 20.11 以上（推荐 22 或 24 的长期支持版本）
- **操作系统**：Windows 10 1803 以上 / macOS 14 以上（Apple Silicon）/ Linux（glibc ≥ 2.36）
- **显卡**：支持 WebGL 2 的 GPU

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

> 如果 npm 源解析失败（`EAI_AGAIN`），换用官方源：`npm install --registry=https://registry.npmjs.org/`

### 2. 配置环境变量

在项目根目录建 `.env` 或 `.env.local`：

```ini
# 要打开的本地 iModel 文件（必填，否则启动时会弹窗提示）
IMJS_STANDALONE_FILENAME=C:\path\to\model.bim
```

后端启动时先读 `.env` 再读 `.env.local`，而 dotenv 默认不覆盖已存在的环境变量，所以同名项以 `.env` 为准。

### 3. 构建

```bash
npm run build
```

产物落在 `lib/`：前端 bundle 在 `lib/`，后端 CommonJS 在 `lib/backend/` 与 `lib/common/`。

### 4. 运行

```bash
npm start
```

会同时启动 Vite 开发服务器（:3000）和 Electron 外壳。后端代码需事先编译过，否则请先执行 `npm run build:backend`。

---

## 环境变量

完整列表见 [`src/common/DtaConfiguration.ts`](src/common/DtaConfiguration.ts)（其中约 40 项），以下是常用的：

| 变量 | 作用 |
|---|---|
| `IMJS_STANDALONE_FILENAME` | 启动时打开的本地 iModel 文件路径 |
| `IMJS_STANDALONE_VIEWNAME` | 打开时使用的视图名 |
| `IMJS_STANDALONE_FILEPATH` | 浏览器模式下文件选择器的根目录 |
| `IMJS_STANDALONE_SIGNIN` | 设为任意值则打开本地文件前先登录 |
| `IMJS_READ_WRITE` | 设为任意值则以读写方式打开 iModel |
| `IMJS_STARTUP_MACRO` | 启动时自动执行的宏文件路径 |
| `IMJS_OIDC_CLIENT_ID` / `IMJS_OIDC_SCOPE` / `IMJS_OIDC_REDIRECT_URI` | OIDC 登录参数 |
| `IMJS_URL_PREFIX` | 覆盖 iModel Hub 访问的域名前缀 |
| `IMJS_LOG_LEVEL` | 后端日志级别（`None` / `Trace` / `Info` / `Warning` / `Error`） |
| `IMJS_WINDOW_SIZE` | 窗口初始尺寸，如 `1280,800` |
| `IMJS_BING_MAPS_KEY` / `IMJS_MAPBOX_KEY` / `IMJS_CESIUM_ION_KEY` | 底图与地形服务密钥 |
| `IMJS_GPU_MEMORY_LIMIT` | GPU 显存上限（字节数或 `core-frontend` 支持的字符串） |
| `IMJS_AASAMPLES` | 抗锯齿采样数 |
| `IMJS_DISABLED_EXTENSIONS` | 要禁用的 WebGL 扩展名，分号分隔 |
| `IMJS_TILETREE_EXPIRATION_SECONDS` / `IMJS_TILE_EXPIRATION_SECONDS` | 瓦片与瓦片树缓存过期时间 |
| `IMJS_DISABLE_DIAGNOSTICS` | 设为任意值则关闭渲染诊断 |
| `IMJS_NO_DEV_TOOLS` | 设为任意值则不自动打开 DevTools |

另有三个在别处读取的变量：`IMJS_REALITY_DATA_KEY`（现实数据源密钥，读自 `src/frontend/App.ts`）、`IMJS_BRIEFCASE_CACHE_LOCATION`（iModel 缓存目录，读自 `src/backend/Backend.ts`）、`NODE_ENV`（由 npm 脚本设置，不需要手动配）。

---

## 命令行指令

在应用底部的输入框（keyin）里输入。以下指令来自 [`public/locales/en/SVTTools.json`](public/locales/en/SVTTools.json)：

| 指令 | 作用 |
|---|---|
| `dta select` | 选择工具（默认工具） |
| `dta file open` / `dta file close` / `dta file reopen` | 打开、关闭、重新打开 iModel |
| `dta zoom selected` | 缩放到选中元素 |
| `dta model clip` / `dta clip element geometry` | 模型裁剪 / 按元素几何裁剪 |
| `dta classifyclip selected` | 按视图裁剪范围给选中元素着色（在内绿、在外红、部分重叠蓝） |
| `dta grid settings` | 网格设置，可带 `spacing=`、`ratio=`、`gridsPerRef=`、`orientation=` 参数 |
| `dta markup` | 标注文本 |
| `dta markupselect` | 标注拾取测试模式，进入后可用单键放置各种标注图元 |
| `dta drawing aid points` | 绘制辅助点（测试 AccuSnap） |
| `dta edit` | 进入/退出编辑会话 |
| `dta place line string` | 放置线串 |
| `dta push` / `dta pull` | 推送 / 拉取更改 |
| `dta drape terrain` | 地形披挂 |
| `dta incident markers` | 事故标记 |
| `dta path decoration` / `dta gltf` / `dta shadow tiles` | 各类装饰 |
| `dta aspect skew decorator` | 纵横比倾斜（Aspect Ratio Skew）装饰器开关 |
| `dta reality model settings` / `dta attach reality` | 现实模型设置 / 附加现实数据 |
| `dta timepoint comparison` | 时间点对比 |
| `dta model transform` / `dta model scale` | 模型变换 / 模型缩放 |
| `dta viewport sync` / `dta frustum sync` | 视口同步 / 视锥同步 |
| `dta gen tile` / `dta gen graphics` | 生成瓦片内容 / 元素图形 |
| `dta save image` / `dta output shaders` | 保存图像 / 输出着色器 |
| `dta record fps` / `dta framestats` / `dta record tilesize` | 性能统计 |
| `dta refresh tiles` / `dta purge tiletrees` | 刷新 / 清除瓦片树 |
| `dta macro <文件>` | 执行宏文件（文件路径为参数，文件内每行一条指令，逐行顺序执行） |
| `dta signin` / `dta signout` | 登录 / 登出 |
| `dta shutdown` / `dta exit` | 关闭后端 / 退出应用 |
| `win create` / `win focus` / `win max` / `win restore` / `win resize` / `win close` / `win dock` | 窗口操作 |
| `vp clone` | 克隆视口 |

指令只认上表列出的字符串，不会回退到工具 ID。语言包里还有 `dta version compare`、`dta attach view`、`dta detach views`、`dta hypermodeling` 四条，但对应的工具类在 `src/` 中并不存在，输入后不会有任何反应。

---

## 目录结构

```
src/frontend/   前端 UI、工具、视口、面板（Vite 打包）
src/backend/    Electron 主进程与 Web 服务进程（CommonJS）
src/common/     前后端共用：配置、RPC/IPC 传输
public/         静态资源源目录（图标、字体、语言包）
assets/         iTwin 展示规则集与设置 schema
docs/           项目说明与 drawio 源文件
index.html      前端入口
```

---

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run build` | 前端类型检查 + Vite 打包 + 后端编译 |
| `npm run build:backend` | 只编译后端 |
| `npm run build:stats` | 打包并生成 bundle 分析报告 |
| `npm start` | 开发模式（Vite :3000 + Electron） |
| `npm run start:servers` | 只跑前端开发服务器与后端 Web 服务（:3001） |
| `npm run lint` | ESLint 检查 |
| `npm run clean` | 清理构建产物 |

---

## 已知限制

- **仅支持打开本地 iModel 文件**。代码里保留了 iModel Hub 相关的配置项，但访问 Hub 的实现已被移除。
- **没有自动化测试**，仓库内也没有 CI 配置。提交前请自行跑通 `npm run build` 与 `npm run lint`。
- `npm run copy:config` 依赖 Bentley 的私有包 `internal-tools`，在公开仓库里无法执行。

---

## 参考资料

- [iTwin.js 官网](https://www.itwinjs.org/) · [API 文档](https://www.itwinjs.org/reference/)
- [iTwin.js 5.0 变更说明](https://www.itwinjs.org/changehistory/5.0.0)
- [支持的平台与运行环境](https://www.itwinjs.org/learning/supportedplatforms)
- [itwinjs-core 源码](https://github.com/iTwin/itwinjs-core)
