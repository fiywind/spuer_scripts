/**
 * WebKit-Shield v2.0 — Request Pre-Filter (QuantumultX)
 * ======================================================
 * 
 * 核心职责：在请求阶段识别"可能携带恶意代码"的请求
 * 策略：三层过滤漏斗，逐层收窄，最终只有极小比例的请求被标记为可疑
 * 
 * 过滤逻辑：
 *   Pass 1 - 排除已知安全上下文（Apple/主流CDN/国内大厂）
 *   Pass 2 - 排除正常 App 流量（非 Safari/WebKit UA 的直接放过）
 *   Pass 3 - 对剩余请求做"可疑特征评分"，>=2 分才标记
 * 
 * 被标记的域名会写入 $prefs，供响应层脚本读取
 * 标记有效期 5 分钟，过期自动清除（避免持久污染）
 * 
 * Author: 东哥 x 小强🪳
 * Version: 2.0.0
 * Update:2026-04-09
 */

// ============================================================
// 常量配置
// ============================================================

// 标记前缀（$prefs key 的命名空间）
const PREFIX = "ws2_suspect_";
// 标记有效期（5分钟）
const TTL_MS = 5 * 60 * 1000;

// 已知安全域名（放行列表，从 snippet 正则已过滤一部分，这里做二次兜底）
const SAFE_DOMAINS = [
  "apple.com", "icloud.com", "mzstatic.com", "apple.co",
  "google.com", "googleapis.com", "gstatic.com", "youtube.com",
  "facebook.com", "fbcdn.net", "instagram.com", "whatsapp.com",
  "cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com",
  "cloudflare.com", "cloudfront.net", "akamai.net", "fastly.net",
  "baidu.com", "qq.com", "weixin.qq.com", "taobao.com", "tmall.com",
  "alipay.com", "jd.com", "163.com", "126.com", "weibo.com", "zhihu.com",
  "bilibili.com", "douyin.com", "toutiao.com", "ctrip.com", "meituan.com",
  "microsoft.com", "github.com", "stackoverflow.com", "reddit.com",
  "twitter.com", "x.com", "linkedin.com", "amazon.com", "netflix.com",
  "spotify.com", "twitch.tv", "discord.com", "slack.com",
];

// Safari/WebKit UA 特征（只有这些 UA 发出的请求才需要深入检查）
const SAFARI_UA_PATTERNS = [
  /Mobile\/[\dA-Z]* Safari\//,
  /Version\/[\d.]+ Safari\//,
  /CriOS\//,               // Chrome on iOS (uses WebKit)
  /FxIOS\//,               // Firefox on iOS (uses WebKit)
  /EdgiOS\//,              // Edge on iOS (uses WebKit)
];

