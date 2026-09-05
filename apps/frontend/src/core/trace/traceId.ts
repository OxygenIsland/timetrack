/**
 * Trace ID 工具
 *
 * 设计目标：
 * - 与后端 (FastAPI) 生成的 trace_id 格式对齐：16 位小写 hex
 *   后端：`uuid.uuid4().hex[:16]`；前端用同算法保证可读性
 * - 同时把"当前会话最近一次"trace_id 写入 sessionStorage 便于跨页面共享
 * - 提供 `copyTraceId` 一键复制（用于反馈 bug 时把 id 贴出来）
 */

/** 生成一个 16 位小写 hex trace_id */
export function generateTraceId(): string {
  // uuid v4 形如 '5d1f9c3a-...-...-...-...'；去掉 - 后截前 16 位
  return (crypto.randomUUID?.() ?? fallbackUuid())
    .replace(/-/g, '')
    .slice(0, 16);
}

/** 老浏览器 / 单元测试环境的兜底 */
function fallbackUuid(): string {
  // 简单的 32 位 hex（不保证 RFC4122 合规，但后端只看 16 位）
  let s = '';
  for (let i = 0; i < 32; i++) {
    s += Math.floor(Math.random() * 16).toString(16);
  }
  return s;
}

/** sessionStorage 缓存键 */
export const TRACE_STORAGE_KEY = 'timetrack:lastTraceId';

/** 同步读取（首屏渲染时如果需要展示） */
export function readPersistedTraceId(): string {
  try {
    return sessionStorage.getItem(TRACE_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

/** 写入（响应拦截器调用） */
export function persistTraceId(traceId: string): void {
  if (!traceId) return;
  try {
    sessionStorage.setItem(TRACE_STORAGE_KEY, traceId);
  } catch {
    // sessionStorage 不可用（如 SSR / 隐私模式）时静默忽略
  }
}

/** 一键复制到剪贴板 */
export async function copyTraceId(traceId: string): Promise<boolean> {
  if (!traceId) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(traceId);
      return true;
    }
    // 兜底：execCommand
    const ta = document.createElement('textarea');
    ta.value = traceId;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}
