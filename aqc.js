/**
 * @name 爱企查超级会员/专业会员解锁 (增强版)
 */

let body = $response.body;
if (!body) $done({});
let obj = JSON.parse(body);
const url = $request.url;

// 统一解锁函数
const fillVip = (data) => {
    if (data) {
        data.isVip = "1";
        data.is_vip = 1;
        data.vipType = "2";
        data.vip_type = 2;
        data.vipEndTime = "2099-12-31";
        data.vip_end_time = "2099-12-31";
        data.isExpert = "1";
        data.is_expert = 1;
        data.consumeVip = "1";
    }
};

// 匹配所有包含用户信息、VIP信息的接口
if (url.includes("ajax")) {
    fillVip(obj.data);
    // 针对某些接口 data 就是数组的情况
    if (Array.isArray(obj.data)) {
        obj.data.forEach(item => fillVip(item));
    }
}

$done({ body: JSON.stringify(obj) });
