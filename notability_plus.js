/**
 * Notability_Plus订阅解锁脚本
 * 模式：核心JS 脚本模式
 * author:fiywind
 * date:2026-04-09
 */

if ($response.body) {
    let obj = JSON.parse($response.body);
    
    // 覆盖订阅数据
    obj = {
        "data": {
            "processAppleReceipt": {
                "error": 0,
                "subscription": {
                    "productId": "com.gingerlabs.Notability.premium_subscription",
                    "originalPurchaseDate": "2023-01-01T00:00:00Z",
                    "isFinal": true,
                    "isFreeUsage": false,
                    "isPremium": true,
                    "expirationDate": "2099-12-31T23:59:59Z"
                }
            }
        }
    };

    $done({ body: JSON.stringify(obj) });
} else {
    $done({});
}
