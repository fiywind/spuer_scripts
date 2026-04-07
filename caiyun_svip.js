/**
 * @name 彩云天气 Pro SVIP 终极覆盖版
 * @description 仿 Notability 解锁思路，强制注入全量订阅数据
 */

const body = {
  "status": "ok",
  "result": {
    "is_vip": true,
    "vip_type": "svip",
    "is_svip": true,
    "vip_expired_at": 4092599349,
    "svip_expired_at": 4092599349,
    "is_pro": true,
    "wt": {
      "vip": {
        "enabled": true,
        "expired_at": 4092599349,
        "type": "svip"
      }
    },
    "subscription": {
      "type": "svip",
      "is_active": true,
      "end_at": 4092599349
    }
  }
};

$done({ body: JSON.stringify(body) });
