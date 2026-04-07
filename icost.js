/**
 * iCost 2026 简单暴力版
 */
let body = $response.body;
if (!body) {
    // 如果响应体为空，尝试伪造一个
    $done({ body: JSON.stringify({ "data": { "is_pro": true, "vip": true }, "status": 1 }) });
} else {
    let obj = JSON.parse(body);
    obj.is_pro = true;
    obj.isPro = true;
    if (obj.data) {
        obj.data.is_pro = true;
        obj.data.is_vip = true;
    }
    $done({ body: JSON.stringify(obj) });
}
