/**
 * @name 彩云天气 Pro 版 SVIP 终极解锁
 * @description 适配 Pro 版 App，覆盖用户信息与 Apple 收据校验
 */

const url = $request.url;
let obj = JSON.parse($response.body);

// 1. 处理彩云自有服务器接口 (用户信息与权限)
if (url.includes("/v1/user") || url.includes("/v1/behavior/privilege")) {
    if (obj.result) {
        obj.result.is_vip = true;
        obj.result.vip_type = "svip";
        obj.result.is_svip = true;
        obj.result.svip_expired_at = 4092599349;
        obj.result.vip_expired_at = 4092599349;
        // 开启 Pro 专属功能
        obj.result.is_pro = true;
    }
    if (obj.content && obj.content.privileges) {
        obj.content.privileges.forEach(p => {
            p.status = "ok";
            p.is_enabled = true;
        });
    }
}

// 2. 处理苹果收据校验接口 (StoreKit 验证)
if (url.includes("buy.itunes.apple.com/verifyReceipt")) {
    const proData = {
        "quantity": "1",
        "product_id": "com.cy.caiyunapp.svip_year", // 彩云 SVIP 年费 ID
        "transaction_id": "1000000000000000",
        "original_transaction_id": "1000000000000000",
        "purchase_date": "2024-01-01 00:00:00 Etc/GMT",
        "expires_date": "2099-12-31 23:59:59 Etc/GMT",
        "is_trial_period": "false"
    };
    obj.receipt = obj.receipt || {};
    obj.receipt.in_app = [proData];
    obj.latest_receipt_info = [proData];
    obj.status = 0;
}

$done({ body: JSON.stringify(obj) });
