/**
 * iCost 强力解锁脚本
 * 覆盖 service1 / priceconfig / serverless 等接口
 */

if ($response.body) {
    let obj = JSON.parse($response.body);

    // 1. 处理 service1 类型的接口数据
    if (obj.data) {
        obj.data.is_pro = true;
        obj.data.is_vip = true;
        obj.data.purchased = true;
        obj.data.level = 1; 
        obj.data.expire_date = 4070880000000; // 2099年
    }

    // 2. 处理 priceconfig 类型的扁平数据
    obj.is_pro = true;
    obj.is_vip = true;
    obj.premium = true;
    obj.vip_status = 1;

    // 3. 针对 serverless 接口的配置下发
    if (obj.config) {
        obj.config.is_free_trial = false;
        obj.config.has_purchased = true;
    }

    $done({ body: JSON.stringify(obj) });
} else {
    $done({});
}
