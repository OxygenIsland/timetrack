/**
 * 验证 axios 拦截器与 trace_id 工具（无第三方依赖）
 *
 * 运行：cd apps/frontend && npx tsx src/__verify__/trace_verify.ts
 *
 * 验收点：
 *  1. generateTraceId 必须是 16 位小写 hex
 *  2. 请求拦截器自动注入 X-Trace-Id
 *  3. 显式 X-Trace-Id 优先
 *  4. 响应拦截器从响应头 / 错误体回填到 store
 *  5. 网络错误时 store 保留请求阶段生成的 trace_id
 *  6. copyTraceId 复制成功
 *  7. sessionStorage 持久化闭环
 */

import axios from 'axios';
import {
  generateTraceId,
  copyTraceId,
  persistTraceId,
  readPersistedTraceId,
} from '../core/trace/traceId';
import { useGlobalStore } from '../stores/globalStore';

let passed = 0;
let failed = 0;
async function run(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`✅ ${name}`);
  } catch (e) {
    failed++;
    console.error(`❌ ${name}\n   ${(e as Error).message}`);
  }
}

function makeRequestInterceptor() {
  return (config: any) => {
    const explicit =
      (config.headers['X-Trace-Id'] as string) ||
      (config.headers['x-trace-id'] as string);
    const traceId = explicit || generateTraceId();
    config.headers['X-Trace-Id'] = traceId;
    useGlobalStore.getState().setLastTraceId(traceId);
    persistTraceId(traceId);
    return config;
  };
}

function makeResponseHandlers() {
  return {
    onRes: (response: any) => {
      const headerTraceId =
        (response.headers['x-trace-id'] as string | undefined) ||
        (response.data as any)?.trace_id;
      if (headerTraceId) {
        useGlobalStore.getState().setLastTraceId(headerTraceId);
        persistTraceId(headerTraceId);
      }
      return response.data;
    },
    onErr: (error: any) => {
      const headerTraceId = error.response?.headers?.['x-trace-id'];
      const bodyTraceId = error.response?.data?.trace_id;
      const traceId = headerTraceId || bodyTraceId || '';
      if (traceId) {
        useGlobalStore.getState().setLastTraceId(traceId);
        persistTraceId(traceId);
      }
      throw error;
    },
  };
}

async function captureConfig(client: any, opts: any = {}): Promise<any> {
  let captured: any = null;
  try {
    await client.get('http://127.0.0.1:1/test', {
      timeout: 100,
      ...opts,
      adapter: (config: any) => {
        captured = config;
        if (opts.__reply) return opts.__reply(config);
        return Promise.reject(new Error('mocked'));
      },
    });
  } catch (_) {}
  return captured;
}

async function verifyRequestInterceptor() {
  const client = axios.create();
  client.interceptors.request.use(makeRequestInterceptor());

  await run('1. 请求拦截器自动注入 16hex', async () => {
    const c = await captureConfig(client);
    const sent = c.headers['X-Trace-Id'];
    if (!/^[0-9a-f]{16}$/.test(sent)) {
      throw new Error(`trace_id 不合法: ${sent}`);
    }
  });

  await run('2. 显式 X-Trace-Id 优先', async () => {
    const c = await captureConfig(client, {
      headers: { 'X-Trace-Id': 'fixed-trace-id' },
    });
    if (c.headers['X-Trace-Id'] !== 'fixed-trace-id') {
      throw new Error(`未沿用显式 trace_id: ${c.headers['X-Trace-Id']}`);
    }
  });

  await run('3. 请求拦截器写入 store', async () => {
    useGlobalStore.getState().setLastTraceId('');
    const c = await captureConfig(client);
    const sent = c.headers['X-Trace-Id'];
    if (useGlobalStore.getState().lastTraceId !== sent) {
      throw new Error(
        `store 未同步: store=${useGlobalStore.getState().lastTraceId} sent=${sent}`,
      );
    }
  });

  await run('4. sessionStorage 持久化闭环', () => {
    // Node 环境没有 sessionStorage，需要 polyfill 来验证
    const memStore: Record<string, string> = {};
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (k: string) => memStore[k] ?? null,
        setItem: (k: string, v: string) => {
          memStore[k] = v;
        },
        removeItem: (k: string) => {
          delete memStore[k];
        },
      },
      configurable: true,
      writable: true,
    });
    persistTraceId('aabbccddeeff0011');
    const stored = readPersistedTraceId();
    if (stored !== 'aabbccddeeff0011') {
      throw new Error(`sessionStorage 闭环失败: "${stored}"`);
    }
  });
}

