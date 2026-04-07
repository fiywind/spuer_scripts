/* 彩云天气 SVIP 增强版 */
let body = $response.body;
if (!body) $done({});

try {
    let obj = JSON.parse(body);
    // 覆盖所有可能的会员权益接口
    const vipInfo = {
        "is_svip": true,
        "svip_expired_at": 4070880000,
        "is_vip": true,
        "vip_type": "s", 
        "vip_expired_at": 4070880000,
        "status": "active"
    };

    if (obj.data) {
        obj.data = { ...obj.data, ...vipInfo };
    } else if (obj.result) {
        obj.result = { ...obj.result, ...vipInfo };
    } else {
        // 如果结构完全不同，直接合并到根目录
        Object.assign(obj, vipInfo);
    }

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    $done({});
}
