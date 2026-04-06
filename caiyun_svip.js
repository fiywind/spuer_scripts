/**
 * @name 彩云天气 SVIP 强力解锁版
 * @author Custom
 * @description 适配 2026 最新版，解锁全功能 SVIP
 */

let obj = JSON.parse($response.body);

// 1. 修改核心用户信息
if (obj.result) {
    obj.result.is_vip = true;
    obj.result.vip_type = "svip";
    obj.result.is_svip = true;
    obj.result.svip_expired_at = 4092599349; // 2100年
    obj.result.vip_expired_at = 4092599349;
    
    // 2. 注入订阅详情 (针对新版 gRPC 转 JSON 逻辑)
    obj.result.wt = {
        "vip": {
            "enabled": true,
            "expired_at": 4092599349,
            "type": "svip"
        }
    };
    
    // 3. 移除所有广告和限制标识
    if (obj.result.ad_config) {
        obj.result.ad_config.enabled = false;
    }
}

// 4. 针对权限检查接口 (behavior/privilege)
if (obj.content && obj.content.privileges) {
    obj.content.privileges.forEach(p => {
        p.status = "ok";
        p.is_enabled = true;
    });
}

$done({ body: JSON.stringify(obj) });
