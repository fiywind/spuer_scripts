/**
 * @name Goodnotes 6 Unlock Subscription
 * @author Custom
 * @description 解锁 Goodnotes 6 订阅功能
 */

const url = $request.url;
if (!$response.body) $done({});
let obj = JSON.parse($response.body);

// 针对订阅状态接口的修改
if (url.includes("/v1/subscriptions") || url.includes("/v1/receipts")) {
    obj = {
        "is_eligible_for_introductory_offer": false,
        "subscription_status": "active",
        "requirements": [],
        "subscriptions": [
            {
                "expiry_date": "2099-12-31T23:59:59Z",
                "product_id": "com.goodnotes.gn6_one_year_subscription",
                "status": "active",
                "purchase_date": "2024-01-01T00:00:00Z"
            }
        ],
        "original_purchase_date": "2024-01-01T00:00:00Z"
    };
}

// 针对用户信息接口的补充修改
if (url.includes("/v1/user")) {
    if (obj.data) {
        obj.data.subscription_info = {
            "status": "active",
            "platform": "ios",
            "product_id": "com.goodnotes.gn6_one_year_subscription"
        };
    }
}

$done({ body: JSON.stringify(obj) });
