/**
 * Safari 漏洞封堵 & 病毒防范脚本 (Inspired by lockDown)
 * 功能：禁用高风险 Web API，减少攻击面。
 * 作者：fiywind
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'];

// 如果请求头里不包含 "Safari" 关键字，或者包含某些第三方 App 的特征，则直接退出
if (!ua || !ua.includes("Safari") || ua.includes("WeChat") || ua.includes("Baidu")) {
    $done({}); 
}

// 后面接着你之前的防护逻辑...

let body = $response.body;

// 确保只处理 HTML 页面
if (body && body.includes("<head>")) {
    const shield = `
    <script>
    (function() {
        // 1. 禁用 WebAssembly (Wasm 是 JIT 攻击的重灾区)
        if (window.WebAssembly) {
            delete window.WebAssembly;
            console.log("[Shield] WebAssembly Disabled");
        }

        // 2. 禁用 SharedArrayBuffer (常用于 Spectre 变种攻击和精确计时)
        if (window.SharedArrayBuffer) {
            delete window.SharedArrayBuffer;
        }

        // 3. 混淆/禁用电池状态 API (常用于设备指纹追踪和侧信道攻击)
        if (navigator.getBattery) {
            navigator.getBattery = () => Promise.reject();
        }

        // 4. 禁用高精度计时器 (防止利用时间差进行侧信道攻击)
        if (window.performance && window.performance.now) {
            const originalNow = window.performance.now.bind(window.performance);
            window.performance.now = () => Math.floor(originalNow() / 100) * 100;
        }

        // 5. 限制特定的设备传感器
        if (window.DeviceMotionEvent) delete window.DeviceMotionEvent;
        if (window.DeviceOrientationEvent) delete window.DeviceOrientationEvent;

        console.log("[Shield] Safari Hardening Active. Protective Layer Deployed.");
    })();
    </script>
    `;
    
    // 将防御脚本注入到 <head> 标签的最前端
    body = body.replace("<head>", "<head>" + shield);
}

$done({ body });
