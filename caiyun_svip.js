/*
彩云天气 SVIP 本地解锁脚本
*/
let obj = JSON.parse($response.body);
if ($request.url.includes("/v1/config/membership/svip/rights")) {
    obj.data = {
      "is_svip": true,
      "svip_expired_at": 4070880000,
      "is_vip": true,
      "vip_expired_at": 4070880000
    };
}
if ($request.url.includes("/v3/config/membership/svip/rights")) {
    obj.result = {
      "is_svip": true,
      "expires_at": 4070880000
    };
}
$done({body: JSON.stringify(obj)});
