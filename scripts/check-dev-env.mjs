#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import net from 'node:net';
import { createInterface } from 'node:readline/promises';
import process from 'node:process';

const ENV_PATH = '.env.dev';
const EXAMPLE_PATH = '.env.dev.example';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function parseEnvFile(path) {
  const env = {};
  const content = readFileSync(path, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) continue;
    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function readPort(env, name) {
  const rawValue = env[name];
  const port = Number(rawValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} 必须是 1-65535 的端口号，当前值：${rawValue ?? '(missing)'}`);
  }
  return port;
}

function assertUniquePorts(namedPorts) {
  const seen = new Map();
  for (const [name, port] of Object.entries(namedPorts)) {
    const existing = seen.get(port);
    if (existing) {
      throw new Error(`${name} 与 ${existing} 使用了相同端口 ${port}`);
    }
    seen.set(port, name);
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function assertLocalHttpUrl(value, expectedPort, expectedPath, name) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} 必须是合法 URL`);
  }

  const expectedPathname = expectedPath || '/';
  if (url.protocol !== 'http:' || !LOCAL_HOSTS.has(url.hostname) || url.port !== String(expectedPort) || url.pathname !== expectedPathname) {
    throw new Error(`${name} 必须指向本机 ${expectedPort}${expectedPath}`);
  }
}

function assertLocalMongoUri(value, expectedPort) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('MONGODB_URI 必须是合法 MongoDB URI');
  }

  if (url.protocol !== 'mongodb:' || !LOCAL_HOSTS.has(url.hostname) || url.port !== String(expectedPort)) {
    throw new Error(`MONGODB_URI 必须指向本机 MongoDB ${expectedPort}`);
  }
}

