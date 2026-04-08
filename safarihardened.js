/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 * Safari 漏洞封堵 Loader (原生判定版)
 * 作用：仅在原生 Safari 中注入 lockDown 物理封堵逻辑
 * 更新：2026-04-08
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'] || "";
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || "";
const body = $response.body;

// 1. 第三方 App 黑名单过滤 (防止误伤小红书、微信等)
const isThirdParty = /MicroMessenger|WeChat|QQ\/|Weibo|XHS-App|NewsArticle|Toutiao|Alipay|MailMaster|Zhihu|Baidu|DingTalk/i.test(ua);

// 2. 原生 Safari 判定 (必须包含 Version/ 且不在黑名单内)
const isNativeSafari = ua.includes("Safari") && ua.includes("Version/") && !isThirdParty;

// 3. 资源预检：仅处理 HTML 页面，防止 $httpClient 处理 API 导致报错
const isHtmlPage = contentType.includes("text/html");

if (isNativeSafari && isHtmlPage && body) {
    const did = $environment.device_id;
    // 这里建议只保留一个最稳定的 Worker 地址，或采用递归回退
    const authUrl = `https://safari-shield-auth.justlcd.workers.dev/?id=${did}`;

    $httpClient.get(authUrl, (err, resp, data) => {
        // 4. 严格校验响应状态码
        if (!err && resp.status === 200 && data.includes("WebAssembly")) {
            // 注入到 <head> 标签最前方，确保最高执行优先级
            const newBody = body.replace(/<head[^>]*>/i, `$&<script>${data}</script>`);
            $done({ body: newBody });
        } else {
            // 5. 鉴权失败 (403) 或网络错误，直接原样放行
            console.log(`🛡️ Shield Skip: ID ${did} Unauthorized or Error.`);
            $done({});
        }
    });
} else {
    // 非 Safari 或非网页流量，瞬间放行
    $done({});
}