async function verifyResponseInterceptor() {
  const client = axios.create();
  client.interceptors.request.use(makeRequestInterceptor());
  const { onRes, onErr } = makeResponseHandlers();
  client.interceptors.response.use(onRes, onErr);

  await run('5. 响应拦截器从 X-Trace-Id 响应头回填', async () => {
    useGlobalStore.getState().setLastTraceId('');
    try {
      await client.get('http://127.0.0.1:1/test', {
        timeout: 100,
        adapter: (config: any) =>
          Promise.resolve({
            data: { ok: true },
            status: 200,
            statusText: 'OK',
            headers: { 'x-trace-id': 'server-generated-trace' },
            config,
            request: {},
          }),
      });
    } catch (e) {
      throw new Error('期望 200 但收到: ' + (e as Error).message);
    }
    if (useGlobalStore.getState().lastTraceId !== 'server-generated-trace') {
      throw new Error(`store 未更新: ${useGlobalStore.getState().lastTraceId}`);
    }
  });

  await run('6. 错误响应从 body.trace_id 回填', async () => {
    useGlobalStore.getState().setLastTraceId('');
    try {
      await client.get('http://127.0.0.1:1/test', {
        timeout: 100,
        adapter: (config: any) => {
          const err: any = new Error('Request failed');
          err.response = {
            data: {
              code: 'E-SYS-002',
              message: 'Internal Error',
              trace_id: 'body-trace-err',
            },
            status: 500,
            headers: {},
            config,
          };
          return Promise.reject(err);
        },
      });
    } catch (_) {}
    if (useGlobalStore.getState().lastTraceId !== 'body-trace-err') {
      throw new Error(`错误响应未回填: ${useGlobalStore.getState().lastTraceId}`);
    }
  });

  await run('7. 网络错误时保留请求阶段 trace_id', async () => {
    useGlobalStore.getState().setLastTraceId('');
    try {
      await client.get('http://127.0.0.1:1/test', {
        timeout: 100,
        adapter: () => Promise.reject(new Error('Network Error')),
      });
    } catch (_) {}
    const last = useGlobalStore.getState().lastTraceId;
    if (!/^[0-9a-f]{16}$/.test(last)) {
      throw new Error(`请求阶段 trace_id 丢失: ${last}`);
    }
  });
}

async function verifyUtils() {
  await run('8. generateTraceId 格式正确 (100 次)', () => {
    for (let i = 0; i < 100; i++) {
      const id = generateTraceId();
      if (!/^[0-9a-f]{16}$/.test(id)) {
        throw new Error(`非法: ${id}`);
      }
    }
  });

  await run('9. copyTraceId 复制到剪贴板', async () => {
    // Node 25+ 把 globalThis.navigator 设成只读 getter，用 defineProperty
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: async (s: string) => {
            (global as any).__copied = s;
          },
        },
      },
      configurable: true,
      writable: true,
    });
    (global as any).__copied = null;
    const ok = await copyTraceId('abc123def456');
    if (!ok) throw new Error('copy 返回 false');
    if ((global as any).__copied !== 'abc123def456') {
      throw new Error('内容不对: ' + (global as any).__copied);
    }
  });
}

async function main() {
  await verifyRequestInterceptor();
  await verifyResponseInterceptor();
  await verifyUtils();
  console.log(`\n--- ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exitCode = 1;
}

main();
