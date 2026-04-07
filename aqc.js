/**
 * @name 爱企查超级会员/专业会员解锁 (全字段加强版)
 */

let body = $response.body;
if (!body) $done({});
let obj = JSON.parse(body);

const unlock = (item) => {
    if (item && typeof item === 'object') {
        // 覆盖所有可能的 VIP 相关字段
        item.isVip = "1";
        item.is_vip = 1;
        item.vipType = "2";
        item.vip_type = 2;
        item.vipEndTime = "2099-12-31";
        item.vip_end_time = "2099-12-31";
        item.isExpert = "1";
        item.is_expert = 1;
        item.consumeVip = "1";
        item.vip_status = 1;
        item.expert_status = 1;
        item.expertEndTime = "2099-12-31";
    }
};

// 递归处理 data 对象
if (obj.data) {
    if (Array.isArray(obj.data)) {
        obj.data.forEach(i => unlock(i));
    } else {
        unlock(obj.data);
    }
}

$done({ body: JSON.stringify(obj) });
