/*
彩云天气 SVIP 本地解锁脚本
*/
let obj = JSON.parse($response.body);

if ($request.url.includes("/v1/config/membership/svip/rights")) {
    obj.data = obj.data || {};
    obj.data.is_svip = true;
    obj.data.svip_expired_at = 4070880000;
    obj.data.is_vip = true;
    obj.data.vip_expired_at = 4070880000;
}

if ($request.url.includes("/v3/config/membership/svip/rights")) {
    obj.result = obj.result || {};
    obj.result.is_svip = true;
    obj.result.expires_at = 4070880000;
}

$done({body: JSON.stringify(obj)});
