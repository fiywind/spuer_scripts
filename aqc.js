/**
 * @name 爱企查超级会员/专业会员解锁 (暴力覆盖版)
 */
let body = $response.body;
if (!body) $done({});
let obj = JSON.parse(body);

const unlock = (v) => {
    if (v && typeof v === 'object') {
        // 字符串形式
        v.isVip = "1";
        v.vipType = "2";
        v.vipEndTime = "2099-12-31";
        // 数字形式
        v.is_vip = 1;
        v.vip_type = 2;
        v.vip_end_time = 4070880000; // 2099年时间戳
        v.vip_status = 1;
        // 专家/权益字段
        v.isExpert = "1";
        v.consumeVip = "1";
        v.expert_status = 1;
    }
};

// 针对爱企查特定的多级数据结构进行递归处理
if (obj.data) {
    unlock(obj.data);
    if (obj.data.vip_info) unlock(obj.data.vip_info);
    if (obj.data.user_info) unlock(obj.data.user_info);
    if (Array.isArray(obj.data)) obj.data.forEach(item => unlock(item));
}

$done({ body: JSON.stringify(obj) });
