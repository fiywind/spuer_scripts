/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'];
let body = $response.body;

// 1. 精准识别：仅在 Safari 浏览器或系统网页视图中运行，避免干扰其他 App 内部逻辑
if (ua && (ua.includes("Safari") || ua.includes("iPhone")) && body && body.includes("<head>")) {
    
    const shield = `
    <script>
    (function() {
        // 封堵 WebAssembly (核心防御点：阻断 JIT 提权路径)
        if (window.WebAssembly) {
            delete window.WebAssembly;
        }

        // 封堵 SharedArrayBuffer (防止侧信道攻击和高精度计时攻击)
        if (window.SharedArrayBuffer) {
            delete window.SharedArrayBuffer;
        }

        // 降低时间精度 (削弱利用时间差进行的内存攻击)
        if (window.performance && window.performance.now) {
            const originalNow = window.performance.now.bind(window.performance);
            window.performance.now = () => Math.floor(originalNow() / 100) * 100;
        }

        // 屏蔽敏感传感器 API
        if (window.DeviceMotionEvent) delete window.DeviceMotionEvent;
        if (window.DeviceOrientationEvent) delete window.DeviceOrientationEvent;

        console.log("[Shield] Safari Hardened: WebAssembly & SharedArrayBuffer Locked.");
    })();
    </script>
    `;
    
    // 注入防御代码到页面头部
    body = body.replace("<head>", "<head>" + shield);
    $done({ body });
} else {
    // 非网页请求或非 Safari 请求，直接跳过
    $done({});
}
