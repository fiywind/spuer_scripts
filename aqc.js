/**
 * @name 爱企查超级会员/专业会员解锁终极版
 */

let body = $response.body;
if (!body) $done({});
let obj = JSON.parse(body);

// 核心解锁逻辑
const unlock = (item) => {
    if (item && typeof item === 'object') {
        item.isVip = "1";
        item.is_vip = 1;
        item.vipType = "2";
        item.vip_type = 2;
        item.vipEndTime = "2099-12-31";
        item.vip_end_time = "2099-12-31";
        item.isExpert = "1";
        item.is_expert = 1;
        item.consumeVip = "1";
    }
};

// 递归遍历所有名为 data 的层级
if (obj.data) {
    if (Array.isArray(obj.data)) {
        obj.data.forEach(i => unlock(i));
    } else {
        unlock(obj.data);
    }
}

$done({ body: JSON.stringify(obj) });
