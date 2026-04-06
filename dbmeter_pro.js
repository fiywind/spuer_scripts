/**
 * @name Decibel Meter Pro Force Unlock
 */

let obj = JSON.parse($response.body);
const proData = {
    "quantity": "1",
    "product_id": "com.haoli.dbmeter.pro_annual",
    "transaction_id": "1000000000000000",
    "original_transaction_id": "1000000000000000",
    "purchase_date": "2024-01-01 00:00:00 Etc/GMT",
    "purchase_date_ms": "1704067200000",
    "expires_date": "2099-12-31 23:59:59 Etc/GMT",
    "expires_date_ms": "4092599349000"
};

obj.receipt = obj.receipt || {};
obj.receipt.in_app = [proData];
obj.latest_receipt_info = [proData];
obj.status = 0;

$done({ body: JSON.stringify(obj) });
