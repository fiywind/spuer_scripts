/**
 * @name Widgy All-in-One Unlock
 * @description 解锁 Widgy 所有主屏幕、锁屏、Watchy 插槽及内购功能
 */

let obj = JSON.parse($response.body);

const allSlots = [
  {"product_id": "widgy_slot_2", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_3", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_4", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_5", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_6", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_7", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_slot_8", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "widgy_lock_1", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"},
  {"product_id": "watchy_slot_1", "quantity": "1", "purchase_date": "2024-01-01 00:00:00 Etc/GMT"}
];

obj.receipt = obj.receipt || {};
obj.receipt.in_app = allSlots;
obj.latest_receipt_info = allSlots;
obj.status = 0;

$done({ body: JSON.stringify(obj) });
