/**
 * @name iCost 解锁永久会员 (兼容压缩数据版)
 */

if ($response.body) {
    let obj;
    try {
        obj = JSON.parse($response.body);
    } catch (e) {
        // 如果解析失败，可能是数据格式不对或压缩了
        $done({});
    }

    // 暴力注入所有可能的 VIP 字段
    const unlock = (target) => {
        if (target && typeof target === 'object') {
            target.is_pro = true;
            target.is_vip = true;
            target.isPro = true;
            target.vip = true;
            target.premium = true;
            target.level = 1;
            target.purchased = true;
            target.expire_date = 4070880000000;
            target.expires_date = "2099-12-31T23:59:59Z";
        }
    };

    // 扫描所有层级
    unlock(obj);
    if (obj.data) unlock(obj.data);
    if (obj.config) unlock(obj.config);
    
    // 特别针对 service1 接口的特殊结构
    if (obj.data && Array.isArray(obj.data)) {
        obj.data.forEach(item => unlock(item));
    }

    $done({ body: JSON.stringify(obj) });
} else {
    $done({});
}
