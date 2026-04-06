/**
 * @name 彩云天气 SVIP 解锁
 * @description 解锁彩云天气 Pro/SVIP 功能
 */

let obj = JSON.parse($response.body);

if (obj.result) {
    // 基础会员字段
    obj.result.is_vip = true;
    obj.result.vip_type = "svip";
    obj.result.vip_expired_at = 4092599349; // 2100年
    
    // 详细订阅信息
    obj.result.svip_expired_at = 4092599349;
    obj.result.is_svip = true;
    
    // 针对新版接口的补充
    if (obj.result.subscription) {
        obj.result.subscription.type = "svip";
        obj.result.subscription.is_active = true;
        obj.result.subscription.end_at = 4092599349;
    }
}

$done({ body: JSON.stringify(obj) });
