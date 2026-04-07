/**
 * @name Widgy All-in-One Unlock (2026 Edition)
 * @description 解锁所有插槽及 Premium 功能
 */

let obj = JSON.parse($response.body);

// 定义所有需要解锁的商品 ID
const products = [
    "widgy_premium",
    "widgy_slot_2", "widgy_slot_3", "widgy_slot_4",
    "widgy_slot_5", "widgy_slot_6", "widgy_slot_7", "widgy_slot_8",
    "widgy_lock_1", "widgy_lock_2", "widgy_lock_3",
    "watchy_slot_1", "watchy_slot_2"
];

// 构建内购列表
const inApp = products.map(id => ({
    "quantity": "1",
    "product_id": id,
    "transaction_id": "1000000000000000",
    "original_transaction_id": "1000000000000000",
    "purchase_date": "2024-01-01 00:00:00 Etc/GMT",
    "purchase_date_ms": "1704067200000",
    "original_purchase_date": "2024-01-01 00:00:00 Etc/GMT",
    "expires_date": "2099-12-31 23:59:59 Etc/GMT"
}));

// 注入收据信息
obj.receipt = {
    "receipt_type": "Production",
    "bundle_id": "com.razdev.widgy",
    "in_app": inApp,
    "application_version": "1",
    "original_application_version": "1",
    "download_id": 1000000000000000
};
obj.latest_receipt_info = inApp;
obj.status = 0;

$done({ body: JSON.stringify(obj) });
