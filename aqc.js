/**
 * @name 爱企查超级会员/专业会员解锁完整版
 * @author Gemini
 * @description 覆盖个人中心、VIP详情及专业版校验接口
 */

let obj = JSON.parse($response.body || '{}');
const url = $request.url;

// 1. 处理核心用户信息接口 (usercenter/getvipinfoajax)
if (url.includes("/usercenter/getvipinfoajax")) {
    if (obj.data) {
        obj.data.isVip = "1";
        obj.data.vipType = "2"; // 2 为超级会员
        obj.data.consumeVip = "1";
        obj.data.vipEndTime = "2099-12-31";
        obj.data.isExpert = "1"; // 开启专业版权限
        obj.data.expertEndTime = "2099-12-31";
        obj.data.vip_end_time = "2099-12-31";
    }
}

// 2. 处理个人中心基础信息接口 (user/getuserinfo)
if (url.includes("/user/getuserinfo")) {
    if (obj.data) {
        obj.data.is_vip = 1;
        obj.data.vip_type = 2;
        obj.data.is_expert = 1;
        obj.data.vip_end_time = "2099-12-31";
    }
}

// 3. 处理会员状态提示接口 (vip/getviptips)
if (url.includes("/vip/getviptips")) {
    obj.data = {
        "is_vip": 1,
        "vip_type": 2,
        "expire_time": "2099-12-31",
        "is_expert": 1
    };
}

// 4. 处理通用 VIP 详情
if (url.includes("/vip/getVipDetail")) {
    if (obj.data) {
        obj.data.isVip = 1;
        obj.data.vipType = 2;
        obj.data.vipEndTime = "2099-12-31";
    }
}

$done({ body: JSON.stringify(obj) });
