/**
 * @name Widgy 3.0 终极解锁
 */

let obj = JSON.parse($response.body);

const bundleId = "com.razdev.widgy";
const purchaseDate = "2024-01-01 00:00:00 Etc/GMT";
const ms = "1704067200000";

const products = [
    "widgy_premium", "widgy_slot_2", "widgy_slot_3", "widgy_slot_4",
    "widgy_slot_5", "widgy_slot_6", "widgy_slot_7", "widgy_slot_8",
    "widgy_lock_1", "widgy_lock_2", "widgy_lock_3",
    "watchy_slot_1", "watchy_slot_2"
];

const inApp = products.map(id => ({
    "quantity": "1",
    "product_id": id,
    "transaction_id": "490000000000000",
    "original_transaction_id": "490000000000000",
    "purchase_date": purchaseDate,
    "purchase_date_ms": ms,
    "original_purchase_date": purchaseDate,
    "original_purchase_date_ms": ms,
    "expires_date": "2099-12-31 23:59:59 Etc/GMT",
    "expires_date_ms": "4092599349000",
    "is_trial_period": "false",
    "in_app_ownership_type": "PURCHASED"
}));

obj = {
    "status": 0,
    "environment": "Production",
    "receipt": {
        "receipt_type": "Production",
        "bundle_id": bundleId,
        "application_version": "100",
        "in_app": inApp,
        "original_application_version": "1.0",
        "creation_date": purchaseDate,
        "receipt_creation_date": purchaseDate,
        "request_date": purchaseDate
    },
    "latest_receipt_info": inApp
};

$done({ body: JSON.stringify(obj) });
