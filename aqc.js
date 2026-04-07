/**
 * @name 爱企查超级会员/专业会员解锁 (终极暴力版)
 */
let body = $response.body;
if (!body) $done({});
let obj = JSON.parse(body);

// 定义强制修改函数
const forceUnlock = (v) => {
    if (v && typeof v === 'object') {
        // 核心标识
        v.isVip = "1";
        v.is_vip = 1;
        v.vipType = "2";
        v.vip_type = 2;
        v.vip_status = 1;
        // 时间字段
        v.vipEndTime = "2099-12-31";
        v.vip_end_time = "2099-12-31";
        v.vip_end_timestamp = 4070880000;
        // 专家与权益
        v.isExpert = "1";
        v.is_expert = 1;
        v.expert_status = 1;
        v.consumeVip = "1";
        // 移除所有限制弹窗标识
        if (v.hasOwnProperty('is_auth')) v.is_auth = 1;
        if (v.hasOwnProperty('vip_tip')) v.vip_tip = "";
    }
};

// 1. 处理标准的 data 结构
if (obj.data) {
    forceUnlock(obj.data);
    if (obj.data.user_info) forceUnlock(obj.data.user_info);
    if (obj.data.vip_info) forceUnlock(obj.data.vip_info);
    if (Array.isArray(obj.data)) obj.data.forEach(item => forceUnlock(item));
}

// 2. 处理某些特殊的根目录字段
forceUnlock(obj);

$done({ body: JSON.stringify(obj) });
