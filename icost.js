/**
 * @name iCost 永久会员终极解锁
 */
let body = $response.body;
if (!body) $done({});

try {
    let obj = JSON.parse(body);
    
    // 强制构造 pro 属性
    const proData = {
        "is_pro": true,
        "isPro": true,
        "vip": true,
        "level": 1,
        "status": 1,
        "purchased": true,
        "expire_date": "2099-12-31T23:59:59Z",
        "expires_date": "2099-12-31T23:59:59Z",
        "original_purchase_date": "2023-01-01T00:00:00Z"
    };

    // 1. 如果有 data 字段，直接覆盖或补全
    if (obj.data) {
        if (typeof obj.data === 'object') {
            obj.data = { ...obj.data, ...proData };
        } else {
            obj.data = proData;
        }
    }

    // 2. 暴力扫描根目录所有包含 pro/vip 字眼的字段
    Object.keys(obj).forEach(key => {
        if (key.toLowerCase().includes('pro') || key.toLowerCase().includes('vip')) {
            obj[key] = true;
        }
    });

    // 3. 针对某些返回结果为空的接口，强行注入 data
    if (Object.keys(obj).length <= 2) {
        obj.data = proData;
        obj.is_pro = true;
    }

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    $done({});
}
