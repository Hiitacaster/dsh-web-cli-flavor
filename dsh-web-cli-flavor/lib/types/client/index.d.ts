/**
 * dsh-web-cli-flavor — browser 半侧类型占位声明
 * ----------------------------------------------------------------------------
 * client.js 为浏览器端注入脚本，通过宿主提供的 __ModuleLoader__ 注册。
 * 此处仅声明所需的全局符号，避免 TypeScript 项目导入时出现"无声明文件"错误。
 */

export {};

declare global {
  interface Window {
    __ModuleLoader__?: {
      load(options: { id: string; factory: (require: (id: string) => any) => any }): void;
    };
    __DSH_CLI_FLAVOR_BOOTED__?: boolean;
  }
}
