/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 * Safari 漏洞封堵 Loader (原生判定版)
 * 作用：仅在原生 Safari 中注入 lockDown 物理封堵逻辑
 * 更新：2026-04-08
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'] || "";
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || "";
const did = $environment.device_id;

// 1. 构建第三方 App 黑名单 (防止误伤微信、小红书、微博、头条等)
const blackList = /MicroMessenger|WeChat|QQ\/|Weibo|XHS-App|NewsArticle|Toutiao|Alipay|MailMaster|Zhihu|Baidu|DingTalk/i;

// 2. 原生 Safari 判定逻辑
// 特征：包含 Safari 和 Version/，且不在黑名单内
const isNativeSafari = ua.includes("Safari") && ua.includes("Version/") && !blackList.test(ua);

// 3. 资源类型判定 (必须是 HTML 网页)
const isHtml = contentType.includes("text/html");

if (isNativeSafari && isHtml && $response.body) {
    // 备选域名池
    const urls = [
        `https://bhip.cc.cd/?id=${did}`, 
        `https://safari-shield-auth.justlcd.workers.dev/?id=${did}`
    ];
    
    fetchShield(0, urls);
} else {
    // 4. 关键：对于非网页资源或第三方 App，直接释放，绝不调用 $httpClient
    $done({});
}

/**
 * 递归获取云端封堵脚本
 */
function fetchShield(idx, urls) {
    if (idx >= urls.length) return $done({}); 

    $httpClient.get(urls[idx], (err, resp, data) => {
        // 校验返回内容是否包含 lockDown 核心逻辑标识符
        if (!err && resp.status === 200 && data.includes("WebAssembly")) {
            let body = $response.body;
            const payload = `<script id="lockdown-core">${data}</script>`;
            
            // 5. 暴力注入：匹配 <head> 标签（兼容带属性的 head），确保优先级最高
            if (/<head[^>]*>/i.test(body)) {
                body = body.replace(/<head[^>]*>/i, `$&${payload}`);
            } else {
                body = payload + body;
            }
            
            console.log("🛡️ lockDown Active: " + $request.url);
            $done({ body });
        } else {
            // 授权失败或域名失效，尝试下一个
            fetchShield(idx + 1, urls); 
        }
    });
}