// 可疑 URL 特征（每条 +1 分）
const SUSPICIOUS_URL_FEATURES = [
  // 域名特征：非主流 TLD + 长随机子域名
  { pattern: /^https?:\/\/[a-z0-9]{8,}\.[a-z]{2,4}\.\//i, weight: 1 },
  // 路径特征：深层嵌套 + 随机参数
  { pattern: /\/[a-z0-9]{12,}\//i, weight: 1 },
  // 路径特征：纯数字文件名
  { pattern: /\/\d{6,10}\.js(\?|$)/i, weight: 1 },
  // 路径特征：看起来像 hash/ID 的文件名
  { pattern: /\/[a-z0-9_-]{20,}\.js(\?|$)/i, weight: 1 },
  // 参数特征：多个随机参数
  { pattern: /\?[a-z]=\w{8,}&[a-z]=\w{8,}/i, weight: 1 },
  // 路径特征：/static/ 或 /assets/ 下有可疑子路径
  { pattern: /\/(?:static|assets|dist|build)\/[a-z0-9]{6,}\/.*\.js/i, weight: 1 },
];

// 可疑请求头特征（每条 +1 分）
const SUSPICIOUS_HEADER_FEATURES = [
  // Referer 来自已知水坑/恶意域名
  { pattern: /7aac\.gov\.ua|novosti\.dn\.ua|b27\.icu/i, header: "Referer", weight: 3 },
  // Referer 来自 .xyz / .icu / .top 等（经常被 exploit kit 使用）
  { pattern: /^https?:\/\/[^/]+\.(xyz|icu|top|tk|ml|ga|cf|pw|buzz|club)\//i, header: "Referer", weight: 1 },
  // Origin 头指向可疑域名
  { pattern: /^https?:\/\/[^/]+\.(xyz|icu|top|tk|ml|ga|cf)\//i, header: "Origin", weight: 2 },
  // 请求来自内嵌框架（不常见于正常 JS 加载）
  { pattern: /nested/i, header: "Sec-Fetch-Dest", weight: 1 },
];

// 可疑域名分类（匹配即 +1，无需精确 IOC）
const SUSPICIOUS_DOMAIN_PATTERNS = [
  /.\.xyz$/,               // .xyz 域名（exploit kit 高发区）
  /.\.icu$/,               // .icu 域名（Coruna C2 实际使用）
  /.\.top$/,               // .top 域名
  /.\.tk$/,                // .tk 域名
  /.\.ml$/,                // .ml 域名
  /.\.ga$/,                // .ga 域名
  /.\.pw$/,                // .pw 域名
  /plasmagrid/i,           // Coruna 通信标识
];

// 可疑标记触发阈值
const SUSPECT_THRESHOLD = 2;


// ============================================================
// 主逻辑
// ============================================================
(function () {
  const url = $request.url;
  const headers = $request.headers || {};
  const hostname = url.match(/^https?:\/\/([^/?#]+)/i)?.[1]?.toLowerCase() || "";
  const basePath = hostname.replace(/^www\./, "");

  // ── Pass 0：解析域名用于后续检查 ─────────────────────────
  // 提取根域名（如 a.b.c.xyz.com → xyz.com）
  const domainParts = basePath.split(".");
  const rootDomain = domainParts.length >= 2
    ? domainParts.slice(-2).join(".")
    : basePath;
  const tld = domainParts.length >= 2 ? domainParts[domainParts.length - 1] : "";

  // ── Pass 1：已知安全域名 → 直接放行 ─────────────────────
  for (const safe of SAFE_DOMAINS) {
    if (hostname.includes(safe)) {
      $done({});
      return;
    }
  }

  // ── Pass 2：非 WebKit UA → 直接放行 ─────────────────────
  // 只有 Safari/WebKit 内核的浏览器才面临 Coruna RCE 风险
  // 其他 App 的 WebKit 用途（如 API 调用）不会触发恶意 JS 执行
  const ua = headers["User-Agent"] || headers["user-agent"] || "";
  let isWebKit = false;
  for (const safariPattern of SAFARI_UA_PATTERNS) {
    if (safariPattern.test(ua)) {
      isWebKit = true;
      break;
    }
  }

  if (!isWebKit) {
    // 非 Safari/WebKit UA 发出的请求，不可能是浏览器里的恶意 JS
    $done({});
    return;
  }

  // ── Pass 3：可疑特征评分 ─────────────────────────────────
  let score = 0;
  const reasons = [];

  // 3a. URL 特征评分
  for (const feature of SUSPICIOUS_URL_FEATURES) {
    if (feature.pattern.test(url)) {
      score += feature.weight;
      reasons.push("URL");
      if (score >= SUSPECT_THRESHOLD + 2) break; // 提前退出
    }
  }

  // 3b. 请求头特征评分
  if (score < SUSPECT_THRESHOLD + 2) {
    for (const feature of SUSPICIOUS_HEADER_FEATURES) {
      const headerValue = headers[feature.header] || headers[feature.header.toLowerCase()] || "";
      if (headerValue && feature.pattern.test(headerValue)) {
        score += feature.weight;
        reasons.push(`${feature.header}`);
        if (score >= SUSPECT_THRESHOLD + 2) break;
      }
    }
  }

  // 3c. 域名分类评分
  if (score < SUSPECT_THRESHOLD + 2) {
    for (const dp of SUSPICIOUS_DOMAIN_PATTERNS) {
      if (dp.test(rootDomain) || dp.test(basePath)) {
        score += 1;
        reasons.push("Domain");
        break; // 域名最多加 1 分
      }
    }
  }

  // ── 判定 ─────────────────────────────────────────────────
  if (score >= SUSPECT_THRESHOLD) {
    // 标记为可疑：写入 $prefs，供响应层脚本读取
    const key = PREFIX + basePath;
    const value = JSON.stringify({
      score,
      reasons,
      ts: Date.now(),
      url: url.substring(0, 200), // 截断避免存储过大
    });
    $prefs.setValueForKey(value, key);

    console.log(
      `[WebKit-Shield-Req] ⚠️ 可疑标记 score=${score} | ${reasons.join(",")} | ${basePath}`
    );
  }

  // 不管是否标记，请求层都不拦截（让请求正常发出）
  // 拦截由响应层决定（如果有恶意内容的话）
  $done({});
})();