function isComposeServiceRunning(serviceName) {
  try {
    const output = execFileSync(
      'docker',
      [
        'compose',
        '--env-file',
        ENV_PATH,
        '-f',
        'docker-compose.yml',
        '-f',
        'docker-compose.infra.dev.yml',
        'ps',
        '--services',
        '--filter',
        'status=running',
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return output.split(/\r?\n/).includes(serviceName);
  } catch {
    return false;
  }
}

function getComposePublishedPort(serviceName, containerPort) {
  try {
    const output = execFileSync(
      'docker',
      [
        'compose',
        '--env-file',
        ENV_PATH,
        '-f',
        'docker-compose.yml',
        '-f',
        'docker-compose.infra.dev.yml',
        'port',
        serviceName,
        String(containerPort),
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    const match = output.match(/:(\d+)$/);
    return match ? Number(match[1]) : null;
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(`[dev:check] ${message}`);
  process.exit(1);
}

function canPrompt() {
  const ci = String(process.env.CI ?? '').toLowerCase();
  return Boolean(process.stdin.isTTY && process.stdout.isTTY && ci !== 'true' && ci !== '1');
}

function queryPortListeners(port) {
  let output;
  try {
    output = execFileSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-F', 'pc'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return [];
  }

  const listeners = [];
  let current = null;
  for (const line of output.split(/\r?\n/)) {
    if (!line) continue;
    const prefix = line[0];
    const value = line.slice(1);
    if (prefix === 'p') {
      const pid = Number(value);
      if (Number.isInteger(pid)) current = { pid, command: '' };
    } else if (prefix === 'c' && current) {
      current.command = value.trim();
      listeners.push(current);
      current = null;
    }
  }

  const unique = new Map();
  for (const listener of listeners) {
    if (!unique.has(listener.pid)) unique.set(listener.pid, listener);
  }
  return Array.from(unique.values());
}

function getParentPid(pid) {
  try {
    const output = execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const parentPid = Number(output);
    return Number.isInteger(parentPid) ? parentPid : null;
  } catch {
    return null;
  }
}

function getCurrentAncestorPids() {
  const ancestors = new Set([process.pid]);
  let current = process.ppid;
  for (let depth = 0; current && depth < 12; depth += 1) {
    ancestors.add(current);
    current = getParentPid(current);
  }
  return ancestors;
}

const DANGEROUS_COMMAND_PREFIXES = ['docker', 'com.docker', 'containerd', 'launchd', 'kernel_task'];

function isUnsafeListener(listener, currentAncestorPids) {
  if (!listener.command) return true;
  if (listener.pid <= 1) return true;
  if (currentAncestorPids.has(listener.pid)) return true;
  const command = listener.command.toLowerCase();
  return DANGEROUS_COMMAND_PREFIXES.some((prefix) => command === prefix || command.startsWith(`${prefix}.`) || command.startsWith(`${prefix}-`));
}

function formatListeners(listeners) {
  return listeners.map(({ pid, command }) => `${pid} (${command})`).join(', ');
}

function oldPortConflictMessage(name, port) {
  return `${name}=${port} 已被占用，请停止占用进程或修改 ${ENV_PATH}`;
}

async function askYesNo(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(question)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

async function waitForPortRelease(port, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isPortOpen(port))) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return !(await isPortOpen(port));
}

async function maybeTerminatePortListeners(name, port) {
  if (!(await isPortOpen(port))) return;

  const failMessage = oldPortConflictMessage(name, port);
  if (!canPrompt()) {
    throw new Error(failMessage);
  }

  const initialListeners = queryPortListeners(port);
  const currentAncestorPids = getCurrentAncestorPids();
  if (initialListeners.length === 0 || initialListeners.some((listener) => isUnsafeListener(listener, currentAncestorPids))) {
    throw new Error(failMessage);
  }

  console.error(`[dev:check] ${name}=${port} 已被占用：${formatListeners(initialListeners)}`);
  const confirmed = await askYesNo(`[dev:check] 是否终止这些进程并继续？ [y/N] `);
  if (!confirmed) {
    throw new Error(failMessage);
  }

  const listeners = queryPortListeners(port);
  if (listeners.length === 0) return;
  if (listeners.some((listener) => isUnsafeListener(listener, currentAncestorPids))) {
    throw new Error(`${failMessage}。端口占用进程已变化，请手动检查`);
  }

  for (const listener of listeners) {
    try {
      process.kill(listener.pid, 'SIGTERM');
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ESRCH') continue;
      if (error && typeof error === 'object' && 'code' in error && error.code === 'EPERM') {
        throw new Error(`${failMessage}。没有权限终止 ${listener.pid} (${listener.command})`);
      }
      throw error;
    }
  }

  if (!(await waitForPortRelease(port))) {
    throw new Error(`${failMessage}。已发送 SIGTERM，但端口仍未释放，请手动处理：${formatListeners(queryPortListeners(port))}`);
  }

  console.error(`[dev:check] ${name}=${port} 已释放`);
}

if (!existsSync(ENV_PATH)) {
  fail(`缺少 ${ENV_PATH}。请先运行：cp ${EXAMPLE_PATH} ${ENV_PATH}`);
}

try {
  const env = parseEnvFile(ENV_PATH);
  const ports = {
    API_PORT: readPort(env, 'API_PORT'),
    WEB_PORT: readPort(env, 'WEB_PORT'),
    MONGO_PORT: readPort(env, 'MONGO_PORT'),
    REDIS_PORT: readPort(env, 'REDIS_PORT'),
  };

  assertUniquePorts(ports);

  if (env.NODE_ENV !== 'development') {
    throw new Error('NODE_ENV 必须是 development');
  }

  assertLocalMongoUri(env.MONGODB_URI, ports.MONGO_PORT);

  if (!LOCAL_HOSTS.has(env.REDIS_HOST)) {
    throw new Error('REDIS_HOST 必须是本机地址');
  }

  assertLocalHttpUrl(env.CORS_ORIGIN, ports.WEB_PORT, '', 'CORS_ORIGIN');
  assertLocalHttpUrl(env.NEXT_PUBLIC_API_URL, ports.API_PORT, '/api/v1', 'NEXT_PUBLIC_API_URL');

  for (const name of ['API_PORT', 'WEB_PORT']) {
    await maybeTerminatePortListeners(name, ports[name]);
  }

  const infraPorts = [
    ['MONGO_PORT', 'mongo', 27017],
    ['REDIS_PORT', 'redis', 6379],
  ];

  for (const [portName, serviceName, containerPort] of infraPorts) {
    if (await isPortOpen(ports[portName])) {
      const publishedPort = getComposePublishedPort(serviceName, containerPort);
      if (!isComposeServiceRunning(serviceName) || publishedPort !== ports[portName]) {
        throw new Error(`${portName}=${ports[portName]} 已被非本项目 ${serviceName} 服务占用`);
      }
    }
  }

  console.log('[dev:check] OK');
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
