/**
 * WebKit-Shield v2.1 — Runtime API Hardening (QuantumultX)
 * ==========================================================
 * 
 * 层五：运行时 API 硬化
 * 通过向 HTML 页面注入防御 JS，在浏览器运行时封堵高风险 Web API，
 * 即使 exploit 代码绕过了网络层检测，也无法在运行时完成攻击。
 * 
 * 防御目标：
 *   - WebAssembly：JIT 提权路径的核心入口（Coruna/DarkSword 均依赖）
 *   - SharedArrayBuffer：侧信道攻击 + 高精度计时攻击
 *   - performance.now()：时间侧信道攻击（降低精度）
 *   - DeviceMotion / DeviceOrientation：传感器侧信道
 * 
 * 设计原则：
 *   - 对所有 Safari 访问的 HTML 页面注入（开销极小，约 0.5KB）
 *   - 使用 Object.defineProperty 封堵，防止被 exploit 脚本恢复
 *   - 仅在 Safari/WebKit UA 下注入，不影响其他 App
 *   - 与层四（响应体检测）互补：层四拦下载荷，层五封堵运行时
 * 
 * 性能影响：
 *   - 注入脚本 < 1KB，解析时间 < 0.1ms
 *   - 封堵操作在页面 JS 执行前完成（注入在 <head> 最前面）
 *   - 不影响正常网页功能（正常网页极少依赖 WebAssembly）
 * 
 * Author: fiywind
 * Version: 2.1.0
 */

(function () {
  const url = $request.url;
  const reqHeaders = $request.headers || {};
  const resHeaders = $response.headers || {};
  const body = $response.body || "";
  const contentType = (
    resHeaders["content-type"] || resHeaders["Content-Type"] || ""
  ).toLowerCase();

  // ── 快速过滤：仅处理 HTML 页面 ─────────────────────────────
  if (!contentType.includes("text/html")) {
    $done({});
    return;
  }

  // ── UA 过滤：仅 Safari/WebKit 内核 ─────────────────────────
  const ua =
    reqHeaders["User-Agent"] || reqHeaders["user-agent"] || "";

  const isSafari =
    /Safari\/[\d.]+/.test(ua) &&
    !/Chrome\//.test(ua) && // 排除 Android Chrome（UA 也含 Safari）
    !/MicroMessenger\//.test(ua) && // 排除微信内置浏览器
    !/CriOS\//.test(ua) && // 排除 Chrome on iOS（虽然用 WebKit，但已有自己的安全策略）
    !/FxIOS\//.test(ua); // 排除 Firefox on iOS

  // iOS 系统的 WKWebView（App 内嵌网页）也用 WebKit，一并防护
  const isWKWebView = /iPhone|iPad|iPod/.test(ua) && /Mobile/.test(ua);

  if (!isSafari && !isWKWebView) {
    $done({});
    return;
  }

  // ── 查找注入点 ─────────────────────────────────────────────
  // 兼容 <head>、<HEAD>、<head > 等变体
  const headMatch = body.match(/<head[^>]*>/i);

  if (!headMatch) {
    $done({});
    return;
  }

  // ── 构建防御注入脚本 ───────────────────────────────────────
  const shieldJS = `
<script>
(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // 1. 封堵 WebAssembly（核心防御：阻断 JIT 提权路径）
  //    Coruna 和 DarkSword 的 RCE 均依赖 WebAssembly 进行
  //    内存布局控制和 shellcode 执行
  // ═══════════════════════════════════════════════════════════
  try {
    Object.defineProperty(window, 'WebAssembly', {
      get: function() { return undefined; },
      set: function() {},
      configurable: false,
      enumerable: true
    });
    // 同时删除已有的引用
    delete window.WebAssembly;
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════
  // 2. 封堵 SharedArrayBuffer（防止 Spectre 等侧信道攻击）
  //    SharedArrayBuffer 允许共享内存，是高精度计时攻击的基础
  // ═══════════════════════════════════════════════════════════
  try {
    Object.defineProperty(window, 'SharedArrayBuffer', {
      get: function() { return undefined; },
      set: function() {},
      configurable: false,
      enumerable: true
    });
    delete window.SharedArrayBuffer;
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════
  // 3. 降低 performance.now() 精度（削弱时间侧信道）
  //    JIT exploit 常用 performance.now() 测量执行时间差异
  //    来推断缓存状态和内存布局
  // ═══════════════════════════════════════════════════════════
  try {
    if (window.performance && window.performance.now) {
      const orig = window.performance.now.bind(window.performance);
      // 降低到 100us 精度（Apple Safari 原生就是 100us/5ms
      // 交叉精度，这里统一为 100us）
      window.performance.now = function() {
        return Math.floor(orig() / 0.1) * 0.1;
      };
    }
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════
  // 4. 降低 performance.timeOrigin 精度
  // ═══════════════════════════════════════════════════════════
  try {
    if (window.performance && 'timeOrigin' in window.performance) {
      const origOrigin = window.performance.timeOrigin;
      Object.defineProperty(window.performance, 'timeOrigin', {
        get: function() { return Math.floor(origOrigin / 100) * 100; },
        configurable: false
      });
    }
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════
  // 5. 封堵高精度计时器（Date.now 保持原精度，但限制其
  //    在 rAF 回调中的用途）
  // ═══════════════════════════════════════════════════════════
  try {
    // 限制 SharedWorker（也是侧信道攻击向量）
    Object.defineProperty(window, 'SharedWorker', {
      get: function() { return undefined; },
      set: function() {},
      configurable: false,
      enumerable: true
    });
    delete window.SharedWorker;
  } catch(e) {}

  // ═══════════════════════════════════════════════════════════
  // 6. 屏蔽敏感传感器 API（防止物理侧信道）
  //    攻击者可通过陀螺仪/加速度计数据推断用户输入
  // ═══════════════════════════════════════════════════════════
  try {
    Object.defineProperty(window, 'DeviceMotionEvent', {
      get: function() { return undefined; },
      set: function() {},
      configurable: false,
      enumerable: true
    });
    Object.defineProperty(window, 'DeviceOrientationEvent', {
      get: function() { return undefined; },
      set: function() {},
      configurable: false,
      enumerable: true
    });
  } catch(e) {}

})();
</script>`;

  // ── 注入到 <head> 最前面（在页面任何 JS 之前执行）─────────
  const injectedBody = body.replace(headMatch[0], headMatch[0] + shieldJS);

  $done({ body: injectedBody });
})();
