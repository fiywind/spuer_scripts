/**
 * WebKit-Shield Core v2.2
 * 整合响应体扫描 + API 硬化注入
 * 支持双模式：精准模式 / 全量模式
 * 
 * 模式切换：
 * 1. URL 参数: webkit-shield-core.js?mode=full
 * 2. $prefs 开关: ws2_mode = "full"
 * 
 * @author 东哥
 * @date 2026-04-09
 */

(function() {
    'use strict';

    // ==================== 配置区域 ====================
    const CONFIG = {
        // 版本信息
        VERSION: '2.2.0',
        
        // 模式: 'precise' = 精准模式(仅可疑域名), 'full' = 全量模式(所有HTML)
        MODE: (() => {
            // 优先从 URL 参数读取
            const urlMatch = typeof $argument !== 'undefined' ? $argument.match(/mode=(\w+)/) : null;
            if (urlMatch) return urlMatch[1] === 'full' ? 'full' : 'precise';
            
            // 其次从 $prefs 读取
            if (typeof $prefs !== 'undefined') {
                const prefMode = $prefs.valueForKey('ws2_mode');
                if (prefMode) return prefMode;
            }
            
            return 'precise'; // 默认精准模式
        })(),
        
        // 扫描阈值（权重 ≥ 此值触发拦截）
        THRESHOLD: 3,
        
        // 调试模式
        DEBUG: false
    };

    // ==================== 恶意特征库 ====================
    const EXPLOIT_PATTERNS = {
        // 高危特征（权重 3）
        critical: [
            { pattern: /WebAssembly\.instantiate\s*\(\s*[^,]+,\s*\{[^}]*import[^}]*\}/i, desc: 'Wasm 动态实例化' },
            { pattern: /eval\s*\(\s*atob\s*\(/i, desc: 'eval + base64 解码' },
            { pattern: /Function\s*\(\s*atob\s*\(/i, desc: 'Function 构造器 + base64' },
            { pattern: /fetch\s*\(\s*['"`]https?:\/\/[^\/]*\.icu\//i, desc: '可疑域名 fetch' },
            { pattern: /import\s*\(\s*['"`]https?:\/\/[^\/]*\.xyz\//i, desc: '可疑域名动态导入' },
        ],
        
        // 中危特征（权重 2）
        high: [
            { pattern: /SharedArrayBuffer/i, desc: 'SharedArrayBuffer 使用' },
            { pattern: /Atomics\./i, desc: 'Atomics API 使用' },
            { pattern: /performance\.now\s*\(\s*\)/i, desc: '高精度计时器' },
            { pattern: /Worker\s*\(\s*['"`]blob:/i, desc: 'Blob URL Worker' },
            { pattern: /setTimeout\s*\(\s*function\s*\(\s*\)\s*\{[^}]*debugger/i, desc: '反调试代码' },
            { pattern: /debugger\s*;?\s*if\s*\(\s*!\s*debugger/i, desc: '条件反调试' },
        ],
        
        // 低危特征（权重 1）
        medium: [
            { pattern: /new\s+Worker\s*\(/i, desc: 'Web Worker 创建' },
            { pattern: /WebAssembly\./i, desc: 'WebAssembly API' },
            { pattern: /crypto\.subtle\./i, desc: 'Web Crypto API' },
            { pattern: /postMessage\s*\([^,]+,\s*['"*]\*['"*]\)/i, desc: '通配符 postMessage' },
            { pattern: /Object\.freeze\s*\(\s*window\s*\)/i, desc: '冻结 window 对象' },
        ],
        
        // 可疑字符串（权重 1）
        suspicious: [
            { pattern: /coruna|darksword|exploit|payload|shellcode/i, desc: '可疑关键词' },
            { pattern: /CVE-\d{4}-\d+/i, desc: 'CVE 编号' },
            { pattern: /0day|zeroday|zero-day/i, desc: '0day 关键词' },
        ]
    };

    // ==================== API 硬化代码 ====================
    const HARDENING_CODE = `
<script>
(function() {
    'use strict';
    
    // 标记已硬化，避免重复注入
    if (window.__ws2_hardened__) return;
    window.__ws2_hardened__ = true;
    
    // 1. WebAssembly 限制
    if (typeof WebAssembly !== 'undefined') {
        const origInstantiate = WebAssembly.instantiate;
        WebAssembly.instantiate = function(buffer, importObject) {
            console.warn('[WebKit-Shield] WebAssembly.instantiate 被调用');
            // 允许调用但记录日志
            return origInstantiate.apply(this, arguments);
        };
        
        const origCompile = WebAssembly.compile;
        WebAssembly.compile = function(buffer) {
            console.warn('[WebKit-Shield] WebAssembly.compile 被调用');
            return origCompile.apply(this, arguments);
        };
    }
    
    // 2. SharedArrayBuffer 限制
    if (typeof SharedArrayBuffer !== 'undefined') {
        Object.defineProperty(window, 'SharedArrayBuffer', {
            get: function() {
                console.warn('[WebKit-Shield] SharedArrayBuffer 访问被记录');
                return undefined; // 或返回原始值，视安全策略而定
            },
            configurable: false
        });
    }
    
    // 3. Worker 限制 - 限制 blob URL
    const origWorker = window.Worker;
    window.Worker = function(url, options) {
        if (typeof url === 'string' && url.startsWith('blob:')) {
            console.warn('[WebKit-Shield] Blob URL Worker 被创建:', url);
        }
        return new origWorker(url, options);
    };
    
    // 4. eval / Function 限制
    const origEval = window.eval;
    window.eval = function(code) {
        console.warn('[WebKit-Shield] eval 被调用');
        return origEval(code);
    };
    
    const origFunction = window.Function;
    window.Function = function() {
        console.warn('[WebKit-Shield] Function 构造器被调用');
        return origFunction.apply(this, arguments);
    };
    
    // 5. 防止反调试
    const origSetTimeout = window.setTimeout;
    window.setTimeout = function(fn, delay) {
        if (typeof fn === 'function' && fn.toString().includes('debugger')) {
            console.warn('[WebKit-Shield] 反调试 setTimeout 被拦截');
            return null;
        }
        return origSetTimeout.apply(this, arguments);
    };
    
    console.log('[WebKit-Shield] API 硬化已生效 (v2.2)');
})();
</script>
`;

    // ==================== 工具函数 ====================
    
    /**
     * 计算响应体风险评分
     */
    function calculateRiskScore(body) {
        let score = 0;
        const matches = [];
        
        // 检查高危特征
        EXPLOIT_PATTERNS.critical.forEach(rule => {
            if (rule.pattern.test(body)) {
                score += 3;
                matches.push({ level: 'CRITICAL', desc: rule.desc });
            }
        });
        
        // 检查中危特征
        EXPLOIT_PATTERNS.high.forEach(rule => {
            if (rule.pattern.test(body)) {
                score += 2;
                matches.push({ level: 'HIGH', desc: rule.desc });
            }
        });
        
        // 检查低危特征
        EXPLOIT_PATTERNS.medium.forEach(rule => {
            if (rule.pattern.test(body)) {
                score += 1;
                matches.push({ level: 'MEDIUM', desc: rule.desc });
            }
        });
        
        // 检查可疑字符串
        EXPLOIT_PATTERNS.suspicious.forEach(rule => {
            if (rule.pattern.test(body)) {
                score += 1;
                matches.push({ level: 'SUSPICIOUS', desc: rule.desc });
            }
        });
        
        return { score, matches };
    }
    
    /**
     * 检查域名是否在可疑列表中
     */
    function isSuspiciousDomain(hostname) {
        if (typeof $prefs === 'undefined') return false;
        
        const suspiciousList = $prefs.valueForKey('ws2_suspicious_domains');
        if (!suspiciousList) return false;
        
        const domains = suspiciousList.split(',');
        return domains.some(d => hostname.includes(d.trim()));
    }
    
    /**
     * 注入硬化代码到 HTML
     */
    function injectHardening(html) {
        // 在 </head> 前注入，如果没有 </head> 则在 <html> 后注入
        if (html.includes('</head>')) {
            return html.replace('</head>', HARDENING_CODE + '</head>');
        } else if (html.includes('<html')) {
            const htmlTagEnd = html.indexOf('>', html.indexOf('<html')) + 1;
            return html.slice(0, htmlTagEnd) + HARDENING_CODE + html.slice(htmlTagEnd);
        } else {
            // 兜底：在开头注入
            return HARDENING_CODE + html;
        }
    }
    
    /**
     * 生成拦截页面
     */
    function generateBlockPage(url, score, matches) {
        const matchList = matches.map(m => `<li>[${m.level}] ${m.desc}</li>`).join('');
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>WebKit-Shield 安全拦截</title>
    <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; background: #1a1a1a; color: #fff; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; padding: 30px; border-radius: 10px; }
        h1 { color: #ff4444; }
        .score { font-size: 48px; color: #ff4444; font-weight: bold; }
        .url { word-break: break-all; color: #888; margin: 20px 0; }
        ul { color: #ffaa44; }
        button { background: #444; color: #fff; border: none; padding: 10px 20px; margin: 10px 5px; cursor: pointer; border-radius: 5px; }
        button:hover { background: #555; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ 安全威胁已拦截</h1>
        <div class="score">风险评分: ${score}</div>
        <div class="url">${url}</div>
        <p>检测到以下可疑特征：</p>
        <ul>${matchList}</ul>
        <p>此页面可能包含恶意代码，已被 WebKit-Shield 拦截。</p>
        <button onclick="history.back()">返回</button>
        <button onclick="window.open('https://www.virustotal.com/gui/url/${btoa(url)}', '_blank')">VirusTotal 检测</button>
    </div>
</body>
</html>`;
    }

    // ==================== 主逻辑 ====================
    
    function main() {
        try {
            const hostname = $request.hostname || '';
            const url = $request.url || '';
            
            // 获取响应体
            let body = $response.body;
            if (!body) {
                if (CONFIG.DEBUG) console.log('[WS2] 无响应体');
                $done({});
                return;
            }
            
            // 判断是否为 HTML 内容
            const contentType = $response.headers?.['Content-Type'] || '';
            const isHTML = contentType.includes('text/html') || 
                          body.trim().startsWith('<!DOCTYPE') || 
                          body.trim().startsWith('<html');
            
            if (!isHTML) {
                if (CONFIG.DEBUG) console.log('[WS2] 非 HTML，跳过');
                $done({});
                return;
            }
            
            // ==================== 模式判断 ====================
            
            let shouldScan = false;
            let shouldHarden = false;
            
            if (CONFIG.MODE === 'full') {
                // 全量模式：扫描并硬化所有 HTML
                shouldScan = true;
                shouldHarden = true;
                if (CONFIG.DEBUG) console.log('[WS2] 全量模式：处理所有 HTML');
            } else {
                // 精准模式：仅处理可疑域名
                shouldScan = isSuspiciousDomain(hostname);
                shouldHarden = shouldScan;
                if (CONFIG.DEBUG) console.log(`[WS2] 精准模式：域名 ${hostname} 可疑=${shouldScan}`);
            }
            
            // ==================== 扫描逻辑 ====================
            
            if (shouldScan) {
                const { score, matches } = calculateRiskScore(body);
                
                if (CONFIG.DEBUG) {
                    console.log(`[WS2] 扫描结果: 评分=${score}, 匹配=${matches.length}`);
                }
                
                // 风险过高，直接拦截
                if (score >= CONFIG.THRESHOLD) {
                    console.log(`[WS2] 拦截高风险页面: ${url}, 评分=${score}`);
                    
                    // 记录拦截日志
                    if (typeof $prefs !== 'undefined') {
                        const log = $prefs.valueForKey('ws2_block_log') || '';
                        const newEntry = `${new Date().toISOString()}|${url}|${score}\n`;
                        $prefs.setValueForKey(log + newEntry, 'ws2_block_log');
                    }
                    
                    $done({
                        status: 403,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' },
                        body: generateBlockPage(url, score, matches)
                    });
                    return;
                }
            }
            
            // ==================== 硬化注入 ====================
            
            if (shouldHarden) {
                body = injectHardening(body);
                if (CONFIG.DEBUG) console.log('[WS2] API 硬化代码已注入');
            }
            
            $done({ body });
            
        } catch (e) {
            console.error('[WS2] 错误:', e);
            $done({}); // 出错时放行，避免破坏正常浏览
        }
    }

    // 执行
    main();
})();
