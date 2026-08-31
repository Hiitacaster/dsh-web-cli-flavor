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
(() => {
if (typeof window === 'undefined' || !window.__ModuleLoader__ || typeof window.__ModuleLoader__.load !== 'function') {
	console.warn('[web-cli-flavor] host __ModuleLoader__ not available, skin not loaded.');
	return;
}
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

		// ---- 调试辅助：皮肤代码异常不阻断主流程，但必须留下日志 ----
		const logError = (label, err) => {
			if (typeof console !== 'undefined' && console.error) {
				console.error('[web-cli-flavor]', label, err);
			}
		};

		// ============================================================================
		// 1. 注入皮肤 CSS（一次性；热重载/重复挂载时去重）
		// ============================================================================
		const css = /*__CLI_FLAVOR_CSS__*/ '';
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
					try { t(); } catch (e) { logError('rafThrottle task', e); }
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
			} catch (e) { logError('textarea.value hook', e); }
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
				} catch (err) { logError('userEcho', err); }
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
				} catch (err) { logError('userEcho setter', err); }
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
				} catch (e) { logError('safe guard', e); }

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
						try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { logError('safe guard', e); }
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
					} catch (e) { logError('safe guard', e); }
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
})();
