# dsh-web-cli-flavor — DSH Web GUI 终端风格皮肤

> 版本：2026-08-28（A5 轮询瘦身 + hero 美术移除 + /simplify 清理）
> 纯客户端皮肤：CSS 覆盖 + JS 注入，**不修改 dsh 核心**，只作用于 Web GUI 外观。

## 这是什么

把 DeepSeek Harness Web GUI（http://127.0.0.1:3080）改造成 **dsh-TUI 风格终端质感**（保留 GUI 结构）：
全局等宽字体（Cascadia Code 优先）、浅色板/深色板跟随系统、输入区终端化（`>` 提示符、块状光标、
hairline 分隔）、大段粘贴折叠提示条、长文本输入区滚动修复、发送后用户消息立即上屏兜底、
QueueDock 队列条终端化（无框灰字 + `⑂` 前缀 + 与输入框 `>` 对齐 + 折叠 `▸`/展开 `▾`）。
性能面：hero 界面美术全部移除（回归官方默认）、三处常驻轮询归零（事件驱动 + 可见才轮询）、
帧内扫描去强制布局。完整进度/决策见 `UI开发进度总览-2026-08-28.md`。

## 目录结构

```
dsh-web-cli-flavor/
├── cordis.patch.yml        # 插件声明（注册 web-cli-flavor 条目）
├── package.json            # 插件包元数据
├── lib/
│   ├── client.template.js  # ★ 皮肤 JS 源码（唯一 JS 源，改这里）
│   ├── client.js           # ★ 构建产物（build 时内联 CSS，勿手改）
│   └── index.js            # 插件入口（宿主侧：注册 /readonly /workspace /fullacc 别名）
└── styles/
    └── cli-flavor.css      # ★ 皮肤 CSS 源码（唯一 CSS 源，改这里）
scripts/
├── build.mjs               # 构建：CSS 内联进 client.js
└── install.ps1             # 安装：把皮肤装进指定 dsh profile
```

## 安装（全新电脑）

### 前置

- 已安装 dsh（`dsh.cmd --version` 可运行）
- 目标 profile（如 `web`）存在：`C:\Users\<你>\.dsh\profiles\web\`

### 步骤

1. **放入插件目录**：把 `dsh-web-cli-flavor` 文件夹复制到 profile 的 node_modules 下
   ```
   C:\Users\<你>\.dsh\profiles\web\node_modules\dsh-web-cli-flavor\
   ```
2. **profile 注册插件**：编辑 `C:\Users\<你>\.dsh\profiles\web\cordis.patch.yml`，追加：
   ```yaml
   - insert:
       - id: web-cli-flavor
         name: 'dsh-web-cli-flavor'
         config: {}
   ```
3. **构建**（把 CSS 内联进 client.js；改动源码后每次都要）：
   ```powershell
   cd dsh-web-cli-flavor
   node scripts/build.mjs
   ```
4. **安装到 profile**：
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/install.ps1
   ```
5. **重启 dsh web 服务** + 浏览器 **Ctrl+Shift+R** 强刷。

> 只想直接用、不改源码时，可跳过第 3 步——`lib/client.js` 已是构建好的最新产物，
> 复制进 profile 即可（JS 按请求从磁盘服务，强刷即生效）。

## 日常开发规则（接手必读）

- **改样式** → 只改 `styles/cli-flavor.css`；**改逻辑** → 只改 `lib/client.template.js`；
  然后 `node scripts/build.mjs` + install + 强刷。
- `lib/client.js` 是构建产物，**禁止手改**。
- **选择器规则**：不用 hash class（官方 CSS module 类名会变）；用稳定锚点
  （`data-slot`、`[class$="_语义后缀"]`、`--dsw-*`/`--cli-*` 变量、`data-*` 属性）。
- 皮肤 JS 异常会被 rAF try/catch 吞掉且无日志 → 改完必须实测 DOM。
- 深浅主题：色值全部走 `--dsw-alias-*` 令牌，自动跟随。
- 性能红线：body 级 MutationObserver 一律走 `watchBody()`（rAF 合并、永不 disconnect）；
  不新增常驻 setInterval 轮询（改事件驱动 / IntersectionObserver / document.hidden 门控）。

## 已实现功能清单（2026-08-28）

| 功能 | 位置 |
|---|---|
| 全局等宽字体（Cascadia Code 优先，CJK Sarasa/Noto 兜底） | css §1 |
| 输入区 `>` 提示符 + 块状光标 + hairline 分隔 | template §3.0/§3.1 |
| 大段粘贴折叠提示条（≥6 行/600 字符，`▸ N 行 · M 字符`） | template §3.1c + css §18 |
| 长文本输入区修复：grow 钳制 288px（滚到底完整可见、删除缩回兜底） | template §3.1d + css §19 |
| 发送即上屏兜底（官方延迟时插入临时气泡 + 滚到底） | template §3.1f + css §20 |
| QueueDock 队列条终端化（无框灰字、`⑂` 前缀、与 `>` 对齐、折叠 `▸`/展开 `▾`） | css §21 |
| 完整状态栏 StatsBar（替换官方 StatsLine，模型·轮步·token·缓存·ctx） | template StatsBar + css §6.6b |
| CLI 选择器（ask_user_question 内嵌终端化，多选/自定义输入/Esc） | template §5 |
| Esc 中断生成 / todo 终端化 / `/effort` 命令 / 终端签名（favicon+标题） | template 各段 |
| 性能：hero 美术移除（回归官方默认）、A5 轮询瘦身、watchBody 统一观察者 | template §4e + css |
