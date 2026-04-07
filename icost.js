/**
 * @name iCost 永久会员终极解锁
 * @desc 针对所有 icostapp.com 接口的暴力注入
 */

let body = $response.body;
if (!body) $done({});

try {
    let obj = JSON.parse(body);

    // 递归函数：扫描并修改所有包含相关关键字的字段
    const deepUnlock = (data) => {
        if (typeof data !== 'object' || data === null) return;
        
        for (let key in data) {
            let k = key.toLowerCase();
            // 只要键名包含 pro, vip, purchase, level, member 就暴力改写
            if (k.includes('pro') || k.includes('vip') || k.includes('purchase') || k.includes('member')) {
                if (typeof data[key] === 'boolean') data[key] = true;
                if (typeof data[key] === 'number') data[key] = 1;
                if (typeof data[key] === 'string' && !data[key].includes('-')) data[key] = "1";
            }
            // 处理时间日期
            if (k.includes('expire') || k.includes('end_time')) {
                data[key] = "2099-12-31T23:59:59Z";
            }
            // 继续递归深层对象
            if (typeof data[key] === 'object') deepUnlock(data[key]);
        }
    };

    // 执行暴力修改
    deepUnlock(obj);

    // 针对特定接口的强制补全
    if (obj.data === null || !obj.data) {
        obj.data = { "is_pro": true, "vip": true, "status": 1 };
    }

    $done({ body: JSON.stringify(obj) });
} catch (e) {
    $done({});
}
