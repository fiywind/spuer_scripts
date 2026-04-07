/**
 * @name iCost 2026 深度劫持脚本
 */
let body = $response.body;
if (!body) $done({});

try {
    let obj = JSON.parse(body);

    const rewrite = (item) => {
        if (typeof item !== 'object' || item === null) return;
        
        for (let key in item) {
            let k = key.toLowerCase();
            // 1. 强制点亮所有权益开关
            if (k.includes('pro') || k.includes('vip') || k.includes('premium') || k.includes('member') || k.includes('purchased')) {
                if (typeof item[key] === 'boolean') item[key] = true;
                if (typeof item[key] === 'number') item[key] = 1;
                if (typeof item[key] === 'string' && item[key] === "0") item[key] = "1";
            }
            // 2. 强制延展所有过期时间
            if (k.includes('expire') || k.includes('end_time') || k.includes('deadline')) {
                item[key] = "2099-12-31T23:59:59Z";
            }
            // 3. 递归处理深层结构
            if (typeof item[key] === 'object') rewrite(item[key]);
        }
    };

    rewrite(obj);

    // 针对核心接口的保底构造
    if (!obj.data) obj.data = {};
    obj.data.is_pro = true;
    obj.data.is_vip = true;
    obj.data.status = 1;

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    $done({});
}
