/**
 * dsh-web-cli-flavor — host 半侧类型占位声明
 * ----------------------------------------------------------------------------
 * 本包为纯 JavaScript 实现，此处提供最小类型声明以满足 package.json exports
 * 中 "types" 字段的解析需求。
 */

export interface PluginContext {
  inject: (services: string[], callback: (scope: any) => void) => void;
  [key: string]: any;
}

export const name: 'web-cli-flavor';
export const inject: readonly string[];
export function apply(ctx: PluginContext): void;
