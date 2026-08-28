/**
 * ============================================================================
 * dsh-web-cli-flavor — 宿主半侧（host half）
 * ----------------------------------------------------------------------------
 * 1. 让 DSH 的模块系统在本包进入配置树（cordis.patch.yml 的 insert 条目）时，
 *    能根据 package.json 的 `dsh.client` 声明把浏览器半侧（lib/client.js）
 *    注册进 /plugins/ 注入清单（与 dsh-pet 相同的机制）。
 * 2. 注册三个权限切换短命令：/readonly /workspace /fullacc。
 *    它们只是系统原生 `/permission <预设>` 的别名：内部调用同一个
 *    permissionPresets 服务（base bundle 已配置 read-only / workspace-write /
 *    danger-full-access 三档预设），不改任何核心代码。
 * ============================================================================
 */

const name = 'web-cli-flavor';

/** 纯视觉插件 + 权限别名命令：不注入额外 host 服务 */
const inject = [];

/** 权限短命令 → 系统原生权限预设名 */
const PERMISSION_ALIASES = {
  readonly: 'read-only',
  workspace: 'workspace-write',
  fullacc: 'danger-full-access',
};

function apply(ctx) {
  // commands 与 permissionPresets 都是 host 平面服务；注入后注册三个别名，
  // 副作用随本 fiber 清理（停用插件时命令自动注销）。
  ctx.inject(['commands', 'permissionPresets'], (scope) => {
    for (const [command, preset] of Object.entries(PERMISSION_ALIASES)) {
      scope.commands.register({
        name: command,
        description: `Switch the permission preset to ${preset}`,
        handler: ({ agent }) => {
          scope.permissionPresets.set(agent.session, preset)
          return { kind: 'success', text: `preset ${preset}` }
        },
      })
    }
  })
}

// 导出插件三件套（Cordis Loader 需要）。本包 package.json 声明了 "type": "module"，
// 因此必须用 ESM 导出：写 CommonJS `exports.*` 会让 loader 按 ESM import 时抛
// `exports is not defined in ES module scope`，导致整个插件树加载失败（web 服务无法启动）。
export { apply, inject, name };
