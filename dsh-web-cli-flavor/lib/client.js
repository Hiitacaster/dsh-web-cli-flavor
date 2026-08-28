/**
 * ============================================================================
 * dsh-web-cli-flavor — 浏览器半侧（browser half）
 * ----------------------------------------------------------------------------
 * 在 DSH Web GUI 中注入"终端风格皮肤"：
 *   1. 注入整套 CSS（等宽字体 + Gentle Mist Blue 浅/深色板 + 终端质感细节）
 *   2. 在消息输入框前插入 `❯` 终端提示符（Claude Code 命令行感）
 *
 * 本文件由 scripts/build.mjs 从 lib/client.template.js 生成：
 *   - /*__CLI_FLAVOR_CSS__*\/ 占位符会被 styles/cli-flavor.css 的内容替换
 *   - 不要直接手改 lib/client.js（会被覆盖）；请改模板或 CSS 后重新构建
 * ============================================================================
 */
window.__ModuleLoader__.load({
	id: 'dsh-web-cli-flavor',
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		// ---- 一次性初始化守卫：热重载/重复挂载时跳过，防止重复注入提示符/光标 ----
		if (typeof window !== 'undefined' && window.__DSH_CLI_FLAVOR_BOOTED__) {
			return module.exports;
		}
		if (typeof window !== 'undefined') {
			window.__DSH_CLI_FLAVOR_BOOTED__ = true;
		}

		// ---- 从 DSH 外壳取 React（不能自己打包 React）----
		let react = require('react');

		// ============================================================================
		// 1. 注入皮肤 CSS（一次性；热重载/重复挂载时去重）
		// ============================================================================
		const css = "/* ============================================================================\n * dsh-web-cli-flavor — Web GUI 终端风格皮肤\n * ----------------------------------------------------------------------------\n * 设计来源：参考 ccch1mneyyy/dsh-TUI（Claude Code 风格）的 \"Gentle Mist Blue\"\n * 色板与终端质感，但保留 DSH Web GUI 的完整界面（非全 CLI）。\n *\n * 实现方式：覆盖 DSH Web 前端的 CSS 变量体系\n *   - 字体：--dsw-font-family / --ds-font-family-code（全部派生自前者）\n *   - 浅色板：body 作用域（GUI 默认浅色）\n *   - 深色板：body[data-ds-dark-theme] 作用域（GUI 深色模式）\n *\n * 本文件是样式\"单一事实来源\"；lib/client.js 内联同一份 CSS 注入页面，\n * scripts/build.mjs 负责从 client.js 抽取同步（或反向）。\n * ========================================================================== */\n\n/* ---------------------------------------------------------------------------\n * 1. 字体：全局等宽（终端感），CJK 用 Sarasa/Noto Mono 兜底\n * ------------------------------------------------------------------------- */\n:root {\n  --dsw-font-family: \"Cascadia Code\", \"JetBrains Mono\", \"SF Mono\", \"Fira Code\",\n    \"Cascadia Mono\", Consolas, \"Liberation Mono\", Menlo, Courier,\n    \"Sarasa Mono SC\", \"Sarasa Term SC\", \"Noto Sans Mono CJK SC\",\n    \"Source Han Mono SC\", \"Microsoft YaHei\", monospace;\n  --ds-font-family-code: \"Cascadia Code\", \"JetBrains Mono\", \"SF Mono\",\n    \"Fira Code\", \"Cascadia Mono\", Consolas, \"Liberation Mono\", Menlo, Courier,\n    \"Sarasa Mono SC\", \"Sarasa Term SC\", \"Noto Sans Mono CJK SC\",\n    \"Source Han Mono SC\", \"Microsoft YaHei\", monospace;\n}\n\n/* ---------------------------------------------------------------------------\n * 2. OMP light 浅色板（Q6：以 dsh-ctui lightTheme 代码官方值为准）\n *    正文 #2d2d30、弱化 #767676、次级 #6c6c6c、强调蓝 #547da7、\n *    状态行底 #f0f0f0、用户消息底 #e8e8e8（hover #dedee6）、\n *    markdown 标题 #9a7326 / 链接 #547da7 / 代码 #5a8080 / 列表符 #588458。\n * ------------------------------------------------------------------------- */\nbody {\n  --dsw-alias-bg-base: #fafafa;\n  --dsw-alias-bg-layer-1: #f0f0f0;\n  --dsw-alias-bg-layer-2: #e8e8e8;\n  --dsw-alias-bg-layer-3: #dedee6;\n  --dsw-alias-bg-overlay: #e0e0e0;\n  --dsw-alias-bg-module-platform: #e8e8e8;\n  --dsw-alias-bg-mask-1: rgba(45, 45, 48, 0.5);\n  --dsw-alias-bg-mask-2: rgba(45, 45, 48, 0.12);\n  --dsw-alias-bg-mask-3: rgba(45, 45, 48, 0.48);\n  --dsw-alias-bg-skeleton: rgba(45, 45, 48, 0.08);\n\n  --dsw-alias-label-primary: #2d2d30;\n  --dsw-alias-label-primary-bluish: #2d2d30;\n  --dsw-alias-label-primary-foreground: #ffffff;\n  --dsw-alias-label-primary-inverted: #ffffff;\n  --dsw-alias-label-secondary: #767676;\n  --dsw-alias-label-tertiary: #6c6c6c;\n  --dsw-alias-label-dimmed: #a0a0a0;\n  --dsw-alias-label-caption: #a0a0a0;\n\n  --dsw-alias-brand-primary: #547da7;\n  --dsw-alias-brand-primary-invert: #ffffff;\n  --dsw-alias-brand-text: #ffffff;\n\n  --dsw-alias-border-l1: rgba(45, 45, 48, 0.08);\n  --dsw-alias-border-l2: rgba(45, 45, 48, 0.14);\n  --dsw-alias-border-l3: rgba(45, 45, 48, 0.22);\n  --dsw-alias-border-l4: rgba(45, 45, 48, 0.3);\n  --dsw-alias-border-inverted: rgba(45, 45, 48, 0.06);\n\n  --dsw-alias-button-primary-fill: #547da7;\n  --dsw-alias-button-primary-hover: #6d93c0;\n  --dsw-alias-button-primary-dimmed: #d8e2ee;\n  --dsw-alias-button-elevated-fill: #e8e8e8;\n  --dsw-alias-button-floating-fill: #fafafa;\n  --dsw-alias-button-floating-hover: #f0f0f0;\n  --dsw-alias-button-contrast-fill: #2d2d30;\n  --dsw-alias-button-ghost-active-fill: #e8e8e8;\n  --dsw-alias-button-ghost-active-hover: #dedee6;\n  --dsw-alias-button-info-fill: #547da7;\n  --dsw-alias-button-info-hover: #6d93c0;\n  --dsw-alias-button-tool-bar-fill: rgba(45, 45, 48, 0.08);\n  --dsw-alias-button-tool-bar-hover: rgba(45, 45, 48, 0.16);\n  --dsw-alias-button-tool-bar-fill-invisible: rgba(45, 45, 48, 0.04);\n\n  --dsw-alias-interactive-bg-hover: rgba(45, 45, 48, 0.07);\n  --dsw-alias-interactive-bg-active: rgba(45, 45, 48, 0.14);\n  --dsw-alias-interactive-bg-hover-solid: #dedee6;\n  --dsw-alias-interactive-bg-hover-accent: rgba(84, 125, 167, 0.14);\n  --dsw-alias-interactive-bg-hover-danger: rgba(170, 85, 85, 0.14);\n\n  --dsw-alias-state-success-primary: #588458;\n  --dsw-alias-state-success-secondary: #588458;\n  --dsw-alias-state-success-tertiary: #e8f0e8;\n  --dsw-alias-state-error-primary: #aa5555;\n  --dsw-alias-state-error-secondary: #aa5555;\n  --dsw-alias-state-warn-primary: #9a7326;\n  --dsw-alias-state-warn-secondary: #9a7326;\n  --dsw-alias-state-warn-label: #9a7326;\n  --dsw-alias-state-warn-tertiary: #f0e8d8;\n  --dsw-alias-state-business-primary: #547da7;\n  --dsw-alias-state-business-tertiary: #d8e2ee;\n\n  --dsw-alias-markdown-code-block: #e8e8f0;\n  --dsw-alias-markdown-code-block-banner: #e8e8e8;\n  --dsw-alias-markdown-inline-code: #e8e8f0;\n  --dsw-alias-markdown-citation: #e8e8e8;\n  --dsw-alias-markdown-placeholder: #e8e8e8;\n  --dsw-alias-markdown-tag: #e8e8e8;\n\n  --dsw-alias-scrollbar-bg-l1: #d5d5d5;\n  --dsw-alias-scrollbar-bg-l2: #c8c8c8;\n  --dsw-alias-scrollbar-hover-l1: #bfbfbf;\n  --dsw-alias-scrollbar-hover-l2: #b4b4b4;\n\n  --dsw-alias-tooltip-bg: #2d2d30;\n  --dsw-alias-toast-bg: #2d2d30;\n  --dsw-alias-hovercard-bg: #fafafa;\n\n  --dsw-specific-sidebar-fill: #f0f0f0;\n  --dsw-specific-sidebar-nav-item-active: #e8e8e8;\n  --dsw-specific-sidebar-nav-item-hover: #dedee6;\n  --dsw-specific-sidebar-nav-item-active-accent: #d0d0e0;\n  --dsw-specific-input-major: #fafafa;\n  --dsw-specific-bubble: #e8e8e8;\n  --dsw-specific-bubble-highlight: #dedee6;\n  --dsw-specific-menu: #fafafa;\n  --dsw-specific-selector: #e8e8e8;\n  --dsw-specific-tip: #e8e8e8;\n  --dsw-specific-login-input: #fafafa;\n}\n\n/* ---------------------------------------------------------------------------\n * 3. OMP dark 深色板（Q3=D：深色版用 dsh-TUI 官方 darkTheme 重做，统一风格）\n *    正文 #d4d4d4、弱化 #5f6673、次级 #777d88、链接蓝 #0088fa、\n *    强调金 #febc38、状态行底 #121212、用户消息底 #221d1a（hover #2a241f）、\n *    markdown 标题金 / 链接蓝 / 代码紫 #e5c1ff / 列表符金。\n * ------------------------------------------------------------------------- */\nbody[data-ds-dark-theme] {\n  --dsw-alias-bg-base: #121212;\n  --dsw-alias-bg-layer-1: #161a1f;\n  --dsw-alias-bg-layer-2: #1d2129;\n  --dsw-alias-bg-layer-3: #22262e;\n  --dsw-alias-bg-overlay: #292d33;\n  --dsw-alias-bg-module-platform: #1d2129;\n  --dsw-alias-bg-mask-1: rgba(0, 0, 0, 0.55);\n  --dsw-alias-bg-mask-2: rgba(0, 0, 0, 0.22);\n  --dsw-alias-bg-mask-3: rgba(0, 0, 0, 0.5);\n  --dsw-alias-bg-skeleton: rgba(212, 212, 212, 0.08);\n\n  --dsw-alias-label-primary: #d4d4d4;\n  --dsw-alias-label-primary-bluish: #d4d4d4;\n  --dsw-alias-label-primary-foreground: #121212;\n  --dsw-alias-label-primary-inverted: #121212;\n  --dsw-alias-label-secondary: #9aa0aa;\n  --dsw-alias-label-tertiary: #777d88;\n  --dsw-alias-label-dimmed: #5f6673;\n  --dsw-alias-label-caption: #5f6673;\n\n  --dsw-alias-brand-primary: #0088fa;\n  --dsw-alias-brand-primary-invert: #121212;\n  --dsw-alias-brand-text: #d4d4d4;\n\n  --dsw-alias-border-l1: rgba(212, 212, 212, 0.08);\n  --dsw-alias-border-l2: rgba(212, 212, 212, 0.14);\n  --dsw-alias-border-l3: rgba(212, 212, 212, 0.22);\n  --dsw-alias-border-l4: rgba(212, 212, 212, 0.3);\n  --dsw-alias-border-inverted: rgba(212, 212, 212, 0.06);\n  --dsw-alias-border-inverted2: rgba(212, 212, 212, 0.1);\n\n  --dsw-alias-button-primary-fill: #0088fa;\n  --dsw-alias-button-primary-hover: #4aa8ff;\n  --dsw-alias-button-primary-dimmed: #22262e;\n  --dsw-alias-button-elevated-fill: #22262e;\n  --dsw-alias-button-floating-fill: #1d2129;\n  --dsw-alias-button-floating-hover: #22262e;\n  --dsw-alias-button-contrast-fill: #d4d4d4;\n  --dsw-alias-button-ghost-active-fill: #22262e;\n  --dsw-alias-button-ghost-active-hover: #292d33;\n  --dsw-alias-button-ghost-active-border: #777d88;\n  --dsw-alias-button-info-fill: #0088fa;\n  --dsw-alias-button-info-hover: #4aa8ff;\n  --dsw-alias-button-tool-bar-fill: rgba(93, 99, 112, 0.45);\n  --dsw-alias-button-tool-bar-hover: rgba(93, 99, 112, 0.6);\n  --dsw-alias-button-tool-bar-fill-invisible: rgba(18, 18, 18, 0.4);\n\n  --dsw-alias-interactive-bg-hover: rgba(212, 212, 212, 0.08);\n  --dsw-alias-interactive-bg-active: rgba(212, 212, 212, 0.14);\n  --dsw-alias-interactive-bg-hover-solid: #22262e;\n  --dsw-alias-interactive-bg-hover-accent: rgba(0, 136, 250, 0.18);\n  --dsw-alias-interactive-bg-hover-danger: rgba(252, 58, 75, 0.16);\n\n  --dsw-alias-state-success-primary: #89d281;\n  --dsw-alias-state-success-secondary: #89d281;\n  --dsw-alias-state-success-tertiary: #1f3322;\n  --dsw-alias-state-error-primary: #fc3a4b;\n  --dsw-alias-state-error-secondary: #fc3a4b;\n  --dsw-alias-state-warn-primary: #e4c00f;\n  --dsw-alias-state-warn-secondary: #e4c00f;\n  --dsw-alias-state-warn-label: #e4c00f;\n  --dsw-alias-state-warn-tertiary: #3e3326;\n  --dsw-alias-state-business-primary: #0088fa;\n  --dsw-alias-state-business-tertiary: #123a66;\n\n  --dsw-alias-markdown-code-block: #161a1f;\n  --dsw-alias-markdown-code-block-banner: #1d2129;\n  --dsw-alias-markdown-inline-code: #1a1e24;\n  --dsw-alias-markdown-citation: #1d2129;\n  --dsw-alias-markdown-placeholder: #1d2129;\n  --dsw-alias-markdown-tag: #1d2129;\n\n  --dsw-alias-scrollbar-bg-l1: #3d424a;\n  --dsw-alias-scrollbar-bg-l2: #31363f;\n  --dsw-alias-scrollbar-hover-l1: #4a505c;\n  --dsw-alias-scrollbar-hover-l2: #55606f;\n\n  --dsw-alias-tooltip-bg: #292d33;\n  --dsw-alias-toast-bg: #292d33;\n  --dsw-alias-hovercard-bg: #22262e;\n\n  --dsw-specific-sidebar-fill: #121212;\n  --dsw-specific-sidebar-nav-item-active: #1d2129;\n  --dsw-specific-sidebar-nav-item-hover: #161a1f;\n  --dsw-specific-sidebar-nav-item-active-accent: #292d33;\n  --dsw-specific-input-major: #161a1f;\n  --dsw-specific-bubble: #221d1a;\n  --dsw-specific-bubble-highlight: #2a241f;\n  --dsw-specific-menu: #1d2129;\n  --dsw-specific-selector: #22262e;\n  --dsw-specific-tip: #1d2129;\n  --dsw-specific-login-input: #121212;\n}\n\n/* ---------------------------------------------------------------------------\n * 3b. 深色板静态色重映射（OMP dark 中性灰阶）\n *     部分组件直接引用 --dsw-static-neutral-bluish-*（不经 alias），\n *     把常用档位统一重映射为 OMP dark 灰阶，保证侧边栏/输入卡/按钮全部换肤。\n * ------------------------------------------------------------------------- */\nbody[data-ds-dark-theme] {\n  --dsw-static-neutral-bluish-1000: #0a0a0c;\n  --dsw-static-neutral-bluish-950: #121212;\n  --dsw-static-neutral-bluish-900: #161a1f;\n  --dsw-static-neutral-bluish-875: #1a1e24;\n  --dsw-static-neutral-bluish-850: #1d2129;\n  --dsw-static-neutral-bluish-800: #22262e;\n  --dsw-static-neutral-bluish-750: #292d33;\n  --dsw-static-neutral-bluish-700: #31363f;\n  --dsw-static-neutral-bluish-600: #3d424a;\n  --dsw-static-neutral-bluish-500: #5f6673;\n  --dsw-static-neutral-bluish-400: #777d88;\n  --dsw-static-neutral-bluish-300: #9aa0aa;\n  --dsw-static-neutral-bluish-200: #b0b6c0;\n  --dsw-static-neutral-bluish-150: #c8ccd2;\n  --dsw-static-neutral-bluish-100: #d4d4d4;\n  --dsw-static-neutral-bluish-75: #dde0e4;\n  --dsw-static-neutral-bluish-60: #e4e6e8;\n  --dsw-static-neutral-bluish-50: #eaecee;\n  --dsw-static-neutral-bluish-00: #f2f3f4;\n}\n\n/* ---------------------------------------------------------------------------\n * 3c. 皮肤自定义组件语义变量（浅/深双主题自动切换）\n *     供 §4-7 里我们注入的 .dsh-cli-* 元素引用，色值全部来自 OMP 官方 token。\n * ------------------------------------------------------------------------- */\n:root {\n  --cli-accent: #547da7;\n  --cli-accent-soft: #6d93c0;\n  --cli-text: #2d2d30;\n  --cli-subtle: #6c6c6c;\n  --cli-border-strong: rgba(45, 45, 48, 0.16);\n  --cli-border-soft: rgba(45, 45, 48, 0.1);\n  --cli-prompt: #2d2d30;\n  --cli-cursor: #547da7;\n  --cli-selection: rgba(84, 125, 167, 0.35);\n  --cli-user-bubble: #e8e8e8;\n  --cli-user-bubble-hover: #dedee6;\n  --cli-tool-bg: #e8e8f0;\n  --cli-status-bg: #f0f0f0;\n  --cli-cursor-block: #2d2d30; /* 浅色界面：深灰长方形块光标（图1 式） */\n  --cli-cursor-bg-rev: #000000; /* 覆盖态反色背景（浅色：黑） */\n  --cli-cursor-fg-rev: #ffffff; /* 覆盖态反色文字（浅色：白） */\n  --cli-stats-model: #8a5a7a; /* OMP statusLineModel 浅色 */\n  --cli-stats-sep: #767676;\n  --cli-stats-counts: #9a7326;\n  --cli-stats-duration: #4a7d8c;\n  --cli-stats-cache: #588458;\n  --cli-stats-context: #6a6a8a;\n  --cli-stats-cost: #a0603a;\n  --cli-stats-subagents: #9a7326;\n  --cli-thinking: #767676;\n  --cli-thinking-high: #7e57c2;\n  --cli-md-heading: #9a7326;\n  --cli-md-link: #547da7;\n  --cli-md-code: #5a8080;\n  --cli-md-quote: #6c6c6c;\n  --cli-md-bullet: #588458;\n  --cli-diff-added: #e8f0e8;\n  --cli-diff-removed: #f0e8e8;\n  --cli-diff-added-word: #588458;\n  --cli-diff-removed-word: #aa5555;\n}\nbody[data-ds-dark-theme] {\n  --cli-accent: #0088fa;\n  --cli-accent-soft: #4aa8ff;\n  --cli-text: #d4d4d4;\n  --cli-subtle: #777d88;\n  --cli-border-strong: rgba(212, 212, 212, 0.16);\n  --cli-border-soft: rgba(212, 212, 212, 0.08);\n  --cli-prompt: #d4d4d4;\n  --cli-cursor: #0088fa;\n  --cli-selection: rgba(0, 136, 250, 0.35);\n  --cli-user-bubble: #221d1a;\n  --cli-user-bubble-hover: #2a241f;\n  --cli-tool-bg: #1d2129;\n  --cli-status-bg: #121212;\n  --cli-cursor-block: #cccccc; /* 深色界面：浅灰长方形块光标（图1 实测 #CCCCCC） */\n  --cli-cursor-bg-rev: #ffffff; /* 覆盖态反色背景（深色：白，图2） */\n  --cli-cursor-fg-rev: #000000; /* 覆盖态反色文字（深色：黑） */\n  --cli-stats-model: #d787af; /* OMP statusLineModel 深色 */\n  --cli-stats-sep: #5f6673;\n  --cli-stats-counts: #febc38;\n  --cli-stats-duration: #5fafaf;\n  --cli-stats-cache: #5faf5f;\n  --cli-stats-context: #8787af;\n  --cli-stats-cost: #d7875f;\n  --cli-stats-subagents: #febc38;\n  --cli-thinking: #5f6673;\n  --cli-thinking-high: #b281d6;\n  --cli-md-heading: #febc38;\n  --cli-md-link: #0088fa;\n  --cli-md-code: #e5c1ff;\n  --cli-md-quote: #777d88;\n  --cli-md-bullet: #febc38;\n  --cli-diff-added: #1f3322;\n  --cli-diff-removed: #331f21;\n  --cli-diff-added-word: #89d281;\n  --cli-diff-removed-word: #fc3a4b;\n}\n\n/* ---------------------------------------------------------------------------\n * 4. 终端质感细节（两种主题通用）\n * ------------------------------------------------------------------------- */\n\n/* 选区：CLI 黑白反色（用户要求：不要蓝）\n   深色界面 → 白底黑字；浅色界面 → 黑底白字（终端反色选中） */\n::selection {\n  background: #000000 !important;\n  color: #ffffff !important;\n}\nbody[data-ds-dark-theme] ::selection {\n  background: #ffffff !important;\n  color: #000000 !important;\n}\n\n/* 输入光标：强调蓝 */\ntextarea,\ninput {\n  caret-color: var(--cli-accent);\n}\n\n/* 代码块：去圆角毛玻璃，扁平终端卡 */\nbody[data-ds-dark-theme] .markdown code,\nbody[data-ds-dark-theme] pre,\nbody[data-ds-dark-theme] [class*=\"codeBlock\"],\nbody[data-ds-dark-theme] [class*=\"code-block\"] {\n  border-radius: 4px;\n}\n\n/* 滚动条更细、更扁平（Webkit 内核） */\n::-webkit-scrollbar {\n  width: 8px;\n  height: 8px;\n}\n::-webkit-scrollbar-thumb {\n  border-radius: 4px;\n}\n::-webkit-scrollbar-track {\n  background: transparent;\n}\n\n/* 正文排版密度微调：更贴近终端行高 */\nbody {\n  letter-spacing: 0;\n  -webkit-font-smoothing: antialiased;\n}\n\n/* 主输入卡：22px 大圆角 → 收敛为终端感小圆角（唯一含 textarea 的卡片） */\ndiv:has(textarea) {\n  border-radius: 8px !important;\n}\n\n/* ❯ 提示符所在容器：左侧留白，避免贴住圆角边缘 */\ndiv:has(> .dsh-cli-prompt) {\n  padding-left: 12px;\n}\n\n/* 提示符与文字水平对齐（HANDOFF 踩坑 13）：\n   textarea 是 absolute 定位，不受 host padding 影响，文字起点 = 自身 paddingLeft。\n   S2 更新：`>` 已贴卡左缘（left 0 = 消息列 304），文字起点收到 paddingLeft 16px\n   （原 28px 让 > 到文字间距 19px 太远，用户反馈；现 16px → 间距 ~7px） */\ndiv:has(> .dsh-cli-prompt) textarea,\ndiv:has(> .dsh-cli-prompt) [class$=\"_backdrop\"] {\n  padding-left: 16px !important;\n}\n\n/* 右下角宠物（dsh-pet）：轻微降饱和/压暗，与终端风格融合（可删此段恢复原样） */\n.dsh-pet-root video {\n  filter: saturate(0.78) brightness(0.9) contrast(0.98);\n}\n/* 桌宠不拦截点击：根容器自身 pointer-events:none 已足够，不挡界面操作。\n   注意：不要用 .dsh-pet-root * 禁掉整个子树——内部画布（canvas）依赖\n   pointer-events:auto 接收鼠标事件，禁掉后桌宠会变得无法拖拽/点击互动\n   （历史踩坑：曾全子树放行导致桌宠拖不动，见 diag 记录）。 */\n.dsh-pet-root {\n  pointer-events: none !important;\n}\n\n/* ---------------------------------------------------------------------------\n * 5. > 终端提示符（由 client.js 插入 .dsh-cli-prompt，Claude Code 风格）\n *    绝对定位对齐文字行：文字行盒顶 = textarea paddingTop(4px)，行高 24px，\n *    font-size 16px 与正文同号 → `>` 字形在行盒内自然垂直居中（与输入字符一致）。\n * ------------------------------------------------------------------------- */\n.dsh-cli-prompt {\n  position: absolute;\n  left: 0; /* 贴输入卡左缘 = 消息列左缘，与用户消息前 `>` 垂直对齐（S2） */\n  top: 4px;\n  font-size: 16px;\n  line-height: 24px;\n  display: block;\n  color: var(--cli-prompt);\n  font-weight: 400;\n  user-select: none;\n}\n\n/* ============================================================================\n * 6. 输入栏终端化（PLAN-input-bar · 深色）\n * ----------------------------------------------------------------------------\n * Q1 去卡片化 / Q2 保留 ❯ / Q3 无占位符 / Q4 块光标(JS) / Q5-15 状态行 /\n * Q16 纯键盘 Esc / Q17 隐藏发送按钮\n * 选择器策略：结构(:has) + 稳定 aria-label，不依赖哈希类名。\n * ========================================================================== */\n\n/* 6.1 主输入卡去卡片化：透明背景、无阴影、无边框、无圆角——彻底无\"方框\"感；\n   四周边框交给下方 6.1b 的上下 hairline（Claude Code 输入区无卡片框） */\ndiv:has(textarea) {\n  background: transparent !important;\n  box-shadow: none !important;\n  border-color: transparent !important;\n  border-radius: 0 !important;\n}\n\n/* 6.1b 输入区边界：上下两条终端 hairline（2px，文字色，用户拍板）\n   间距比例复刻 Claude Code 参考图（用户要求按相对关系，不锁死像素）：\n   上线→文字 ≈ 0.75em（padding-top 0.25em + textarea 内部 0.5em）\n   文字→下线 ≈ 0.6em（textarea 内部 0.25em + padding-bottom 0.375em）\n   两线间距 ≈ 2.4em，上下留白近似对称、上线侧略宽松（视觉平衡）。\n   选择器注意：不能用 [class$=\"_card\"]（$= 匹配整个 class 结尾，卡上有 seat 后缀\n   永远匹配不到）；用 [class*=\"_card\"]（子串匹配，_card 语义后缀稳定）。 */\n[class*=\"_card\"]:has(textarea) {\n  border-top: 2px solid var(--cli-text) !important;\n  border-bottom: 2px solid var(--cli-text) !important;\n  border-left: none !important;\n  border-right: none !important;\n  border-radius: 0 !important;\n  padding-top: 0.25em !important;\n  padding-bottom: 0.375em !important;\n}\n/* 若 JS 已把 seat 打在输入卡上，规则一致（无需重复）；若打错在外层容器，\n   用结构选择器覆盖它，避免横线框住 hero 欢迎区（.dsh-cli-composer-seat 可能\n   落在 wSkVaW_composerStack 上，它含标题但无 textarea 直接子） */\n.dsh-cli-composer-seat:not(:has(textarea)) {\n  border-top: none !important;\n  border-bottom: none !important;\n}\n\n/* 6.1c 输入栏宽度对齐消息区（S2 用户要求：> 与消息区 > 垂直对齐、长度平齐）\n   官方 _card max-width 780px → 移除；实测 root 内容宽 1120（含 padding），\n   卡宽 calc(100% - 16px) = 1104 与消息列(1104px) 一致，flex 居中后 left=304 对齐 */\n[class*=\"_card\"]:has(textarea) {\n  max-width: none !important;\n  width: calc(100% - 16px) !important;\n}\n\n/* 6.1d 输入栏区域不透明背景（S2 修复滚动重叠）\n   消息滚动容器 overflow:visible，滚动中消息文字会溢出滚动区底部；\n   输入栏原为透明背景 → 溢出的文字透过输入栏显示 = 重叠。\n   给 composer 最外层容器补页面底色背景，滚动时消息被输入栏区域盖住。 */\n[class$=\"_composerStack\"] {\n  background: var(--dsw-alias-bg-base) !important;\n}\n\n/* 6.1e 空（hero 输入栏贴底——2026-08-19 尝试中，hero 布局复杂暂缓；\n   当前保留 §6.5c 高度钳制，输入卡不随长文本撑高，页面不滚动） */\n\n/* 6.1f 输入区面板背景（用户反馈\"输入框变成透明的了，文本和对话记录混在一起\"）：\n   §6.1 透明卡在多消息/长文本时输入文字与对话视觉连片。补一层面板底、\n   状态行同底、宽度对齐卡 calc(100% - 16px)，底部输入栏一体成块、与对话清晰分隔。\n   ⚠️ 2026-08-20 用户要求去掉色差：背景改用页面同色 --dsw-alias-bg-base\n   （#121212），不再用提亮的 --dsw-alias-bg-layer-1（#161a1f）——输入区与对话区\n   背景一致，仅靠 hairline 分隔。\n   选择器 (0,1,0) 压过 §6.1 div:has(textarea) (0,0,2)。 */\n.dsh-cli-composer-seat {\n  background: var(--dsw-alias-bg-base) !important;\n}\n.dsh-cli-statsbar {\n  background: var(--dsw-alias-bg-base) !important;\n  width: calc(100% - 16px) !important;\n  justify-content: center !important;\n}\n\n/* 6.2 空输入无占位符（Q3）——隐藏文字但不删元素（防 IME 遮挡）。\n   必须同时透明 color 与 -webkit-text-fill-color：§6.2b 给 textarea 设了\n   text-fill-color=文字色，而 text-fill-color 会覆盖 ::placeholder 的透明 color\n   （S2 用户反馈\"给智能体发消息\"占位符又显示出来，根因在此） */\ndiv:has(textarea) textarea::placeholder {\n  color: transparent !important;\n  -webkit-text-fill-color: transparent !important;\n}\n\n/* 6.2b 输入框文字恢复原生显示（S2 修复滚动重合）\n   原架构：textarea 透明 + backdrop 渲染文字（为块光标模拟）。\n   光标已改原生竖线 → textarea 直接显示文字（原生滚动裁剪，不重合），\n   隐藏 backdrop（官方 backdrop 滚动不同步，导致滚动时文字溢出输入栏） */\ndiv:has(textarea) textarea {\n  color: var(--cli-text) !important;\n  -webkit-text-fill-color: var(--cli-text) !important;\n}\ndiv:has(textarea) [class$=\"_backdrop\"] {\n  display: none !important;\n}\n\n/* 6.3 原生 caret 隐藏（光标 = JS 长方形块，§6.8；避免竖线+方块双光标） */\nhtml.dsh-cli-js-ready div:has(textarea) textarea {\n  caret-color: transparent !important;\n}\n\n/* 6.4 输入区底部工具行整体隐藏（用户拍板：Claude Code 风格，去掉 + / Full access /\n   模型选择 / 发送箭头，只留两条横线夹住的文本行）\n   - 容器 [class$=\"_row\"]（uV2eYG_row，含全部工具按钮）display:none\n   - 发送/停止按钮同样隐藏，但 DOM 保留——Esc 中断的 JS stopBtn.click() 照常工作；\n     Enter 提交由官方 keydown 处理，纯键盘双通道不受影响\n   - ⚠️ 选择器必须用「输入卡(_card)内的 _row」，不能用 `div:has(textarea) [class$=\"_row\"]`：\n     后者会命中含 textarea 的整个对话根容器下所有以 _row 结尾的元素——命令结果卡片\n     的行容器（GenericCommandCard 的 VAXeoG_row）也被 display:none，导致命令执行后\n     UI 毫无反应（S4 实测根因）。 _card 是 textarea 的直接卡片祖先，工具行在卡内。 */\ndiv:has(textarea) .dsh-cli-composer-seat [class$=\"_row\"] {\n  display: none !important;\n}\n/* 双保险：显式隐藏发送/停止按钮本体（父行隐藏后子元素不可见，但防布局变体） */\ndiv:has(textarea) button[aria-label=\"发送消息\"],\ndiv:has(textarea) button[aria-label=\"Send message\"],\ndiv:has(textarea) button[aria-label=\"停止生成\"],\ndiv:has(textarea) button[aria-label=\"Stop generating\"] {\n  display: none !important;\n}\n\n/* 6.4b 下拉选择器箭头隐藏（Claude Code 状态行是纯文字，无 ▾ 箭头）：\n   CSS modules 类名为「哈希_语义名」，语义后缀稳定 */\n[class$=\"_chevron\"],\n[class$=\"_triggerIcon\"],\n[class$=\"_trigger\"] svg,\n[class$=\"_workspace\"] svg,\n[class$=\"_seat\"] svg,\n[class$=\"_triggerEffort\"]::before {\n  display: none !important;\n}\n/* ⚠️ 例外：侧边栏「设置」按钮的齿轮图标（VOzbGW_trigger 也以 _trigger 结尾，\n   被上面规则误伤 display:none——恢复显示。用户要求展开态也显示齿轮。 */\n[class*=\"sidebarCol\"] [class$=\"_trigger\"] svg {\n  display: block !important;\n}\n\n/* 6.4c 选择器文字终端化：等宽、弱化背景，像状态行文字段 */\n[class$=\"_trigger\"],\n[class$=\"_triggerLabel\"],\n[class$=\"_triggerEffort\"],\n[class$=\"_workspace\"],\n[class$=\"_seat\"] {\n  background: transparent !important;\n  border: none !important;\n  box-shadow: none !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n}\n\n/* 6.5 多行输入上限：最高 10 行 ≈ 320px，超出内部滚动（Q10 原始 5 行/160px，\n   2026-08-19 用户反馈：贴长文时 160px 太小 + overlay 滚动条不可见 → 一大截文字\n   \"消失\"感。放宽到 10 行/320px 缓解；滚动条样式保持系统默认）\n   加 !important：官方样式会把 overflow-y 覆盖为 hidden，导致超出不能滚 */\ndiv:has(textarea) textarea {\n  max-height: 320px;\n  overflow-y: auto !important;\n}\n\n/* 6.5b 双滚动条修复（2026-08-19 用户反馈）：textarea 外层包裹容器 _scroll 也是\n   overflow-y:auto 且内容超高（360>336），与 textarea 自身的滚动条叠在同一右缘，\n   看起来是两个滚动条。textarea 已能滚，外层滚动纯多余 → 禁用外层的垂直滚动，\n   只留 textarea 一个滚动条。\n   ⚠️ 选择器铁律（§6.4 同款坑）：输入卡类名是 \"_card xxx\"（JS 打的 seat 后缀），\n   [class$=\"_card\"] 匹配整个 class 属性结尾永远不中！必须用 JS 打的稳定类\n   .dsh-cli-composer-seat（markComposerSeat 只打在输入卡上，最精确），\n   且不能裸 div:has(textarea) [class$=\"_scroll\"]——对话区滚动容器 fWNiuW_scroll\n   也以 _scroll 结尾、整个应用根都含 textarea，会误伤消息区滚动（用户实测）。\n   2026-08-21 修改：overflow 从 visible 改为 hidden + max-height:320px——裁剪职责\n   从输入卡（§6.5c 原 overflow:hidden）移到 _scroll。卡级 overflow:hidden 会把\n   向上展开的斜杠命令菜单 / /model 弹层（conversation.input.overlay 锚点在卡内\n   顶部，菜单 bottom:calc(100%+4px) 从卡顶向上开，最高 320px）整块裁掉，导致\n   命令被消费但 UI 不可见（用户实测 /model 无任何呈现）。_scroll 层裁剪内容为\n   mirror/backdrop（均不可见），无视觉影响；textarea 内部滚动不受影响。 */\ndiv:has(textarea) .dsh-cli-composer-seat [class$=\"_scroll\"] {\n  max-height: 320px !important;\n  overflow: hidden !important;\n}\n\n/* 6.5c 输入卡高度钳制（粘贴长文本回归修复）：\n   grow/卡被长文本撑高（504/350px），textarea 的 320px 内部滚动条被埋进\n   撑高的容器 → 钳制 seat 高 = 320 textarea + 12 padding + 2 hairline ≈ 334px，\n   内容在 textarea 内滚动，卡片不随内容增高。\n   2026-08-21 修改：去掉卡级 overflow:hidden（裁剪职责移到 §6.5b 的 _scroll 层）。\n   卡级 overflow:hidden 会把向上展开的斜杠命令菜单 / /model 弹层\n   （conversation.input.overlay 锚点在卡内顶部，弹层从卡顶向上开）整块裁掉，\n   导致命令被前端消费（后端照常执行）但 UI 完全不可见。max-height 钳制保留。 */\ndiv:has(textarea) .dsh-cli-composer-seat {\n  max-height: 334px !important;\n  /* 显式声明 visible：dist 补丁或旧版本可能残留卡级 overflow:hidden（会裁掉向上\n     展开的斜杠菜单 / /model 弹层），此处用 !important 压掉任何残留裁剪。 */\n  overflow: visible !important;\n}\n\n/* 6.5d 会话模式：输入栏贴死页面底端（用户要求\"输入框是整个页面的最底端，\n   不能往下滚动\"）：\n   root（uV2eYG_root，flex column，官方高 60+padB8）内容高补到 68 + padB 0，\n   justify-content:flex-end 把 [输入卡42, 状态行18] 组压到底 → 卡在上、\n   状态行贴死视口底 900；长文本时卡向上长（flex-shrink:0 不压缩），状态行\n   始终钉在最低端。仅会话模式（scrollBody 内无 composerHero）；hero 中部\n   布局不受影响。\n   ⚠️ 勿用 top / margin / transform / order 移卡片（四条死路，实测记录见\n   HANDOFF 踩坑 #22）。 */\n[class*=\"_scrollBody\"]:not(:has([class*=\"_composerHero\"])) div:has(> .dsh-cli-composer-seat) {\n  height: 68px !important;\n  padding-bottom: 0 !important;\n  justify-content: flex-end !important;\n}\n[class*=\"_scrollBody\"]:not(:has([class*=\"_composerHero\"])) .dsh-cli-composer-seat {\n  flex-shrink: 0 !important;\n}\n\n/* 6.5d2 输入卡真正脱离 scrollBody 滚动流（2026-08-20 根治\"输入框与对话记录\n   一起滚\"）：\n   §6.5d 用 justify-content:flex-end 只是\"压到底\"，seat 仍是 scrollBody 内容流的\n   最后一个子元素——scrollBody 滚动时 seat 跟着滚（实测 seatInScrollBody=true、\n   scrollBody scrollTop 6093/6093 滚到底，输入框视觉贴底但物理在流内）。\n   position:sticky; bottom:0 让 seat 固定在 scrollBody 可视底部：滚动对话时\n   seat 钉住不动、内容从上方滚过；输入框内部滚动与对话区彻底隔离。\n   ⚠️ 若 seat 容器非 sticky 兼容场景（hero 模式已排除），此规则仅命中会话模式。 */\n[class*=\"_scrollBody\"]:not(:has([class*=\"_composerHero\"])) div:has(> .dsh-cli-composer-seat) {\n  position: sticky !important;\n  bottom: 0 !important;\n}\n\n/* 6.5e 输入区滚动隔离（用户反馈\"粘贴长信息时整个对话框被滚动\"）：\n   textarea 滚到边界后滚轮链式上抛到消息区 scrollBody（实测 sbScrollTop\n   0→300）。overscroll-behavior:contain 让输入区独立滚动——输入区内滚动\n   只滚输入内容、不带动对话区；消息区自身滚动不受影响。\n   ⚠️ 必须同时给输入卡容器 .dsh-cli-composer-seat 设 contain（2026-08-20\n   用户反馈\"输入框往上滚时对话记录跟着滚\"）：只给 textarea 设 contain 不够——\n   textarea 向上滚到顶后 overscroll 链沿 DOM 上抛，_grow/_scroll/_card 都是\n   默认 overscroll auto，链会穿过它们到达消息区 scrollBody。给输入卡设\n   contain 才能截断整条链（输入卡是 textarea 到消息区之间的屏障）。 */\ndiv:has(textarea) textarea,\n.dsh-cli-composer-seat,\n.dsh-cli-composer-seat [class$=\"_scroll\"] {\n  overscroll-behavior: contain !important;\n}\n\n/* 6.5f 输入区不显示焦点环（用户反馈\"输入框多了两条金色的线\"）：\n   §14.2 :focus-visible 的 2px 金 outline 在 textarea 聚焦时形成上下两条\n   全宽金线；终端风格焦点指示 = 块光标（§6.8），不需要焦点环。\n   ⚠️ 特异性陷阱（实测）：div:has(textarea) textarea = (0,0,3)（:has 只算\n   参数特异性）输给 :focus-visible (0,1,0)——必须用带 class 的选择器\n   .dsh-cli-composer-seat textarea (0,1,1)。其余元素金环保留。 */\n.dsh-cli-composer-seat textarea {\n  outline: none !important;\n}\n\n/* S3：完整状态栏（React 组件替换官方 StatsLine，一个组件一行排开）\n   等宽 12px、OMP 分色、| 分隔符；nowrap 一行平铺 */\n.dsh-cli-statsbar {\n  display: flex;\n  align-items: center;\n  font-family: var(--dsw-font-family, monospace);\n  font-size: 12px;\n  line-height: 18px;\n  color: var(--cli-subtle);\n  white-space: nowrap;\n}\n.dsh-cli-statsbar > span {\n  flex: none;\n}\n.dsh-cli-statsbar-sep {\n  color: var(--cli-stats-sep);\n  margin: 0 6px;\n}\n.dsh-cli-statsbar-model { color: var(--cli-stats-model); }\n.dsh-cli-statsbar-counts { color: var(--cli-stats-counts); }\n.dsh-cli-statsbar-token { color: var(--cli-subtle); }\n.dsh-cli-statsbar-cache { color: var(--cli-stats-cache); }\n.dsh-cli-statsbar-ctx { color: var(--cli-stats-context); }\n\n/* 6.8 块光标（JS 渲染 .dsh-cli-cursor）—— 用户参考图1：默认态 = 实心浅灰长方形块\n   12×20px（高覆盖文字、宽约半字符），不反色、不闪烁，停在插入点。\n   CSS !important 覆盖 JS 内联的 16×16（免重启）。\n   translateY(-2px)：JS top 对齐字形顶，光标高(20) 比字形(16) 多出的半差 2px 上移，\n   使光标垂直居中对齐文字（用户反馈\"没对齐正中央\"）。 */\n.dsh-cli-cursor {\n  position: absolute;\n  width: 12px !important;\n  height: 20px !important;\n  transform: translateY(-2px) !important;\n  background: var(--cli-cursor-block);\n  pointer-events: none;\n  z-index: 5;\n  animation: none;\n}\n\n/* 覆盖态：光标块消失，该字符黑白反色 + 背景（图2 cc 效果）\n   宽度 = 字符宽（JS charW ~16px，覆盖整个字符，参照 cc 反色块 18px） */\n.dsh-cli-cursor-char {\n  position: absolute;\n  display: none;\n  background: var(--cli-cursor-bg-rev);\n  color: var(--cli-cursor-fg-rev);\n  text-align: center;\n  pointer-events: none;\n  z-index: 5;\n  animation: none;\n  line-height: 16px;\n  font-size: 16px;\n}\nhtml.dsh-cli-cursor-off .dsh-cli-cursor {\n  animation: none;\n  opacity: 0;\n}\n@media (prefers-reduced-motion: reduce) {\n  .dsh-cli-cursor { animation: none; }\n}\n\n/* ============================================================================\n * 7. 对话区终端化（设计文档 §1.1 / §1.3 · Q3=C 纯样式层）\n *    去气泡、满宽靠左、紧凑行高、消息间细分隔线。\n *    不动结构，不引入行内标记（二期）。\n *    选择器全部走 CSS Modules 语义后缀，哈希前缀变化不影响。\n * ========================================================================== */\n\n/* 7.1 满宽靠左：去掉对话列 748px 居中 max-width 约束（仅命中 Md3f7G_column） */\n[class$=\"_column\"] {\n  max-width: none !important;\n}\n\n/* 7.2 对话滚动容器左右留白收敛（16px 32px → 紧凑 24px；仅含 column 的 scroll，\n   不误伤输入区的 uV2eYG_scroll） */\n[class$=\"_scroll\"]:has(> [class$=\"_column\"]) {\n  padding: 16px 24px !important;\n}\n\n/* 7.3 用户消息气泡去卡片化：透明底、无圆角、无 padding（文本直接铺在背景上） */\n[class$=\"_bubble\"] {\n  background: transparent !important;\n  border-radius: 0 !important;\n  box-shadow: none !important;\n  border: none !important;\n  padding: 0 !important;\n  max-width: none !important;\n}\n\n/* 7.4 用户消息靠左（与 AI 消息同一排版，不再右对齐） */\n[class$=\"_userRow\"],\n[class$=\"_userStack\"] {\n  align-items: flex-start !important;\n  max-width: none !important;\n}\n\n/* 7.5 紧凑行高：终端感 1.55（覆盖 markdown 正文与段落） */\n[class$=\"_column\"] {\n  line-height: 1.55;\n}\n\n/* 7.6 消息间细分隔线：每条用户消息下方 hairline（替代大间距卡片）\n   不用相邻选择器——用户消息之间隔着 AI 回复，相邻几乎不触发\n   透明度 0.14：0.08 在深底上几乎不可见，0.14 可感知但不刺眼 */\n[class$=\"_userRow\"] {\n  padding-top: 10px;\n  padding-bottom: 10px;\n  border-bottom: 1px solid var(--cli-border-strong);\n}\n\n/* 7.7 用户消息归属标记：行首 `>`（Q13=②，与输入框提示符呼应）\n   注意：_userRow 是 flex-column，::before 作为 flex item 会跑到消息\"上面一行\"，\n   所以改用绝对定位贴左上角，并给 _userStack 让位 18px（侦察实证，勿改回 flex 方案） */\n[class$=\"_userRow\"] {\n  position: relative;\n}\n[class$=\"_userRow\"]::before {\n  content: '>';\n  position: absolute;\n  left: 0;\n  top: 10px; /* 与消息第一行文字行盒顶对齐（_userRow padding-top 10px） */\n  font-size: 16px;\n  line-height: 1.45; /* 与消息 markdown 行高一致（§7.8），字形在行盒内自然垂直居中 */\n  font-weight: 600;\n  color: var(--cli-accent);\n  user-select: none;\n}\n[class$=\"_userRow\"] [class$=\"_userStack\"] {\n  padding-left: 18px !important;\n}\n\n/* 7.8 markdown 段落行高（用户偏好：1.45，比官方 28px 紧凑、比 1.35 宽松一点）\n   段落间距 0：用户偏好「冒号结尾句子 → 下一块 = 普通行距」，不留块间距；\n   !important 压过官方样式（实测无 !important 会被覆盖） */\n[class$=\"_column\"] p {\n  line-height: 1.45 !important;\n  margin-top: 0 !important;\n  margin-bottom: 0 !important;\n}\n\n/* 7.9 markdown 块级元素间距收紧（根因实证：官方 HR 上下各 32px、H2 32/16px、\n   UL/OL 16px 的大 margin —— 冒号结尾段落后跟分隔线/标题/列表时被撑得老远） */\n[class$=\"_column\"] hr {\n  margin-top: 0.5em !important;\n  margin-bottom: 0.5em !important;\n}\n[class$=\"_column\"] h1,\n[class$=\"_column\"] h2,\n[class$=\"_column\"] h3,\n[class$=\"_column\"] h4 {\n  margin-top: 0.6em !important;\n  margin-bottom: 0.3em !important;\n}\n[class$=\"_column\"] ul,\n[class$=\"_column\"] ol {\n  margin-top: 0.3em !important;\n  margin-bottom: 0.3em !important;\n}\n[class$=\"_column\"] li {\n  margin-top: 0 !important;\n  margin-bottom: 0.15em !important;\n  line-height: 1.45 !important; /* 官方 li 行高 28px → 与正文 1.45 统一 */\n}\n\n/* 7.10 消息块间距（根因实证：_column 是 flex-column，官方 gap 16px 太宽；\n   用户偏好演进：先压 2px 太挤 → 调到 8px：消息间可区分、又不松散。\n   段落/句子衔接仍为 0 间距（7.8），此 gap 只作用于消息块之间） */\n[class$=\"_column\"] {\n  gap: 8px !important;\n}\n\n/* 7.11 消息时间/数据行常显（用户要求：不要 hover 才显示）\n   官方 _timeStart（用户消息时间）/_timeEnd（AI 消息 时间·用时·首token·tok/s）\n   默认 opacity 0、hover 消息才显示 → 改为常显，不占额外布局（opacity 变化不重排） */\n[class$=\"_timeStart\"],\n[class$=\"_timeEnd\"] {\n  opacity: 1 !important;\n}\n\n/* ============================================================================\n * 9. M2-1 工具调用内联化（input.png 任务界面）\n *    目标：把工具调用卡片压成一行等宽小字 `── 工具名 摘要`（蓝字主体+灰元信息）\n *    官方 collapsed 行已是单行（_callRow 24px），这里再压成 12px 等宽小字、\n *    加 ── 前缀、工具名蓝字、摘要灰字；展开 body 保持点击展开但默认收起。\n * ========================================================================== */\n\n/* 9.1 工具行容器：等宽 12px 小字、紧凑行高、去掉卡片视觉 */\n[class$=\"_callRow\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n  line-height: 18px !important;\n}\n\n/* 9.2 工具行前缀 `──`（Claude Code 式执行指示） */\n[class$=\"_callRow\"] > [class$=\"_root\"] > [class$=\"_row\"]::before,\n[class$=\"_callRow\"] [class$=\"_row\"]::before {\n  content: '──';\n  color: var(--cli-accent);\n  margin-right: 8px;\n  font-weight: 600;\n}\n\n/* 9.3 工具名（title）蓝字主体 */\n[class$=\"_callRow\"] [class$=\"_title\"] {\n  color: var(--cli-accent) !important;\n  font-weight: 500 !important;\n  font-size: 12px !important;\n}\n\n/* 9.4 摘要灰字、等宽 */\n[class$=\"_callRow\"] [class$=\"_summary\"],\n[class$=\"_callRow\"] [class$=\"_summarySuffix\"],\n[class$=\"_callRow\"] [class$=\"_fileLink\"] {\n  color: var(--cli-subtle) !important;\n  font-size: 12px !important;\n  line-height: 18px !important;\n}\n\n/* 9.5 状态图标缩小（leading 16px → 12px 对齐小字） */\n[class$=\"_callRow\"] [class$=\"_leading\"] {\n  width: 14px !important;\n  height: 14px !important;\n  margin-right: 4px !important;\n}\n[class$=\"_callRow\"] [class$=\"_leading\"] svg {\n  width: 12px !important;\n  height: 12px !important;\n}\n\n/* 9.6 展开 body：默认收起是官方行为，保持点击展开；把展开卡压回 12px 等宽 */\n[class$=\"_callRow\"] [class$=\"_ioCard\"],\n[class$=\"_callRow\"] [class$=\"_terminalBody\"],\n[class$=\"_callRow\"] [class$=\"_bodyScroll\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n  line-height: 18px !important;\n}\n\n/* 9.7 错误工具行：摘要用错误色（保持官方语义但适配小字） */\n[class$=\"_callRow\"] [class$=\"_errorSummary\"] {\n  color: var(--dsw-alias-state-error-primary) !important;\n}\n\n/* ============================================================================\n * 10. 去掉「回到最底部」箭头按钮（2026-08-19 用户要求）\n *     官方 ChatView 上划离开底部时出现的 floating 按钮（.toBottomSlot 容器\n *     + .toBottom 按钮，34px 圆形箭头，sticky 定位）。CSS module 哈希前缀，\n *     用后缀 $= 匹配。直接隐藏两个类。\n * ========================================================================== */\n[class$=\"_toBottomSlot\"],\n[class$=\"_toBottom\"] {\n  display: none !important;\n}\n\n/* ============================================================================\n * 11. M2-2 todo 任务列表终端化（2026-08-19 · 用户拍板：JS 辅助 + 绿色完成态）\n *     DSH 把 `- [ ]` / `- [x]` 渲染成 <li><code>- [ ]</code> 文本</li>（code 无属性，\n *     纯 CSS 无法区分）。JS（client.template.js §3.5）读 code 文本打类：\n *       [x] → li.dsh-cli-todo-done + code.dsh-cli-todo-check\n *       [ ] → li.dsh-cli-todo-pending + code.dsh-cli-todo-box\n *     本段纯 CSS 画终端符号：去 decimal 编号、等宽紧凑、○ 待办（蓝）/ ✓ 完成（绿）。\n *     树状前缀 ├─ / └─（参照 dsh-TUI GoalTodoPanel 的 BranchPrefix）。\n * ========================================================================== */\n\n/* 11.1 todo LI：去官方 decimal 编号，改终端树状前缀 */\n[class$=\"_column\"] li.dsh-cli-todo-done,\n[class$=\"_column\"] li.dsh-cli-todo-pending {\n  list-style: none !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 14px !important;\n  line-height: 22px !important;\n  margin: 2px 0 !important;\n  padding-left: 2px !important;\n}\n\n/* 11.2 前缀符号：待办 ─○（蓝点）、完成 ─✓（绿勾） */\n[class$=\"_column\"] li.dsh-cli-todo-pending::before {\n  content: '─ ○ ';\n  color: var(--cli-accent, #0088fa);\n  font-weight: 400;\n}\n[class$=\"_column\"] li.dsh-cli-todo-done::before {\n  content: '─ ✓ ';\n  color: var(--dsw-alias-state-success-primary, #89d281);\n  font-weight: 400;\n}\n\n/* 11.3 code 原文（\"- [ ]\" / \"- [x]\"）隐藏，符号由伪元素接管 */\n[class$=\"_column\"] li.dsh-cli-todo-done code,\n[class$=\"_column\"] li.dsh-cli-todo-pending code {\n  display: none !important;\n}\n\n/* 11.4 完成态文字淡化（保持可读但弱化，参照 dsh-TUI completed dimColor） */\n[class$=\"_column\"] li.dsh-cli-todo-done {\n  color: var(--cli-subtle, #777d88) !important;\n}\n[class$=\"_column\"] li.dsh-cli-todo-done code {\n  color: var(--cli-subtle, #777d88) !important;\n}\n\n/* 11.5 同一列表内非 todo 的 li（普通列表项）不受影响；todo 的 ul/ol 紧凑化 */\n[class$=\"_column\"] ol:has(li.dsh-cli-todo-done),\n[class$=\"_column\"] ol:has(li.dsh-cli-todo-pending),\n[class$=\"_column\"] ul:has(li.dsh-cli-todo-done),\n[class$=\"_column\"] ul:has(li.dsh-cli-todo-pending) {\n  padding-left: 4px !important;\n  margin: 4px 0 !important;\n}\n\n/* ============================================================================\n * 12. 侧边栏终端化（GOAL 第二部分 · Q1=B 保留 GUI 结构只做皮肤）\n *     目标：压缩纵向留白、更紧的行高、等宽字体、导航项三态清晰、去大圆角。\n *     选择器：语义后缀（_newSession/_sessionRow/_groupSection/_logoRow/\n *     _settingsArea/_list）+ :has() 锚定 sidebar 容器，不依赖哈希前缀。\n *     注意：侧边栏类名（hHd-Xa_*/YDXeBa_*/qDHVXG_*）哈希前缀可变，后缀稳定。\n * ========================================================================== */\n\n/* 12.0 侧边栏容器：等宽字体、更紧凑的整体留白 */\n[class*=\"sidebarCol\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n}\n\n/* 12.1 logo 行：压缩高度（60px → 44px），等宽 */\n[class*=\"sidebarCol\"] [class$=\"_logoRow\"] {\n  height: 44px !important;\n  padding: 4px 8px !important;\n}\n\n/* 12.2 新会话按钮：去大圆角（12px → 4px）、压缩高度（38px → 30px）、等宽 */\n[class*=\"sidebarCol\"] [class$=\"_newSession\"] {\n  height: 30px !important;\n  border-radius: 4px !important;\n  padding: 4px 12px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 13px !important;\n  margin-bottom: 8px !important;\n}\n\n/* 12.3 会话项：行高 32px → 26px、去圆角、等宽 13px、三态 hover/active 清晰 */\n[class*=\"sidebarCol\"] [class$=\"_sessionRow\"] {\n  height: 26px !important;\n  min-height: 26px !important;\n  border-radius: 4px !important;\n  padding: 0 8px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 13px !important;\n  line-height: 26px !important;\n}\n/* 会话项 hover：终端式浅色底 */\n[class*=\"sidebarCol\"] [class$=\"_sessionRow\"]:hover {\n  background-color: var(--dsw-alias-interactive-bg-hover, rgba(232, 230, 224, 0.08)) !important;\n}\n\n/* 12.4 工作区组：标题弱化、紧凑、等宽 12px */\n[class*=\"sidebarCol\"] [class$=\"_groupSection\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n  line-height: 22px !important;\n}\n[class*=\"sidebarCol\"] [class$=\"_workspace\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n}\n\n/* 12.5 列表容器：压缩 padding、去掉多余留白 */\n[class*=\"sidebarCol\"] [class$=\"_list\"] {\n  padding: 0 4px 8px 4px !important;\n}\n\n/* 12.6 设置入口：等宽小字、紧凑、齿轮图标 + 文字（用户要求）\n   位置：与主区输入框垂直齐平（用户 2026-08-19 拍板，参考截图对齐）。\n   footArea 原本靠 regionArea(flex-grow:1) 挤到右下角；改为 absolute 定位，\n   设置在侧边栏底部左下角、比原版底部(y≈868)略高一点点（用户 2026-08-19 拍板，\n   top: 856 → 按钮 y≈860，比原版高约 8px）。只对 footArea 定位，settingsArea 保持正常流。 */\n[class*=\"sidebarCol\"] [class$=\"_footArea\"] {\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n  position: absolute !important;\n  top: 856px !important;\n  left: 12px !important;\n  right: 12px !important;\n  z-index: 5 !important;\n}\n[class*=\"sidebarCol\"] [class$=\"_settingsArea\"] {\n  height: 30px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n}\n/* 侧边栏根容器需相对定位（absolute 的锚点） */\n[class*=\"sidebarCol\"] [class*=\"_root\"] {\n  position: relative !important;\n}\n/* 设置按钮齿轮图标尺寸 + 间距 */\n[class*=\"sidebarCol\"] [class$=\"_trigger\"] svg {\n  width: 16px !important;\n  height: 16px !important;\n  flex: none !important;\n}\n[class*=\"sidebarCol\"] [class$=\"_trigger\"] {\n  gap: 8px !important;\n}\n\n/* 12.7 侧边栏内所有按钮/图标：去大圆角，终端直角感（保留可点性） */\n[class*=\"sidebarCol\"] button {\n  border-radius: 4px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n}\n\n/* 12.8 侧边栏收缩态（rail，根容器有 _collapsed 特征类）：\n   图标统一 18×18 + 水平居中——修复两个问题（用户 2026-08-19）：\n   1) toggle 按钮本身 x=18（其他按钮 x=10，中心偏右 8px）→ 负 margin 左移对齐；\n   2) 新建会话 svg 只有 10×18 → 明显比其他小，统一 18px。\n   ⚠️ 用 [class*=\"_collapsed\"]（子串）——根容器类是\n   \"hHd-Xa_root hHd-Xa_collapsed hHd-Xa_railIn hHd-Xa_quietBars\"，\n   不以 _collapsed 结尾，$= 匹配不到（踩坑 16/19 重演）。 */\n[class*=\"_collapsed\"] [class$=\"_toggle\"] svg,\n[class*=\"_collapsed\"] [class$=\"_newSession\"] svg {\n  width: 18px !important;\n  height: 18px !important;\n}\n[class*=\"_collapsed\"] [class$=\"_newSession\"] {\n  padding: 0 !important;\n}\n/* toggle 按钮左移 8px，与其他图标按钮水平中心对齐 */\n[class*=\"_collapsed\"] [class$=\"_toggle\"] {\n  margin-left: -8px !important;\n}\n\n/* ============================================================================\n * 13. 对话区 markdown 终端化配色（GOAL 第三部分收尾 · 2026-08-19）\n *     对齐 dsh-TUI darkTheme token（ROADMAP §S1）：\n *       标题金 #febc38 / 链接蓝 #0088fa（已生效）/ 正文 #d4d4d4（已生效）/\n *       引用左边框 / 代码块深底 / 表格终端化。\n *     只改颜色与边框，不碰已收紧的间距（§7.8/7.9）。\n * ========================================================================== */\n\n/* 13.1 标题：终端强调金（h1 略亮、h2-h4 同色），去粗体过重感 */\n[class$=\"_column\"] h1,\n[class$=\"_column\"] h2,\n[class$=\"_column\"] h3,\n[class$=\"_column\"] h4 {\n  color: #febc38 !important;\n  font-weight: 600 !important;\n}\n\n/* 13.2 链接：链接蓝（确认已生效，补 underline 增强可识别） */\n[class$=\"_column\"] a {\n  color: #0088fa !important;\n  text-decoration: none !important;\n}\n[class$=\"_column\"] a:hover {\n  text-decoration: underline !important;\n}\n\n/* 13.3 引用块：终端式左边框 + 弱化文字 */\n[class$=\"_column\"] blockquote {\n  border-left: 3px solid #5f6673 !important;\n  background: transparent !important;\n  padding: 2px 12px !important;\n  margin: 0.4em 0 !important;\n  color: #8d95a6 !important;\n}\n\n/* 13.4 代码块：深色终端底、小圆角、边框极淡（沿用 6.x 已有规则再强化） */\nbody[data-ds-dark-theme] [class$=\"_column\"] pre,\nbody[data-ds-dark-theme] [class$=\"_column\"] [class*=\"codeBlock\"],\nbody[data-ds-dark-theme] [class$=\"_column\"] [class*=\"code-block\"] {\n  background: #161a1f !important;\n  border: 1px solid rgba(232, 230, 224, 0.08) !important;\n  border-radius: 4px !important;\n  padding: 8px 12px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 13px !important;\n  line-height: 1.5 !important;\n}\n\n/* 13.5 行内代码：终端深底 + 微圆角 */\nbody[data-ds-dark-theme] [class$=\"_column\"] p code,\nbody[data-ds-dark-theme] [class$=\"_column\"] li code:not(.dsh-cli-todo-box):not(.dsh-cli-todo-check) {\n  background: #1a1e24 !important;\n  color: #d4d4d4 !important;\n  border-radius: 3px !important;\n  padding: 1px 4px !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 0.9em !important;\n}\n\n/* 13.6 表格：终端化——表头弱化、边框极淡、紧凑 */\n[class$=\"_column\"] table {\n  border-collapse: collapse !important;\n  margin: 0.5em 0 !important;\n}\n[class$=\"_column\"] th,\n[class$=\"_column\"] td {\n  border: 1px solid rgba(232, 230, 224, 0.12) !important;\n  padding: 4px 10px !important;\n  font-size: 13px !important;\n  line-height: 1.45 !important;\n}\n[class$=\"_column\"] th {\n  background: rgba(232, 230, 224, 0.06) !important;\n  color: #febc38 !important;\n  font-weight: 600 !important;\n}\n\n/* 13.7 列表：终端列表符（ul 用 ─ 前缀感，ol 保留数字但终端化）\n   ⚠️ 排除 todo li（§11 已有 ─ ○ / ─ ✓ 前缀，避免冲突） */\n[class$=\"_column\"] ul {\n  list-style: none !important;\n  padding-left: 6px !important;\n}\n[class$=\"_column\"] ul > li:not(.dsh-cli-todo-pending):not(.dsh-cli-todo-done)::before {\n  content: '─ ';\n  color: #febc38 !important;\n  font-weight: 400;\n}\n[class$=\"_column\"] ol {\n  padding-left: 22px !important;\n}\n\n/* 13.8 分隔线 hr：终端虚线感 */\n[class$=\"_column\"] hr {\n  border: none !important;\n  border-top: 1px dashed rgba(232, 230, 224, 0.25) !important;\n}\n\n/* ============================================================================\n * 14. 动效与交互（GOAL 第七部分 · 2026-08-19）\n *     原则：轻快不廉价——hover 用 120ms ease（快过 100ms 会生硬、慢过 200ms 显拖沓）；\n *     focus-visible 用 2px 终端色焦点环（键盘导航可见）；reduced-motion 全局降级。\n * ========================================================================== */\n\n/* 14.1 通用交互过渡：按钮/导航项/链接的 hover 状态平滑过渡（120ms） */\n[class*=\"sidebarCol\"] button,\n[class*=\"sidebarCol\"] [class$=\"_sessionRow\"],\n[class$=\"_column\"] a,\n[class$=\"_column\"] button {\n  transition: background-color 120ms ease, color 120ms ease, border-color 120ms ease !important;\n}\n\n/* 14.2 :focus-visible 焦点环：2px 终端强调色（深色金、浅色蓝），键盘导航可见 */\n:focus-visible {\n  outline: 2px solid #febc38 !important;\n  outline-offset: 1px !important;\n  border-radius: 2px !important;\n}\n/* 浅色主题下用强调蓝（与深色金区分但同属强调系） */\nbody:not([data-ds-dark-theme]) :focus-visible {\n  outline-color: #547da7 !important;\n}\n\n/* 14.3 主题切换过渡：背景/文字颜色平滑过渡（避免深浅切换生硬闪烁） */\nbody,\nbody[data-ds-dark-theme] {\n  transition: background-color 200ms ease, color 200ms ease !important;\n}\n\n/* 14.4 prefers-reduced-motion 全局降级：禁用所有动画/过渡（无障碍） */\n@media (prefers-reduced-motion: reduce) {\n  *,\n  *::before,\n  *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}\n\n/* ============================================================================\n * 15. 右上角 Session log 按钮（2026-08-20 用户要求）\n *     官方是胶囊形（border + radius 18px 外框）。去掉外框 → 纯文字按钮；\n *     hover / 键盘聚焦时 \"Session log\" 文字下方出现下划线（终端链接风）。\n *     选择器：限定在 headerUtilities 容器内（_sessionLogButton 是其子元素），\n *     避免裸后缀误伤；CSS module 哈希前缀用 $= 匹配语义后缀。\n *     注意 hover 的 background 不能省：官方 :hover 背景 (0,2,0) 会赢过\n *     基础规则的 transparent !important，必须显式压掉。\n * ========================================================================== */\n[class$=\"_headerUtilities\"] [class$=\"_sessionLogButton\"] {\n  min-width: 0 !important;\n  height: auto !important;\n  padding: 2px 4px !important;\n  border: none !important;\n  border-radius: 0 !important;\n  background: transparent !important;\n  font-family: var(--dsw-font-family, monospace) !important;\n  font-size: 12px !important;\n}\n[class$=\"_headerUtilities\"] [class$=\"_sessionLogButton\"]:hover:not(:disabled) {\n  background: transparent !important;\n}\n[class$=\"_headerUtilities\"] [class$=\"_sessionLogButton\"] span {\n  text-decoration: none;\n  transition: text-decoration-color 120ms ease;\n}\n[class$=\"_headerUtilities\"] [class$=\"_sessionLogButton\"]:hover:not(:disabled) span,\n[class$=\"_headerUtilities\"] [class$=\"_sessionLogButton\"]:focus-visible span {\n  text-decoration: underline;\n  text-underline-offset: 3px;\n  text-decoration-thickness: 1px;\n}\n\n/* ============================================================================\n * 17. 提问弹窗输入框：去掉 §14.2 金色焦点环（2026-08-20 用户反馈）\n *     问用户弹窗（ui-user-questions QuestionComposer）的单行/多行输入框\n *     聚焦时出现 2px 金/蓝 outline。输入控件聚焦用原生 caret/边框即可，\n *     不需要额外焦点环。选择器：CSS module 哈希前缀，后缀 $= 匹配\n *     _customInput / _customTextarea（它们在 data-question-scroll 容器内）。\n *     其余元素（按钮/链接）的键盘焦点环保留（无障碍）。\n * ========================================================================== */\n[data-question-scroll] [class$=\"_customInput\"],\n[data-question-scroll] [class$=\"_customTextarea\"] {\n  outline: none !important;\n}\n\n/* ============================================================================\n * 17.2 输入控件聚焦一律去焦点环（2026-08-20 用户要求\"选中输入框时的金框去掉\"）\n *     主聊天输入框（§6.5f）与提问弹窗（§17.1）之外，兜底覆盖所有 input /\n *     textarea / select：选中（聚焦）不再显示 §14.2 的 2px 金/蓝 outline——\n *     输入控件聚焦用原生 caret / 边框即可。按钮/链接的键盘焦点环保留（无障碍）。\n * ========================================================================== */\ninput:focus-visible,\ntextarea:focus-visible,\nselect:focus-visible {\n  outline: none !important;\n}\n\n/* ============================================================================\n * 18. CLI 选择器（ask_user_question 内嵌对话记录版）\n *     把官方问题卡片渲染成终端风格选择器，直接内嵌在对话消息流中，\n *     不弹窗、不脱离文档流、无边框、无阴影、无过渡动画。\n *     主题全走 --dsw-alias-* 令牌 + --dsw-font-family（浅色/深色自动跟随）。\n * ========================================================================== */\n.dsh-cli-select {\n  font-family: var(--dsw-font-family, monospace);\n  /* 压过 §9.6 工具调用行统一 12px：选择器与对话正文同号（14px） */\n  font-size: 14px !important;\n  line-height: 22px !important;\n  color: var(--dsw-alias-label-primary);\n  padding: 4px 0;\n  outline: none;\n  user-select: none;\n  cursor: default;\n}\n.dsh-cli-select:focus,\n.dsh-cli-select:focus-visible { outline: none !important; }\n.dsh-cli-select-question {\n  font-weight: 700;\n  color: var(--dsw-alias-label-primary);\n  margin-bottom: 8px;\n}\n.dsh-cli-select-header {\n  font-weight: 400;\n  font-size: 0.85em;\n  color: var(--dsw-alias-label-secondary);\n  margin-bottom: 4px;\n}\n.dsh-cli-select-option {\n  padding: 1px 0 1px 4px;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n}\n.dsh-cli-select-option:hover { color: var(--dsw-alias-brand-primary); }\n.dsh-cli-select-option.is-selected { color: var(--dsw-alias-brand-primary); }\n.dsh-cli-select-option.is-checked { font-weight: 600; }\n.dsh-cli-select-arrow { display: inline-block; width: 1.2em; }\n.dsh-cli-select-marker { display: inline-block; width: 2.6em; }\n.dsh-cli-select-desc {\n  font-size: 0.85em;\n  opacity: 0.7;\n  padding-left: 1.6em;\n}\n.dsh-cli-select-option.is-selected .dsh-cli-select-desc { opacity: 0.75; }\n.dsh-cli-select-badge {\n  font-size: 0.72em;\n  color: var(--dsw-alias-brand-primary);\n  background: var(--dsw-alias-bg-layer-2);\n  border-radius: 3px;\n  padding: 0 5px;\n  margin-left: 6px;\n  vertical-align: middle;\n  font-weight: 400;\n}\n.dsh-cli-select-check {\n  display: inline-block;\n  width: 1.4em;\n  text-align: center;\n}\n.dsh-cli-select-hint {\n  font-size: 0.8em;\n  color: var(--dsw-alias-label-secondary);\n  opacity: 0.7;\n  margin-top: 8px;\n}\n.dsh-cli-select-result { margin-top: 4px; }\n.dsh-cli-select-result.is-ok { color: var(--dsw-alias-state-success-primary); }\n.dsh-cli-select-result.is-cancel { color: var(--dsw-alias-state-error-primary); }\n.dsh-cli-select-result.is-dim { color: var(--dsw-alias-label-secondary); opacity: 0.7; }\n.dsh-cli-select-pending {\n  color: var(--dsw-alias-label-secondary);\n  opacity: 0.6;\n  padding: 1px 0 1px 4px;\n}\n.dsh-cli-select-custom {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 2px 0 2px 4px;\n}\n.dsh-cli-select-custom-prompt {\n  color: var(--dsw-alias-brand-primary);\n  font-weight: 600;\n  user-select: none;\n}\n.dsh-cli-select-custom-input {\n  flex: 1;\n  font-family: var(--dsw-font-family, monospace);\n  font-size: 14px;\n  color: var(--dsw-alias-label-primary);\n  background: var(--dsw-alias-bg-layer-2);\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 3px;\n  padding: 3px 8px;\n  outline: none;\n  min-width: 0;\n}\n.dsh-cli-select-custom-input:focus {\n  border-color: var(--dsw-alias-brand-primary);\n}\n\n/* ============================================================================\n * 18. 大段粘贴/长文折叠提示条（A2 · 2026-08-26）\n *     纯显示层：输入内容 ≥6 行 或 ≥600 字符时，输入卡顶部显示一行只读提示\n *     （▸ N 行 · M 字符 · 首行预览），✕ 暂时隐藏、内容变化后恢复。\n *     插入点为 seat 内 scroll 容器前（JS 处理），流内一行，等宽小字。\n *     不修改 draft、不碰官方 paste 事务/引用 chip/undo。\n * ========================================================================== */\n.dsh-cli-pastefold {\n  display: none;\n  align-items: center;\n  gap: 8px;\n  padding: 1px 12px;\n  font-family: var(--dsw-font-family, monospace);\n  font-size: 11px;\n  line-height: 17px;\n  color: var(--dsw-alias-label-secondary);\n  background: var(--dsw-alias-bg-layer-1);\n  border-bottom: 1px solid var(--dsw-alias-border-l1);\n  user-select: none;\n  flex-shrink: 0;\n}\n.dsh-cli-pastefold.visible { display: flex; }\n.dsh-cli-pastefold-text {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.dsh-cli-pastefold-dismiss {\n  flex: none;\n  cursor: pointer;\n  color: var(--dsw-alias-label-dimmed);\n  padding: 0 4px;\n  font-size: 12px;\n}\n.dsh-cli-pastefold-dismiss:hover { color: var(--dsw-alias-label-primary); }\n\n/* ============================================================================\n * 19. 长文本 _grow 钳制（A2 附带修复 · 2026-08-26）\n *     官方 autosize 把输入区 _grow 撑到内容全高（长文 > 可视高时）并滚底\n *     scroll 以保持光标可见 → textarea 被顶出视口、只能看到内容尾部且滚不回去\n *     （历史踩坑 #22/#23 \"贴长文滚动链上抛/贴底\" 的根源）。钳制 _grow 高度使\n *     textarea 回到 scroll 顶部、内部自滚，用户可回看全文。\n *     只作用于会话态（:has(textarea)），不影响 hero 态。\n *     ⚠️ 钳制值必须 = scroll 容器的【实际可视高度 288px】，不能抄 scroll 的\n *     max-height(320px)：seat 高 334 扣掉底部 row 后 scroll 真实窗口只有 288，\n *     grow 钳 320 会让 textarea 比窗口高 32px，滚到底时内容最底 32px 被 scroll\n *     (overflow:hidden) 裁掉、看不全（二次反馈\"滚到底字体显示不完全\"）。288\n *     时 textarea 与窗口精确对齐，滚动可完整浏览全文；seat 高度 334 不变。\n * ========================================================================== */\ndiv:has(textarea) .dsh-cli-composer-seat [class$=\"_grow\"] {\n  max-height: 288px;\n  overflow-y: hidden;\n}\n\n/* ============================================================================\n * 20. 发送即上屏兜底气泡（用户需求 · 2026-08-28）\n *     官方 user 消息渲染依赖服务端提交往返，模型思考久/偶发延迟时 user 消息\n *     晚于 thinking 上屏。皮肤在官方延迟时插入此临时气泡（仿官方 user 气泡\n *     视觉：右对齐、--dsw-specific-bubble 底色、圆角 22px、16/24 字号），\n *     官方 user 气泡出现后 JS 自动移除。正常路径（官方 <60ms 渲染）不出现。\n * ========================================================================== */\n.dsh-cli-echo-bubble {\n  display: flex;\n  flex-direction: column;\n  align-items: flex-end;\n  gap: 6px;\n  margin: 2px 0;\n}\n.dsh-cli-echo-bubble .dsh-cli-echo-bubble-inner {\n  max-width: min(525px, 82%);\n  background: var(--dsw-specific-bubble);\n  border-radius: 22px;\n  padding: 10px 16px;\n  font-size: 16px;\n  line-height: 24px;\n  color: var(--dsw-alias-label-primary);\n  white-space: pre-wrap;\n  word-break: break-word;\n  overflow-wrap: break-word;\n}\n\n/* ============================================================================\n * 21. QueueDock 队列条终端化（用户需求 · 2026-08-28）\n *     去掉卡片\"框\"感 → 透明面板、无边框无圆角；灰色等宽终端文字；\n *     头部/行加终端前缀字符（▸ / ⑂，TUI figures 素材）；紧凑行高。\n *     位置保持官方 slot（输入框上方 = thinking 行下方），复用皮肤\n *     --dsw-font-family 等宽栈。锚点：官方 data-slot 稳定属性 + 语义后缀。\n * ========================================================================== */\n[data-slot=\"conversation.input.dock\"] [class$=\"_panel\"] {\n  background: transparent;\n  border-radius: 0;\n  padding: 2px 0;\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_panel\"]::after {\n  display: none; /* 官方 panel::after 画 1px 边框，去掉 */\n}\n/* 计数头部：等宽灰色 + ▸ 前缀（折叠），展开变 ▾ */\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"] {\n  height: 26px;\n  padding: 2px 8px;\n  border-radius: 0;\n  color: var(--dsw-alias-label-tertiary);\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"]::before {\n  content: '\\25b8\\00a0'; /* ▸ + nbsp（折叠态：向右） */\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"][aria-expanded=\"true\"]::before {\n  content: '\\25be\\00a0'; /* ▾ + nbsp（展开态：向下） */\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"] [class$=\"_lead\"] {\n  display: none; /* 隐藏官方 svg 图标 */\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"] [class$=\"_chevron\"] {\n  display: none; /* 隐藏官方右侧 chevron，前缀箭头即方向指示 */\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"] [class$=\"_count\"] {\n  font-family: var(--dsw-font-family, monospace);\n  font-size: 13px;\n  font-weight: 400;\n  color: var(--dsw-alias-label-tertiary);\n}\n/* 行：灰色等宽 + ⑂ 前缀 + 紧凑 */\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"] {\n  height: 26px;\n  padding: 2px 8px;\n  border-radius: 0;\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"]::before {\n  content: '\\2442\\00a0'; /* ⑂ + nbsp */\n  flex: none;\n  color: var(--dsw-alias-label-tertiary);\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"] + [class$=\"_row\"] {\n  box-shadow: none; /* 去官方行间 1px 分隔线 */\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"] [class$=\"_preview\"],\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"] [class$=\"_editor\"] {\n  font-family: var(--dsw-font-family, monospace);\n  font-size: 13px;\n  color: var(--dsw-alias-label-tertiary);\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_action\"] {\n  width: 24px;\n  height: 24px;\n  color: var(--dsw-alias-label-tertiary);\n}\n/* 前缀箭头与输入框 > 提示符左对齐（实测差 106px 来自官方 .dock 水平居中+inset，\n * 2026-08-28）：dock 去居中、宽度撑满、去左 inset → 前缀起点 = seat 左 = > 左 */\n[data-slot=\"conversation.input.dock\"] [class$=\"_dock\"] {\n  margin-left: 0 !important;\n  width: 100% !important;\n  max-width: none !important;\n  padding-left: 0 !important;\n}\n[data-slot=\"conversation.input.dock\"] [class$=\"_row\"],\n[data-slot=\"conversation.input.dock\"] [class$=\"_header\"] {\n  padding-left: 24px !important; /* 24px = seat 相对 card 左边距，前缀起点对齐 >（实测） */\n}";
		const cssTag = 'dsh-web-cli-flavor/style.css';
		if (typeof document !== 'undefined' && css && document.querySelector('style[data-plugin-css="' + cssTag + '"]') === null) {
			const tag = document.createElement('style');
			tag.dataset.plugin = 'dsh-web-cli-flavor';
			tag.dataset.pluginCss = cssTag;
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		// ============================================================================
		// 2. `❯` 终端提示符：等主输入框挂载后，在它前面插入提示符
		// ============================================================================
		// 说明：只做视觉增强，不触碰 textarea 本身；用 MutationObserver 等待
		// 输入框出现（client 插件在应用挂载前就会执行）。判断依据是 placeholder
		// 文案（中英文都覆盖），避免误伤搜索框等其它 textarea。
		const PROMPT_PLACEHOLDER_PATTERN = /发送|输入|消息|给.*发|message|ask|prompt|type|shift|enter/i;

		function looksLikeComposer(textarea) {
			const ph = (textarea.getAttribute('placeholder') || '').toLowerCase();
			if (PROMPT_PLACEHOLDER_PATTERN.test(ph)) return true;
			// 兜底：高度较大的 textarea（>= 40px）视为主输入框
			const r = textarea.getBoundingClientRect();
			return r.height >= 40;
		}

		// ---- 性能：共享 rAF 节流（2026-08-20 用户反馈卡顿后精简）----
		// 对话渲染/流式输出时 DOM 变化极频繁，若每个 body 级 MutationObserver 都
		// 立即跑全页扫描，一帧内可能执行数十次。改为：所有 observer 回调把任务塞进
		// Set，每帧（requestAnimationFrame）合并执行一次——帧内任意次 DOM 变化，
		// 每个任务最多跑一次。Set 天然去重（同一函数引用只执行一次）。
		let rafPending = false;
		const rafTasks = new Set();
		const rafThrottle = (fn) => {
			rafTasks.add(fn);
			if (rafPending) return;
			rafPending = true;
			requestAnimationFrame(() => {
				rafPending = false;
				const batch = Array.from(rafTasks);
				rafTasks.clear();
				for (const t of batch) {
					try { t(); } catch (e) { /* 单任务异常不影响其余 */ }
				}
			});
		};

		// ---- 所有 body 级 MutationObserver 统一入口：rAF 合并执行、永不
		// disconnect（切换会话时 React 重建输入栏，观察者必须存活才能重新注入；
		// WeakSet 去重 + rAF 节流控制开销）。
		const watchBody = (task) => {
			const mo = new MutationObserver(() => rafThrottle(task));
			mo.observe(document.body, { childList: true, subtree: true });
		};

		function installPromptGlyph() {
			const seen = new WeakSet();
			const tryInstall = () => {
				const areas = document.querySelectorAll('textarea');
				for (const ta of areas) {
					if (seen.has(ta)) continue;
					seen.add(ta);
					if (!looksLikeComposer(ta)) continue;
					const host = ta.parentElement;
					if (!host) continue;
					// 去重：host 内已有提示符则跳过（不依赖兄弟关系，backdrop 等会挡道）
					if (host.querySelector('.dsh-cli-prompt')) continue;
					const glyph = document.createElement('span');
					glyph.className = 'dsh-cli-prompt';
					glyph.textContent = '>';
					host.insertBefore(glyph, host.firstChild);
				}
			};
			tryInstall();
			watchBody(tryInstall);
		}

		// ============================================================================
		// 3. 输入栏终端化（PLAN-input-bar）
		//    - 块状光标（textarea 文字透明、backdrop 渲染，原生 caret 做不出方块）
		//    - Esc 中断生成（官方 Esc 不中断；主按钮运行时变停止态，click 触发 cancel）
		//    - 状态行皮肤化（官方 StatsLine 打类 + 分段着色 + cwd）
		//    - 空会话状态行占位
		// ============================================================================
		const JS_READY_CLASS = 'dsh-cli-js-ready';

		function installComposerTerminal() {
			// 标记 JS 就绪 → CSS 才隐藏原生 caret（避免无光标可用）
			document.documentElement.classList.add(JS_READY_CLASS);

			const seen = new WeakSet();
			let globalInstalled = false;
			const tryInstall = () => {
				// 全局一次性：Esc 中断监听 + ContextMeter 隐藏
				if (!globalInstalled) {
					globalInstalled = true;
					installEscapeStop();
					hideContextMeter();
				}
				const areas = document.querySelectorAll('textarea');
				for (const ta of areas) {
					if (seen.has(ta)) continue;
					seen.add(ta);
					if (!looksLikeComposer(ta)) continue;
					setupComposer(ta);
				}
				// seat 类幂等重打：React 首屏渲染可能重建节点冲掉类。
				// 已打 seat 的跳过（避免每次 DOM 变化都跑祖先链 getBoundingClientRect
				// 强制布局——2026-08-21 交互延迟优化）
				for (const ta of areas) {
					if (ta.closest('.dsh-cli-composer-seat')) continue;
					markComposerSeat(ta);
				}
			};

			const setupComposer = (ta) => {
				// 3.0 给输入区容器打稳定类（CSS 画上下 hairline 分隔线）
				markComposerSeat(ta);
				// 3.1 块状光标
				installBlockCursor(ta);
				// 3.1f 发送即上屏兜底（A2 附带 · 用户需求 2026-08-28）
				installUserEcho(ta);
			};

			// 向上找「含 textarea 的输入卡容器」：
			// 1) 优先找语义卡片 [class$="_card"]（uV2eYG_card，真正输入卡）——
			//    工具行隐藏后卡高会变，纯高度判断可能误选外层 hero 容器；
			// 2) 找不到再回退「高度明显大于 textarea」的祖先。
			// 同时清理祖先链上之前误打的 seat 类（避免横线框住 hero 容器）。
			const markComposerSeat = (ta) => {
				// 收集祖先链（含 textarea 自身向上 8 层）
				const chain = [];
				let el = ta.parentElement;
				let guard = 0;
				while (el && el !== document.body && guard++ < 8) {
					chain.push(el);
					el = el.parentElement;
				}
				// 目标：优先 _card 语义容器，其次高度 > ta*1.4
				let target = null;
				for (const c of chain) {
					const cls = (c.className && typeof c.className === 'string') ? c.className : '';
					if (/_card(\s|$)/.test(cls) && c.getBoundingClientRect().height > 20) { target = c; break; }
				}
				if (!target) {
					const taH = ta.getBoundingClientRect().height;
					for (const c of chain) {
						if (c.getBoundingClientRect().height > taH * 1.4) { target = c; break; }
					}
				}
				// 清理链上所有已打的 seat，再打目标
				for (const c of chain) c.classList.remove('dsh-cli-composer-seat');
				if (target) target.classList.add('dsh-cli-composer-seat');
			};

			tryInstall();
			watchBody(tryInstall);
			// 布局稳定后补打几次（getBoundingClientRect 在布局未定时可能返回 0）
			[500, 1500, 3000].forEach((ms) => setTimeout(() => {
				const areas = document.querySelectorAll('textarea');
				for (const ta of areas) markComposerSeat(ta);
			}, ms));
		}

		// ---- 3.1 块状光标：mirror div 法计算 caret 像素位置 ----
		const CURSOR_STYLE_PROPS = [
			'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant',
			'letterSpacing', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
			'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
			'boxSizing', 'whiteSpace', 'wordWrap', 'overflowWrap', 'wordBreak',
			'textTransform', 'textIndent', 'tabSize', 'width'
		];

		function installBlockCursor(ta) {
			const host = ta.parentElement;
			if (!host) return;
			host.style.position = 'relative';
			// 去重：host 内已有光标则复用（React 重建 textarea 时 host 也会重建，但 cursor 是新 host）
			if (host.querySelector('.dsh-cli-cursor')) return;

			const cursor = document.createElement('span');
			cursor.className = 'dsh-cli-cursor';
			cursor.setAttribute('aria-hidden', 'true');
			host.appendChild(cursor);
			// 覆盖态反色字符（图2：光标覆盖到文字上时，该字符黑白反色 + 背景）
			const charCursor = document.createElement('span');
			charCursor.className = 'dsh-cli-cursor-char';
			charCursor.setAttribute('aria-hidden', 'true');
			host.appendChild(charCursor);

			// 测量用 mirror div（一次性创建，隐藏）
			const mirror = document.createElement('div');
			mirror.setAttribute('aria-hidden', 'true');
			Object.assign(mirror.style, {
				position: 'absolute', top: '-9999px', left: '-9999px',
				visibility: 'hidden', whiteSpace: 'pre-wrap',
				overflowWrap: 'break-word', wordWrap: 'break-word'
			});
			const cs = getComputedStyle(ta);
			for (const p of CURSOR_STYLE_PROPS) {
				if (cs[p] && mirror.style[p] !== undefined) mirror.style[p] = cs[p];
			}
			// mirror 宽度 = textarea 的 clientWidth（★★★ 必须是这个，不是 clientWidth-padding）：
			// mirror 从 textarea 复制了 box-sizing:border-box 与相同 padding。
			// 若设成 clientWidth - padding，则这个值在 border-box 语义下成了「含 padding 的总宽」，
			// mirror 文本内容区 = 该值 - padding，比 textarea 内容区（clientWidth - padding）窄一个 padding*2
			// → 换行点不同 → 光标偏右（2026-08-17 用户实测：改 clientWidth-padding 仍偏右，根因在此）。
			// 设成 clientWidth：border-box 下 mirror 内容区 = clientWidth - padding = textarea 内容区，精确一致。
			// clientWidth 不含滚动条，滚动条出现时也自动正确。
			mirror.style.width = ta.clientWidth + 'px';
			const marker = document.createElement('span');
			marker.textContent = '\u200b'; // zero-width: 测量末尾位置
			mirror.appendChild(marker);
			// 字符宽探针：测一个全角字符（'中'）的渲染宽度 = 覆盖一个汉字所需的宽度
			// （原 'M' 探针只有半角宽 ~9px，盖不住 16px 的中文字——S2 用户反馈"要正好覆盖一个文字"）
			const probe = document.createElement('span');
			probe.textContent = '中';
			mirror.appendChild(probe);
			document.body.appendChild(mirror);
			const charW = probe.offsetWidth || Math.round((parseFloat(cs.fontSize) || 16));

			const update = () => {
				if (document.activeElement !== ta) { cursor.style.display = 'none'; charCursor.style.display = 'none'; return; }
				// 选中文字（选区非空）时隐藏光标：避免光标盖住选中字符
				if (ta.selectionStart !== ta.selectionEnd) { cursor.style.display = 'none'; charCursor.style.display = 'none'; return; }
				// mirror 宽度随 textarea 实时同步（卡宽变化/滚动条出现时换行点保持一致）。
				// 必须 = clientWidth（border-box 语义，见创建处注释）——改任何其它公式都会
				// 让 mirror 内容区 ≠ textarea 内容区，换行点错位、光标偏右。
				const taW = ta.clientWidth;
				if (Math.abs(parseFloat(mirror.style.width) - taW) > 0.5) {
					mirror.style.width = taW + 'px';
				}
				const value = ta.value;
				const sel = ta.selectionStart ?? value.length;
				const before = value.slice(0, sel);
				// mirror 内容 = before + marker；用 textContent 保留换行与空格
				mirror.textContent = before;
				mirror.appendChild(marker);
				const ml = marker.offsetLeft;
				const mt = marker.offsetTop;
				// marker.offsetLeft 已含 mirror 的 paddingLeft(16px)，直接叠加 textarea 相对 host 的偏移即可
				const hostRect = host.getBoundingClientRect();
				const taRectNow = ta.getBoundingClientRect();
				const fontSize = parseFloat(cs.fontSize) || 16;
				// 块光标 = 正好覆盖一个字符（Claude Code 式）：高=字形高(fontSize)、
				// 宽=全角字符宽、顶=字形顶(mt)。不要盖整行盒（曾用行高→大方块，S2 用户否决）。
				const cursorH = Math.round(fontSize);
				const left = (taRectNow.left - hostRect.left) + ml;
				// marker.offsetTop 已含 mirror paddingTop(4px) 与行内居中偏移
				// ((lineHeight-fontSize)/2 = 4px)，即「字形顶」相对 mirror 边框的位置；
				// 直接叠加 textarea 相对 host 的偏移即为光标顶，不加任何补偿
				const top = (taRectNow.top - hostRect.top) + mt - ta.scrollTop;
				// 覆盖态判断：光标右侧是否有字符（非换行）→ 该字符反色显示、光标块隐藏（图2）
				const after = value.slice(sel, sel + 1);
				if (after && after !== '\n') {
					charCursor.style.display = 'block';
					charCursor.style.left = Math.round(left) + 'px';
					charCursor.style.top = Math.round(top) + 'px';
					charCursor.style.width = Math.max(2, charW) + 'px';
					charCursor.style.height = cursorH + 'px';
					charCursor.style.lineHeight = cursorH + 'px';
					charCursor.style.fontSize = fontSize + 'px';
					charCursor.textContent = after;
					cursor.style.display = 'none';
				} else {
					cursor.style.display = 'block';
					cursor.style.left = Math.round(left) + 'px';
					cursor.style.top = Math.round(top) + 'px';
					cursor.style.height = cursorH + 'px';
					cursor.style.width = Math.max(2, charW) + 'px';
					charCursor.style.display = 'none';
				}
			};

			// 事件驱动光标更新：全部走 rAF 合并（打字/按键/选区变化每帧最多一次
			// 强制布局——2026-08-21 用户反馈 Enter/Esc 交互延迟，keydown+keyup+
			// selectionchange 各自 update() 的冗余强制布局是主因）。
			let updPending = false;
			const scheduleUpdate = () => {
				if (updPending) return;
				updPending = true;
				requestAnimationFrame(() => {
					updPending = false;
					update();
				});
			};
			ta.addEventListener('input', scheduleUpdate);
			ta.addEventListener('click', scheduleUpdate);
			ta.addEventListener('keyup', scheduleUpdate);
			ta.addEventListener('keydown', scheduleUpdate);
			ta.addEventListener('selectionchange', scheduleUpdate);
			ta.addEventListener('scroll', scheduleUpdate);
			document.addEventListener('selectionchange', () => {
				if (document.activeElement === ta) scheduleUpdate();
			});
			ta.addEventListener('focus', scheduleUpdate);
			ta.addEventListener('blur', () => { cursor.style.display = 'none'; });
			window.addEventListener('resize', scheduleUpdate);
			// 发送后 React 程序化清空 textarea.value 不触发 input 事件，块光标会停在
			// 原地（2026-08-21 用户反馈）。劫持本 textarea 的 value setter：任何
			// 程序化赋值（含 React 受控清空/回填）都同步重算光标位置（rAF 合并）。
			try {
				const nativeValGet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').get;
				const nativeValSet = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
				Object.defineProperty(ta, 'value', {
					configurable: true,
					get: () => nativeValGet.call(ta),
					set: (v) => {
						nativeValSet.call(ta, v);
						scheduleUpdate();
						// 折叠提示条回调（A2）：同一劫持点分发，避免二次劫持互相覆盖
						if (typeof ta.__dshPasteFold === 'function') ta.__dshPasteFold(v);
					},
				});
			} catch (e) { /* 劫持失败不影响块光标其它功能 */ }
			// 输入区滚动隔离：见 installInputScrollIsolation（§3.1b，document 级
			// capture 方案）。textarea 级 wheel 监听在真实环境不生效，已弃用，
			// 统一走全局 capture + closest('.dsh-cli-composer-seat') 拦截。
			update();
		}

		// ---- 3.1b 输入区滚动隔离（window 级 capture + stopImmediatePropagation，
		// 2026-08-20 最终版）：
		// 用户反馈"输入框内滚动时对话记录跟着滚"，且"只有往上滚时跟"——document
		// 级 capture 拦截在真实环境不够：官方可能注册了更早的 wheel 监听
		// （window 级），把滚动转移抢在前面。window capture 是最早的注册点，
		// stopImmediatePropagation 阻止官方任何后续 wheel 处理，preventDefault
		// 阻止默认滚动——只要 target 在输入卡 .dsh-cli-composer-seat 内就 100% 接管。
		function installInputScrollIsolation() {
			const handler = (e) => {
				if (e.deltaY === 0) return
				if (!(e.target instanceof Element)) return
				const seat = e.target.closest('.dsh-cli-composer-seat')
				if (!seat) return
				const ta = seat.querySelector('textarea')
				if (!ta) return
				const max = ta.scrollHeight - ta.clientHeight
				if (max <= 0) return // 无溢出（单行）：放行，滚轮正常滚外层对话区
				e.preventDefault()
				e.stopImmediatePropagation()
				const next = Math.min(Math.max(ta.scrollTop + e.deltaY, 0), max)
				if (next !== ta.scrollTop) ta.scrollTop = next
			}
			window.addEventListener('wheel', handler, { passive: false, capture: true })
		}

		// ---- 3.1c 大段粘贴/长文折叠提示条（A2 · 2026-08-26）
		// 纯显示层：textarea 内容 ≥FOLD_MIN_LINES 行 或 ≥FOLD_MIN_CHARS 字符时，在
		// 输入卡顶部显示只读提示条（▸ N 行 · M 字符 · 首行预览）。点击 ✕ 暂时隐藏，
		// 内容再次变化后恢复显示。绝不修改 draft、不碰官方 paste 事务/引用 chip/
		// undo——value 变化通过既有 value setter 的 __dshPasteFold 回调分发。
		function installPasteFold() {
			const FOLD_MIN_LINES = 6;
			const FOLD_MIN_CHARS = 600;
			const seen = new WeakSet();
			const makeChip = (seat) => {
				const chip = document.createElement('div');
				chip.className = 'dsh-cli-pastefold';
				chip.setAttribute('aria-hidden', 'true');
				const text = document.createElement('span');
				text.className = 'dsh-cli-pastefold-text';
				chip.appendChild(text);
				const dismiss = document.createElement('span');
				dismiss.className = 'dsh-cli-pastefold-dismiss';
				dismiss.textContent = '\u2715';
				chip.appendChild(dismiss);
				dismiss.addEventListener('click', (e) => {
					e.stopPropagation();
					chip.dataset.dismissed = '1';
					chip.classList.remove('visible');
				});
				// 插入到输入滚动容器前（scroll 带稳定 data 属性 data-input-scroll）
				const scroll = seat.querySelector('[data-input-scroll="true"]');
				if (scroll && scroll.parentNode === seat) seat.insertBefore(chip, scroll);
				else seat.appendChild(chip);
				return chip;
			};
			const update = (ta, chip, value) => {
				const v = value === undefined ? (ta.value || '') : value;
				const lines = v.split('\n').length;
				const chars = v.length;
				const big = lines >= FOLD_MIN_LINES || chars >= FOLD_MIN_CHARS;
				if (!big) {
					chip.classList.remove('visible');
					return;
				}
				const sig = lines + ':' + chars;
				if (chip.dataset.dismissed === '1') {
					// 手动隐藏后内容未变 → 保持隐藏；变了 → 恢复显示
					if (chip.dataset.sig === sig) return;
					delete chip.dataset.dismissed;
				}
				chip.dataset.sig = sig;
				const first = v.split('\n')[0].trim().slice(0, 28);
				const txt = chip.querySelector('.dsh-cli-pastefold-text');
				if (txt) txt.textContent = '\u25B8 ' + lines + ' 行 · ' + chars + ' 字符'
					+ (first ? ' · ' + first : '');
				chip.classList.add('visible');
			};
			const tryInstall = () => {
				const seats = document.querySelectorAll('.dsh-cli-composer-seat');
				for (const seat of seats) {
					if (seen.has(seat)) continue;
					const ta = seat.querySelector('textarea');
					if (!ta) continue;
					seen.add(seat);
					const chip = makeChip(seat);
					const schedule = () => rafThrottle(() => update(ta, chip));
					ta.__dshPasteFold = (v) => schedule(); // 走既有 value setter 劫持
					ta.addEventListener('input', schedule); // 用户键入兜底
					schedule();
				}
			};
			tryInstall();
			watchBody(tryInstall);
		}

		// ---- 3.1d 删除后高度缩回兜底（A2 附带 · 2026-08-26）
		// 官方受控链路 textarea value={draft} + mirror {draft}\n 正常删除时随
		// onChange 同步缩回；但 hero 态偶发"删除/退格的 input 事件漏进 React"
		// 导致 draft 未更新、输入框高度不缩回。此兜底在 keyup(Backspace/Delete)
		// 或 input 后下一帧比对 textarea 与 mirror(draft) 长度，脱节则补发 input
		// 事件驱动 React onChange 同步（DOM 已删 → state 跟上）。带计数上限防
		// 循环、带 isComposing 防 IME；脱节时仅多派发几次无害的 input。
		function installDraftShrinkSync() {
			const attempts = new WeakMap();
			const check = (ta) => {
				const seat = ta.closest('.dsh-cli-composer-seat');
				if (!seat) return;
				const mirror = seat.querySelector('[data-input-mirror="true"]');
				if (!mirror) return;
				const vLen = ta.value.length;
				const mLen = (mirror.textContent || '').length - 1;
				if (mLen === vLen) { attempts.delete(ta); return; }
				const a = attempts.get(ta) || { n: 0, len: vLen };
				if (a.len !== vLen) { a.n = 0; a.len = vLen; }
				if (a.n >= 3) return; // 官方对该删除无响应：放弃，避免无谓循环
				a.n += 1;
				attempts.set(ta, a);
				ta.dispatchEvent(new Event('input', { bubbles: true }));
			};
			const scan = () => {
				requestAnimationFrame(() => {
					const seats = document.querySelectorAll('.dsh-cli-composer-seat');
					for (const seat of seats) {
						const ta = seat.querySelector('textarea');
						if (ta) check(ta);
					}
				});
			};
			document.addEventListener('keyup', (e) => {
				if (e.isComposing) return;
				if (e.key === 'Backspace' || e.key === 'Delete') scan();
			}, true);
			document.addEventListener('input', (e) => {
				if (e.isComposing) return;
				const t = e.target;
				if (t instanceof HTMLTextAreaElement && t.closest('.dsh-cli-composer-seat')) scan();
			}, true);
		}

		// ---- 3.1f 发送即上屏兜底（用户需求 · 2026-08-28）
		// 症状：发送长消息/模型思考久时，偶发"先出 thinking 再弹用户消息"。
		// 根因：官方 user 消息渲染依赖服务端提交往返（submit → RPC → 事件 → 投影），
		// 无乐观投影；模型 TTFT 长或服务端偶发延迟时，user 消息晚于 thinking 上屏。
		// 兜底：Enter 发送成功（draft 清空）后 60ms 检查官方 user 气泡是否已渲染；
		// 未渲染（官方延迟）→ 在消息区末尾插入仿官方样式的临时气泡 + 滚到底，
		// 官方 user 气泡出现后自动移除（200ms 轮询，5s 上限）。正常路径（官方
		// <60ms 渲染）完全不插入，零干扰。样式 §20 cli-flavor.css。
		function installUserEcho(ta) {
			if (ta.__dshEcho) return;
			ta.__dshEcho = true;
			let pendingValue = '';
			let echoTimer = null;
			let watchTimer = null;
			let echoEl = null;
			let echoText = '';

			const hasOfficial = () => {
				const sc = document.querySelector('[data-conversation-scroll]');
				if (!sc) return false;
				const probe = echoText.trim().slice(0, 12);
				if (!probe) return true;
				const rows = sc.querySelectorAll('[class$="_userRow"]');
				for (const row of rows) {
					if ((row.textContent || '').includes(probe)) return true;
				}
				return false;
			};
			const removeEcho = () => {
				if (echoEl && echoEl.isConnected) echoEl.remove();
				echoEl = null;
				if (watchTimer) { clearInterval(watchTimer); watchTimer = null; }
				echoText = '';
			};
			const scrollBottom = () => {
				const sc = document.querySelector('[data-conversation-scroll]');
				if (sc) sc.scrollTop = sc.scrollHeight;
			};
			const ensureEcho = (text) => {
				try {
					if (hasOfficial()) return; // 官方已渲染（正常路径）
					const sc = document.querySelector('[data-conversation-scroll]');
					if (!sc) return;
					removeEcho();
					echoText = text;
					echoEl = document.createElement('div');
					echoEl.className = 'dsh-cli-echo-bubble';
					const inner = document.createElement('div');
					inner.className = 'dsh-cli-echo-bubble-inner';
					inner.textContent = text;
					echoEl.appendChild(inner);
					sc.appendChild(echoEl);
					scrollBottom();
					let n = 0;
					watchTimer = setInterval(() => {
						n++;
						if (hasOfficial() || n >= 25) removeEcho();
						else scrollBottom();
					}, 200);
				} catch (err) { /* 皮肤兜底异常不阻断 */ }
			};

			// Enter 发送意图检测
			ta.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey
					&& !e.isComposing && e.keyCode !== 229 && !ta.readOnly) {
					pendingValue = ta.value;
				}
			}, true);

			// value setter 链：draft 清空 = 发送成功（复用 __dshPasteFold 通道，不二次劫持）
			const prev = ta.__dshPasteFold;
			ta.__dshPasteFold = (v) => {
				try {
					if (typeof prev === 'function') prev(v);
					if (v === '' && pendingValue) {
						const text = pendingValue;
						pendingValue = '';
						if (text.trim()) {
							if (echoTimer) clearTimeout(echoTimer);
							echoTimer = setTimeout(() => { echoTimer = null; ensureEcho(text); }, 60);
						}
					} else if (v !== '') {
						pendingValue = ''; // 用户编辑路径，取消发送检测
					}
				} catch (err) { /* 不阻断 */ }
			};
		}

		// ---- 3.2 Esc 中断生成：官方主按钮运行时变停止态，click 触发 cancel() ----
		function installEscapeStop() {
			const onKey = (e) => {
				if (e.key !== 'Escape') return;
				// CLI 选择器激活时放行 Esc：焦点在 .dsh-cli-select 内（含自定义
				// 输入框）→ 不拦截，让选择器自理两段式（输入→返回选项，选项→取消）。
				// 否则本 capture 监听会抢先 stopBtn.click() 直接取消整个提问。
				const ae = document.activeElement;
				if (ae && ae.closest && ae.closest('.dsh-cli-select')) return;
				const stopBtn = document.querySelector(
					'button[aria-label="停止生成"], button[aria-label="Stop generating"]'
				);
				if (stopBtn && !stopBtn.disabled) {
					e.preventDefault();
					e.stopPropagation();
					stopBtn.click();
				}
			};
			// capture 阶段先于官方 dismissPopup 处理
			document.addEventListener('keydown', onKey, true);
		}

		// ---- 3.4 ContextMeter 仪表隐藏（纯视觉，数据仍由 StatsLine/面板持有） ----
		function hideContextMeter() {
			// 性能精简（2026-08-28）：原实现每帧跑 `div:has(textarea) button`
			// 关系选择器 + getBoundingClientRect（强制同步布局）。流式渲染期间
			// 每帧强制布局是卡顿主因之一。改为：只扫输入卡内按钮（textarea →
			// closest 输入卡），宽度每钮只测一次（缓存到元素上）。
			const hide = () => {
				for (const ta of document.querySelectorAll('textarea')) {
					const seat = ta.closest('.dsh-cli-composer-seat') || ta.parentElement;
					if (!seat) continue;
					for (const btn of seat.querySelectorAll('button')) {
						if (btn.style.display === 'none') continue;
						if (!btn.querySelector('svg circle')) continue;
						let w = btn.__dshMeterW;
						if (w === undefined) {
							// 28px 圆形按钮（含 svg circle）→ 仪表 trigger；只测一次
							w = btn.getBoundingClientRect().width;
							btn.__dshMeterW = w;
						}
						if (w <= 40) btn.style.display = 'none';
					}
				}
			};
			hide();
			watchBody(hide);
		}

		// ---- 3.5 M2-2 todo 任务列表终端化（纯 CSS 无法区分 [ ]/[x]，
		//      因为 DSH 把 checkbox 语法渲染成 <li><code>- [ ]</code>，code 无属性。
		//      JS 读文本打类：[x]→.dsh-cli-todo-done、[ ]→.dsh-cli-todo-pending，
		//      CSS 再画 ●/○/✓ + 树状前缀 + 绿色完成态。 ----
		function installTodoMarkup() {
			const mark = () => {
				for (const code of document.querySelectorAll('li code')) {
					const t = (code.textContent || '').trim();
					if (!/^[-*]\s*\[[ xX]\]/.test(t)) continue;
					const li = code.parentElement;
					if (!li || li.tagName !== 'LI') continue;
					const done = /^[-*]\s*\[[xX]\]/.test(t);
					li.classList.add(done ? 'dsh-cli-todo-done' : 'dsh-cli-todo-pending');
					// code 元素本体打类（CSS 隐藏原文，用伪元素画符号）
					code.classList.add(done ? 'dsh-cli-todo-check' : 'dsh-cli-todo-box');
				}
			};
			mark();
			// 会话切换/流式追加会重建 DOM，持续观察重新打类（与 installPromptGlyph 一致）
			watchBody(mark);
		}

		// ---- 3.6 终端签名：favicon + 标题（GOAL 第六部分，用户 2026-08-19 要求"更有终端味道"）
		//      favicon：注入内联 SVG data URI（深底 + 白色 `>_` 提示符 + 等宽风），
		//      覆盖官方 /favicon.svg。`>_` 白色（2026-08-20 用户要求：金 #febc38 → 蓝
		//      #0088fa → 白 #ffffff）。标题：`dsh › DeepSeek Harness`（终端路径风）。
		//      纯浏览器侧注入，不动 dist 资源。 ----
		const TERMINAL_FAVICON_SVG = [
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
			'  <rect width="32" height="32" rx="4" fill="#121212"/>',
			'  <text x="7" y="23" font-family="Consolas, monospace" font-size="17" font-weight="bold" fill="#ffffff">&gt;_</text>',
			'</svg>'
		].join('');
		const TERMINAL_TITLE = 'dsh › DeepSeek Harness';

		function installTerminalSignature() {
			// favicon：替换现有 icon link 或新增
			let link = document.querySelector('link[rel="icon"]');
			if (link) {
				link.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(TERMINAL_FAVICON_SVG));
			} else {
				link = document.createElement('link');
				link.rel = 'icon';
				link.type = 'image/svg+xml';
				link.href = 'data:image/svg+xml,' + encodeURIComponent(TERMINAL_FAVICON_SVG);
				document.head.appendChild(link);
			}
			// 标题（含备用标题的 apple-touch-icon 不动）
			if (document.title !== TERMINAL_TITLE) {
				document.title = TERMINAL_TITLE;
			}
		}

		// 模型·力度抓取（2026-08-20 方案 A）：优先走官方 slot 锚点
		// [data-slot="conversation.input.model"] —— 模型选择器（ModelSelect）的 trigger
		// 内模型名与力度是两个独立 span（_triggerLabel/_triggerEffort），天然分离、
		// 任意模型可识别（修复 Kimi K3 等非 DeepSeek 系模型不被旧正则白名单识别、
		// StatsBar 模型段整个消失的问题）。锚点缺失时 fallback 到旧的特征词正则。
		// 返回统一格式："模型名 · 力度" 或 "模型名"；抓不到返回 ''。
		function grabModelText() {
			const seat = document.querySelector('[data-slot="conversation.input.model"]');
			if (seat) {
				const labelEl = seat.querySelector('[class$="_triggerLabel"]');
				const model = labelEl ? (labelEl.textContent || '').trim() : '';
				if (model) {
					const effortEl = seat.querySelector('[class$="_triggerEffort"]');
					const effort = effortEl ? (effortEl.textContent || '').trim() : '';
					return effort ? model + ' · ' + effort : model;
				}
			}
			// fallback：旧的特征词正则（仅 DeepSeek 系可识别）
			const trs = document.querySelectorAll('button[class$="_trigger"], [class$="_trigger"]');
			for (const t of trs) {
				const txt = (t.textContent || '').trim();
				if (/DeepSeek|V[0-9]|Flash|Pro|Max|High|Medium|Low|effort/i.test(txt)) {
					const m = txt.match(/^(.*?)(High|Medium|Low|Max|Auto)?$/);
					const model = (m && m[1] ? m[1] : txt).trim();
					return m && m[2] ? model + ' · ' + m[2] : model;
				}
			}
			return '';
		}
		// ============================================================================
		// 4. 启动：所有定义就绪后执行（必须放在末尾，避免 const TDZ 问题）
		// ============================================================================
		if (typeof document !== 'undefined') {
			const boot = () => {
				installPromptGlyph();
				installComposerTerminal();
				installInputScrollIsolation();
				installPasteFold();
				installDraftShrinkSync();
				installTodoMarkup();
				installTerminalSignature();
			};
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', boot);
			} else {
				boot();
			}
		}

		// ============================================================================
		// 5. 插件主体（Cordis 三件套；纯视觉插件，host 侧无逻辑）
		// ============================================================================
		const name = 'web-cli-flavor';
		const inject = [];

		// ---- S3：完整状态栏（替换官方 StatsLine，所有数据一个组件一行排开）
		// 数据源（DSH 自带投影，useProjection）：
		//   sessionStats: { turns, steps }
		//   tokenUsage: { uncachedInputTokens, outputTokens, cacheReadTokens, cacheWriteTokens }
		//   contextPressure: { pressureTokens, projectedTokens, contextWindow }
		// 模型·力度从模型选择器 trigger（DOM）抓取（与旧 JS 注入一致）。----
		const fmt = (n) => {
			if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
			if (n >= 1000) return Math.round(n / 1000) + 'K';
			return String(n);
		};
		const StatsBar = (props) => {
			const useProjection = props.useProjection;
			const stats = useProjection('sessionStats') || {};
			const usage = useProjection('tokenUsage') || {};
			const pressure = useProjection('contextPressure') || {};
			// 模型·力度（DOM trigger）：首渲染时 trigger 可能未挂载 → 慢加载。
			// useEffect 轮询补抓（500ms），trigger 出现即 setState 触发重渲染，
			// 不依赖投影变化（修复"模型比其他数据慢一点"）。
			const [modelText, setModelText] = react.useState('');
			react.useEffect(() => {
				// A5 轮询瘦身（2026-08-28）：原 1s 常驻轮询——页面静止也每秒全页
				// DOM 查询（[data-slot] + 所有 _trigger 按钮）。改为：
				//   1) 首挂载后模型 trigger 可能晚到 → 有限重试几次（300/1s/2.5s）；
				//   2) 之后模型变化几乎总来自用户点模型选择器 → click 捕获即时刷新；
				//   3) 5s 慢兜底（仅前台标签执行查询，document.hidden 直接跳过），
				//      覆盖 /effort 等命令路径与 trigger 重建场景。
				// 常驻 1Hz → 事件驱动，空闲时零定时查询。
				const grab = () => {
					if (document.hidden) return;
					const txt = grabModelText();
					setModelText(prev => (prev === txt ? prev : txt));
				};
				grab();
				const retries = [300, 1000, 2500].map(ms => setTimeout(grab, ms));
				const safety = setInterval(grab, 5000);
				const onClick = (e) => {
					const t = e.target;
					if (!(t instanceof Element)) return;
					if (t.closest('[data-slot="conversation.input.model"]') || t.closest('[class$="_trigger"]')) grab();
				};
				document.addEventListener('click', onClick, true);
				return () => {
					retries.forEach(id => clearTimeout(id));
					clearInterval(safety);
					document.removeEventListener('click', onClick, true);
				};
			}, []);
			const segments = [];
			if (modelText) {
				// modelText 已是最终显示文本（grabModelText 统一输出 "模型 · 力度" 或 "模型"）
				segments.push(react.createElement('span', { className: 'dsh-cli-statsbar-model', key: 'model' }, modelText));
			}
			const turns = stats.turns ?? 0;
			const steps = stats.steps ?? 0;
			if (turns || steps) {
				segments.push(react.createElement('span', { className: 'dsh-cli-statsbar-counts', key: 'counts' },
					turns + ' 轮 · ' + steps + ' 步'));
			}
			const uncached = usage.uncachedInputTokens ?? 0;
			const output = usage.outputTokens ?? 0;
			const cacheR = usage.cacheReadTokens ?? 0;
			const cacheW = usage.cacheWriteTokens ?? 0;
			const inTotal = uncached + cacheR + cacheW;
			if (inTotal > 0 || output > 0) {
				segments.push(react.createElement('span', { className: 'dsh-cli-statsbar-token', key: 'token' },
					'输入 ' + fmt(inTotal) + ' · 输出 ' + fmt(output)));
				if (inTotal > 0) {
					segments.push(react.createElement('span', { className: 'dsh-cli-statsbar-cache', key: 'cache' },
						'缓存命中 ' + Math.round((cacheR / inTotal) * 100) + '%'));
				}
			}
			const used = pressure.projectedTokens ?? pressure.pressureTokens;
			const totalCtx = pressure.contextWindow;
			if (used && totalCtx) {
				segments.push(react.createElement('span', { className: 'dsh-cli-statsbar-ctx', key: 'ctx' },
					'上下文 ' + Math.round((used / totalCtx) * 100) + '%'));
			}
			if (!segments.length) return null;
			const children = [];
			segments.forEach((seg, i) => {
				if (i > 0) children.push(react.createElement('span', { className: 'dsh-cli-statsbar-sep', key: 'sep' + i }, '|'));
				children.push(seg);
			});
			return react.createElement('div', { className: 'dsh-cli-statsbar' }, children);
		};

		function apply(ctx) {
			// 完整状态栏：注册 id='stats' + priority=-1 替换官方 StatsLine。
			// list slot 按 priority 升序、同 id 只留第一个（lowest renders）——
			// priority=-1 排在官方 (0) 前，官方 stats 被 shadow 不渲染。
			// ⚠️ 不加 priority 会与官方 stats（同 id 同 priority 0）冲突抛异常
			//（"already has an entry with id stats"，曾导致 Failed to load plugins）。
			const slots = ctx.get('slots');
			if (slots === undefined) return;
			slots.inject('conversation.composer.dock', () => slots.register(
				{ name: 'conversation.composer.dock', id: 'stats', order: 0, priority: -1 },
				(props) => react.createElement(StatsBar, props)
			));

			// ============================================================================
			// CLI 选择器：把官方 ask_user_question 打造成内嵌对话记录的终端风格选择器
			// ----------------------------------------------------------------------------
			// 原理：
			//   - conversation.composer 链（priority=-2）只负责「捕获 wait 载体」，渲染 null，
			//     从而让官方问题卡片不再以"输入框上方弹窗"形式出现。
			//   - tool.call.toolview key=ask_user_question 在对话记录流里渲染完整 CLI 选择器
			//     （问题 + 选项 + 推荐徽标 + 多选），用户交互后通过共享 wait 回传标准答案协议。
			//   - 模块级 sharedWait 把两个 slot 的 wait 串起来（同一闭包，天然共享）。
			// 支持：推荐徽标（title 尾部 (推荐)/（推荐）/(recommended)）、header、多选（空格勾选）、
			//       批量多题、Esc 取消、自动聚焦 + 隐藏输入光标 + Tab 锁定、scrollIntoView smooth。
			// 主题：全走 --dsw-alias-* 令牌 + --dsw-font-family，浅色/深色自动跟随。
			// ============================================================================

			// ---- 模块级共享：composer 捕获 wait，toolview 回传用 ----
			let sharedWait = null;
			const waitWaiters = [];
			function setSharedWait(wait) {
				sharedWait = wait;
				for (const w of waitWaiters.splice(0)) w(wait);
			}
			function getSharedWait() { return sharedWait; }
			function onSharedWait(cb) {
				if (sharedWait) { cb(sharedWait); return () => {}; }
				waitWaiters.push(cb);
				return () => {
					const i = waitWaiters.indexOf(cb);
					if (i >= 0) waitWaiters.splice(i, 1);
				};
			}

			// ---- 官方推荐标签解析（与官方 parseRecommendedLabel 语义一致）----
			function parseRecommendedLabel(label) {
				const suffix = /\s*(?:\((?:recommended|推荐)\)|（(?:recommended|推荐)）)\s*$/i;
				return suffix.test(label)
					? { label: label.replace(suffix, ''), recommended: true }
					: { label: label, recommended: false };
			}

			// ---- 选项行 ----
			function OptionRow(props) {
				const { opt, index, cursor, multi, checked, onHover, onConfirm } = props;
				const display = parseRecommendedLabel(opt.label);
				// 光标行：单选多选都高亮（多选时方向键移动也要能看到 ❯ 在哪）
				const isSel = index === cursor;
				const isChecked = multi && checked;
				const selClass = (isSel ? ' is-selected' : '') + (isChecked ? ' is-checked' : '');
				let marker;
				if (multi) {
					// 多选：❯(光标) + ☑/☐(勾选) 两段，两个维度都可见
					marker = react.createElement('span', { className: 'dsh-cli-select-marker' },
						react.createElement('span', { className: 'dsh-cli-select-arrow' }, isSel ? '❯' : ' '),
						react.createElement('span', { className: 'dsh-cli-select-check' }, isChecked ? '☑' : '☐'));
				} else {
					marker = react.createElement('span', { className: 'dsh-cli-select-arrow' }, isSel ? '❯' : ' ');
				}
				return react.createElement('div', {
					className: 'dsh-cli-select-option' + selClass,
					onMouseEnter: onHover,
					onClick: onConfirm,
				},
					marker,
					react.createElement('span', { className: 'dsh-cli-select-title' }, display.label),
					display.recommended ? react.createElement('span', { className: 'dsh-cli-select-badge' }, '推荐') : null,
					opt.description ? react.createElement('div', { className: 'dsh-cli-select-desc' }, opt.description) : null);
			}

			// ---- 自定义输入行（✎ 自己输入…）：等宽提示符 + 输入框 ----
			function CustomInputRow(props) {
				const { multi, value, onChange, onSubmit, onCancel, autoFocus } = props;
				const ref = react.useRef(null);
				react.useEffect(function () {
					if (autoFocus && ref.current) {
						ref.current.focus();
						// 输入时保留可见 caret（区别于选择器隐藏光标）
					}
				}, [autoFocus]);
				const onKey = (ev) => {
					// Enter：输入框自理提交（stopPropagation 防止冒泡到 div 的 Enter）；
					// Esc：不在此处理，让它冒泡到选择器 div 的 keydown 统一按
					// customMode 分支（输入模式→返回选项；否则→取消）。
					if (ev.key === 'Enter' && !ev.shiftKey) {
						ev.preventDefault();
						ev.stopPropagation();
						onSubmit();
					} else if (ev.key === 'Tab') {
						ev.preventDefault();
						ev.stopPropagation();
					}
				};
				const line = react.createElement('div', { className: 'dsh-cli-select-custom' },
					react.createElement('span', { className: 'dsh-cli-select-custom-prompt' }, '>'),
					react.createElement('input', {
						ref: ref,
						type: 'text',
						className: 'dsh-cli-select-custom-input',
						value: value,
						placeholder: multi ? '输入补充说明或自定义答案…' : '输入自定义答案…',
						onChange: (e) => onChange(e.target.value),
						onKeyDown: onKey,
					}));
				// 提示行由外层渲染分支统一输出（customMode 时显示
				// 'Enter 提交 · Esc 返回选项 · 也可直接点选上方选项'），
				// 这里不再渲染 hint，避免出现两行重复提示。
				return react.createElement('div', null, line);
			}

			// ---- toolview key=ask_user_question：消息流内嵌完整 CLI 选择器 ----
			function CliAskEmbedded(props) {
				const block = props.block;
				const settled = !!(block && block.kind === 'tool-result');
				const argsRaw = settled ? (block.call && block.call.argsRaw) : (block && block.argsRaw);
				let questions = [];
				try {
					const parsed = argsRaw ? JSON.parse(argsRaw) : null;
					if (parsed && Array.isArray(parsed.questions)) questions = parsed.questions;
				} catch (e) {}

				const [answers, setAnswers] = react.useState([]);
				const [activeIdx, setActiveIdx] = react.useState(0);
				const [cursor, setCursor] = react.useState(0);
				const [checked, setChecked] = react.useState([]);
				const [customMode, setCustomMode] = react.useState(false);
				const [customText, setCustomText] = react.useState('');
				const [waitReady, setWaitReady] = react.useState(false);
				const [el, setEl] = react.useState(null);

				// 等待 composer 链捕获 wait（交互回传需要它）
				react.useEffect(function () {
					if (settled) return;
					const off = onSharedWait(function () { setWaitReady(true); });
					if (getSharedWait()) setWaitReady(true);
					return off;
				}, [settled]);

				const current = questions[activeIdx];
				const finished = activeIdx >= questions.length;
				const isMultiQuestion = (q) => !!(q && (q.multiSelect === true || q.multi_select === true));
				const multi = isMultiQuestion(current);
				const opts = (current && Array.isArray(current.options)) ? current.options : [];

				const respondBatch = (answersList) => {
					const wait = getSharedWait();
					if (!wait || typeof wait.respond !== 'function') return;
					wait.respond({ ok: true, value: { sessionId: wait.sessionId, answer: { answers: answersList } } }).catch(function () {});
				};
				const cancelAll = () => {
					const wait = getSharedWait();
					if (!wait || typeof wait.respond !== 'function') return;
					wait.respond({ ok: false, error: { code: 'cancelled', message: 'the user closed this question request', details: {} } }).catch(function () {});
				};

				const toggleChecked = (i) => {
					setChecked((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : prev.concat([i]));
				};
				const confirmCurrent = () => {
					const q = current;
					if (!q) return;
					let selected = [];
					if (multi) {
						selected = checked.map((i) => opts[i]).filter(Boolean).map((o) => o.label);
						if (!selected.length) return;
					} else {
						const opt = opts[cursor];
						if (!opt) return;
						selected = [opt.label];
					}
					const nextAnswers = answers.concat([{ id: q.id, selected: selected }]);
					setAnswers(nextAnswers);
					if (nextAnswers.length >= questions.length) {
						respondBatch(nextAnswers);
					} else {
						setActiveIdx(nextAnswers.length);
						setCursor(0);
						setChecked([]);
					}
				};
				// 自定义输入提交：照官方协议——单选时 custom 取代 selected，
				// 多选时 custom 与勾选共存；无 custom 则不挂 custom 字段。
				const confirmCustom = () => {
					const q = current;
					if (!q) return;
					const custom = customText.trim();
					if (custom === '') return;
					let selected = [];
					if (multi) selected = checked.map((i) => opts[i]).filter(Boolean).map((o) => o.label);
					const entry = custom === ''
						? { id: q.id, selected: selected }
						: (multi
							? { id: q.id, selected: selected, custom: custom }
							: { id: q.id, selected: [], custom: custom });
					const nextAnswers = answers.concat([entry]);
					setAnswers(nextAnswers);
					if (nextAnswers.length >= questions.length) {
						respondBatch(nextAnswers);
					} else {
						setActiveIdx(nextAnswers.length);
						setCursor(0);
						setChecked([]);
						setCustomMode(false);
						setCustomText('');
					}
				};
				const enterCustomMode = () => {
					setCustomMode(true);
					setCustomText('');
				};

				// 焦点 + 键盘（选择器 div 始终挂监听；Esc 用 customMode 分支：
				// 输入模式下返回选项，否则取消整个选择——不依赖焦点在哪）
				react.useEffect(function () {
					if (settled || finished || !current || !el) return;
					if (!waitReady) return;
					const input = document.querySelector('textarea');
					const wasFocused = input && document.activeElement === input;
					if (wasFocused) input.blur();
					if (!customMode) {
						el.focus({ preventScroll: true });
						try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
					}
					const maxLen = Math.max(1, opts.length + 1);
					const onKeyDown = (ev) => {
						if (ev.key === 'ArrowDown') { ev.preventDefault(); if (!customMode) setCursor((c) => (c + 1) % maxLen); }
						else if (ev.key === 'ArrowUp') { ev.preventDefault(); if (!customMode) setCursor((c) => (c - 1 + maxLen) % maxLen); }
						else if (multi && !customMode && ev.key === ' ') { ev.preventDefault(); toggleChecked(cursor); }
						else if (ev.key === 'Enter') {
							// 输入模式下 Enter 由 input 自理（提交）；这里只拦 preventDefault
							ev.preventDefault();
							if (customMode) return;
							if (cursor === opts.length) { enterCustomMode(); return; }
							confirmCurrent();
						}
						else if (ev.key === 'Escape') {
							ev.preventDefault();
							if (customMode) { setCustomMode(false); return; }
							cancelAll();
						}
						else if (ev.key === 'Tab') { ev.preventDefault(); }
					};
					el.addEventListener('keydown', onKeyDown);
					return () => {
						el.removeEventListener('keydown', onKeyDown);
						// ⚠️ 不要在这里 input.focus() 归还焦点：本 effect 依赖
						// cursor/checked 变化会重跑，归还会让焦点每按一次方向键
						// 闪回 textarea、方向键事件被输入框吃掉（实测失效）。
						// 问题答完输入框焦点自然恢复，无需主动归还。
					};
				}, [settled, finished, current, cursor, checked, el, waitReady, answers, customMode]);

				// settled：折叠结果行
				if (settled) {
					let summary = '✗ 已取消选择';
					let cls = 'dsh-cli-select-result is-cancel';
					try {
						const texts = (block.content || []).filter((c) => c && c.type === 'text').map((c) => c.text || '');
						const parsed = texts.length ? JSON.parse(texts.join('')) : null;
						const ans = parsed && Array.isArray(parsed.answers) ? parsed.answers : [];
						if (block.isError) {
							const code = block.error && block.error.code;
							if (code !== 'ASK_CANCELLED' && code !== 'ASK_ABORTED') { summary = '✗ 已结束'; cls = 'dsh-cli-select-result is-cancel'; }
						} else if (ans.length) {
							const labels = ans.map((a) => {
								if (a && typeof a.custom === 'string' && a.custom.trim() !== '') return '✎ ' + a.custom;
								const s = a && Array.isArray(a.selected) ? a.selected[0] : null;
								return s ? parseRecommendedLabel(s).label : '';
							}).filter(Boolean);
							summary = '✓ 已选择：' + labels.join('、');
							cls = 'dsh-cli-select-result is-ok';
						}
					} catch (e) {}
					const q0 = questions[0];
					return react.createElement('div', { className: 'dsh-cli-select dsh-cli-select-done' },
						q0 && q0.header ? react.createElement('div', { className: 'dsh-cli-select-header' }, q0.header) : null,
						q0 ? react.createElement('div', { className: 'dsh-cli-select-question' }, q0.question) : null,
						react.createElement('div', { className: cls }, summary));
				}

				// 无问题
				if (!questions.length) {
					return react.createElement('div', { className: 'dsh-cli-select' },
						react.createElement('div', { className: 'dsh-cli-select-question' }, '（等待问题…）'));
				}

				// 渲染当前问题的完整 CLI 选择器
				return react.createElement('div', { className: 'dsh-cli-composer' },
					questions.map((q, qi) => {
						if (qi < answers.length) {
							const a = answers[qi];
							const sel = a && typeof a.custom === 'string' && a.custom.trim() !== ''
								? '✎ ' + a.custom
								: (a.selected && a.selected.length ? a.selected.map((s) => parseRecommendedLabel(s).label).join('、') : '');
							return react.createElement('div', { key: q.id, className: 'dsh-cli-select dsh-cli-select-done' },
								q.header ? react.createElement('div', { className: 'dsh-cli-select-header' }, q.header) : null,
								react.createElement('div', { className: 'dsh-cli-select-question' }, q.question),
								react.createElement('div', { className: 'dsh-cli-select-result is-ok' }, '✓ 已选择：' + sel));
						}
						if (qi === activeIdx && !finished) {
							const isMulti = isMultiQuestion(q);
							const customEntry = {
								label: '✎ 自己输入…',
								description: isMulti ? '可勾选后补充说明，或直接输入' : '不想选预设，自己打字',
							};
							// 选项列表始终保留（customMode 时输入行追加在列表下方），
							// 输入途中随时点选/勾选其他选项，避免"输入就锁死"。
							const leaveCustom = () => setCustomMode(false);
							return react.createElement('div', { key: q.id, ref: setEl, tabIndex: 0, className: 'dsh-cli-select' },
								q.header ? react.createElement('div', { className: 'dsh-cli-select-header' }, q.header) : null,
								react.createElement('div', { className: 'dsh-cli-select-question' }, q.question),
								opts.map((opt, oi) => react.createElement(OptionRow, {
									key: oi, opt: opt, index: oi, cursor: cursor, multi: isMulti,
									checked: checked.includes(oi),
									onHover: () => setCursor(oi),
									onConfirm: () => {
										leaveCustom();
										if (isMulti) { toggleChecked(oi); return; }
										setCursor(oi); confirmCurrent();
									},
								})),
								customMode
									? react.createElement(CustomInputRow, {
										multi: isMulti,
										value: customText,
										onChange: (v) => setCustomText(v),
										onSubmit: confirmCustom,
										onCancel: () => setCustomMode(false),
										autoFocus: true,
									})
									: react.createElement(OptionRow, {
										key: 'custom', opt: customEntry, index: opts.length, cursor: cursor, multi: false,
										checked: false,
										onHover: () => setCursor(opts.length),
										onConfirm: () => { setCursor(opts.length); enterCustomMode(); },
									}),
								react.createElement('div', { className: 'dsh-cli-select-hint' },
									customMode
										? 'Enter 提交 · Esc 返回选项 · 也可直接点选上方选项'
										: (isMulti ? '↑↓ 移动 · 空格 勾选 · Enter 提交 · Esc 取消' : '↑↓ 选择 · Enter 确认 · Esc 取消 · 末项输入')));
						}
						return react.createElement('div', { key: q.id, className: 'dsh-cli-select-pending' }, '· ' + q.question + '（待答）');
					}));
			}

			// ---- composer 链：只捕获 wait（去弹窗），渲染 null ----
			function CliWaitCapture(props) {
				const wait = props.matched;
				react.useEffect(function () {
					if (wait) setSharedWait(wait);
				}, [wait]);
				return null;
			}

			function selectQuestionInteraction(owner) {
				const items = (owner && owner.interactions) || [];
				const found = items.find(function (i) {
					if (!i || i.kind !== 'question') return false;
					const qs = i.payload ? (i.payload.questions || []) : [];
					return !qs.some(function (q) { return q && q.intent; });
				});
				return found || null;
			}

			slots.inject('tool.call.toolview', () => slots.register(
				// priority -1：keyed slot 同 key 且同 priority(默认0) 会与官方
				// ask-question-toolview 冲突抛异常；-1 排在官方(0)前 shadow 它
				//（lowest renders），与 StatsBar 替换官方同款做法。
				{ name: 'tool.call.toolview', key: 'ask_user_question', priority: -1 },
				(props) => react.createElement(CliAskEmbedded, { block: props.block, callId: props.callId })
			));
			slots.inject('conversation.composer', () => slots.register(
				{ name: 'conversation.composer', select: selectQuestionInteraction, priority: -2 },
				(props) => react.createElement(CliWaitCapture, { matched: props.matched })
			));

			// ---- /effort 斜杠命令：切换当前模型的思考强度（推理力度）----
			// 数据源 = 官方 modelDirectories service（与 /model 选择器、composer 模型座
			// 同一份权威数据：切换后 trigger / StatsBar / hero 模型行自动同步）。
			// 当前模型无 reasoning（如 Kimi K3 走 OpenAI 兼容接入、未声明力度档）→
			// available 返回 false，命令从斜杠菜单隐藏（2026-08-20 用户拍板）。
			ctx.inject(['commandUi', 'modelDirectories', 'sessions'], (scope) => {
				const command = scope.get('commandUi');
				const models = scope.get('modelDirectories');
				const sessions = scope.get('sessions');
				if (command === undefined || models === undefined || sessions === undefined) return;
				// 按 host 报告的 current（provider/model）在目录里找模型元数据
				const choiceOf = (st) => {
					if (!st || !st.current) return undefined;
					for (const g of st.groups) {
						for (const m of g.models) {
							if (g.id === st.current.provider && m.id === st.current.model) return m;
						}
					}
					return undefined;
				};
				scope.effect(() => {
					try {
						return command.register({
							name: 'effort',
							description: '切换思考强度',
							available: (session) => {
								const sessionId = session && session.sessionId;
								if (!sessionId) return false;
								try {
									if (sessions.subagentAddress(sessionId) !== undefined) return false;
									const m = choiceOf(models.directoryFor(sessionId).store.getSnapshot());
									return !!m && !!m.reasoning && m.reasoning.efforts.length > 0;
								} catch (e) {
									return false;
								}
							},
							ui: {
								kind: 'popupSelect',
								options: async (session) => {
									const sessionId = session && session.sessionId;
									if (!sessionId) return [];
									const dir = models.directoryFor(sessionId);
									await dir.load().catch(() => { /* 目录加载失败：沿用上次快照 */ });
									const st = dir.store.getSnapshot();
									const m = choiceOf(st);
									if (!m || !m.reasoning || m.reasoning.efforts.length === 0) return [];
									const rows = [];
									// 提供商默认项（仅当有 defaultEffort 时，与官方菜单一致）
									if (m.reasoning.defaultEffort !== undefined) {
										const defName = (m.reasoning.efforts.find((e) => e.id === m.reasoning.defaultEffort) || {}).name
											|| m.reasoning.defaultEffort;
										rows.push({
											id: 'provider-default',
											label: '提供商默认',
											detail: '跟随提供商预设（' + defName + '）',
											active: st.current.reasoningEffort === undefined,
										});
									}
									for (const e of m.reasoning.efforts) {
										rows.push({
											id: 'effort:' + e.id,
											label: e.name,
											active: st.current.reasoningEffort === e.id,
										});
									}
									return rows;
								},
								onSelect: async (option, session) => {
									const sessionId = session && session.sessionId;
									if (!sessionId) return;
									const dir = models.directoryFor(sessionId);
									const st = dir.store.getSnapshot();
									if (!st.current) return;
									if (option.id === 'provider-default') {
										await dir.select({ provider: st.current.provider, model: st.current.model });
									} else if (option.id.indexOf('effort:') === 0) {
										await dir.select({
											provider: st.current.provider,
											model: st.current.model,
											reasoningEffort: option.id.slice('effort:'.length),
										});
									}
								},
							},
						});
					} catch (err) {
						// 命令名冲突等异常：仅影响 /effort，不让皮肤插件整体失效
						console.error('[web-cli-flavor] /effort 注册失败：', err);
						return () => {};
					}
				});
			});
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});
