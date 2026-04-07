/**
 * @name Widgy 强制注入版
 */
let obj = JSON.parse($response.body || "{}");
let url = $request.url;

const item = (id) => ({
  "product_id": id,
  "quantity": "1",
  "transaction_id": "1000000000000000",
  "original_transaction_id": "1000000000000000",
  "purchase_date": "2024-01-01 00:00:00 Etc/GMT",
  "original_purchase_date": "2024-01-01 00:00:00 Etc/GMT",
  "expires_date": "2099-12-31 23:59:59 Etc/GMT",
  "in_app_ownership_type": "PURCHASED"
});

const list = [
  "widgy_premium", "widgy_slot_2", "widgy_slot_3", "widgy_slot_4",
  "widgy_slot_5", "widgy_slot_6", "widgy_slot_7", "widgy_slot_8",
  "widgy_lock_1", "watchy_slot_1"
];

const data = list.map(id => item(id));

if (url.includes("verifyReceipt")) {
  obj.status = 0;
  obj.receipt = { "in_app": data, "bundle_id": "com.razdev.widgy" };
  obj.latest_receipt_info = data;
}

$done({ body: JSON.stringify(obj) });
