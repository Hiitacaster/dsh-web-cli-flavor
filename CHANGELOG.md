# Changelog

## 0.10.4 — 维修与健壮性改进

### 构建与版本管理

- **排除构建产物**：将 `dsh-web-cli-flavor/lib/client.js` 加入 `.gitignore`，避免构建产物再次进入版本控制。
  - 该文件由 `scripts/build.mjs` 从 `client.template.js` + `cli-flavor.css` 生成。
  - 安装前必须先运行 `node scripts/build.mjs`。

### TypeScript 类型声明

- 补齐 `package.json` exports 中引用但缺失的类型声明文件：
  - `dsh-web-cli-flavor/lib/types/index.d.ts`
  - `dsh-web-cli-flavor/lib/types/client/index.d.ts`
- 避免 TypeScript 用户或部分 bundler 在解析 `types` 字段时报错。

### 浏览器半侧健壮性

- `lib/client.template.js` 入口改为 IIFE 包装。
- 在调用 `window.__ModuleLoader__.load(...)` 前，先检查 `__ModuleLoader__` 与 `.load` 是否存在；缺失时输出警告并安全退出，避免宿主环境变化时抛出顶层异常导致插件加载失败。

### 调试与可观测性

- 新增 `logError(label, err)` 调试辅助工具。
- 替换 7 处原本静默吞掉的 `catch` 块，出错时带标签输出到 console：
  - `rafThrottle` 任务执行
  - `textarea.value` setter 劫持
  - 用户消息 echo 兜底
  - 用户消息 echo 的 value setter 链
  - JSON parse guard
  - `scrollIntoView` 平滑滚动
- 主流程仍不被阻断，但排查时不再无日志可循。

### 构建脚本清理

- `scripts/build.mjs`：
  - 删除关于已废弃的 `/*__CLI_FLAVOR_WHALE__*/` 占位符的过时注释。
  - 删除未使用的 `escaped` 死代码变量。

### 安装脚本改进

- `scripts/install.ps1`：
  - 把硬编码的 npx 缓存哈希路径 `npm-cache\_npx\1e7f6d9597241db0\...` 改为通配扫描 `_npx\*` 下所有目录。
  - 取最近修改的匹配目录作为 fallback，换机器或重新安装后更可靠。

### 文档更新

- `README.md`：
  - 版本信息改为 `0.10.4（2026-08-28：...）`，与 `package.json` 对齐。
  - 目录结构中 `client.js` 的注释改为说明它是构建产物、已从仓库排除。
  - 安装说明强调**必须先运行 `node scripts/build.mjs`**，不可跳过。
  - 新增「卸载 / 回滚」小节，说明 `install.ps1 -Uninstall` 用法。

---

## 历史版本

### 0.10.4 之前

- 初始实现：DSH Web GUI 终端风格皮肤、内置 Cascadia Code 字体、终端提示符、块状光标、粘贴折叠、发送即上屏兜底、QueueDock 终端化、StatsBar、CLI 选择器、`/effort` 命令等。
- 详见 `README.md` 的「已实现功能清单」。
