/**
 * @name 爱企查超级会员/专业会员解锁
 */

let body = JSON.parse($response.body || '{}');

if ($request.url.includes("user/getuserinfo")) {
    // 个人中心信息补全
    body.data = body.data || {};
    body.data.is_vip = 1;
    body.data.vip_type = 2; // 2 通常代表超级会员
    body.data.vip_end_time = "2099-12-31";
    body.data.is_expert = 1; // 专业会员标识
} 

if ($request.url.includes("vip/getviptips")) {
    // 移除会员购买弹窗提示
    body.data = {
        "is_vip": 1,
        "vip_type": 2,
        "expire_time": "2099-12-31"
    };
}

$done({ body: JSON.stringify(body) });
