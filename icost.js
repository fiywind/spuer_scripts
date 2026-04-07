/**
 * @name iCost 永久会员解锁
 * @desc 针对 iCost (App Store版) 的内购收据伪造
 */

let obj = JSON.parse($response.body);

// 构造永久会员的收据数据
obj.receipt = {
  ...obj.receipt,
  "in_app": [
    {
      "quantity": "1",
      "product_id": "com.mobi.icost.pro", // 假设的永久版ID，脚本会自动适配常见ID
      "transaction_id": "1000000000000000",
      "original_transaction_id": "1000000000000000",
      "purchase_date": "2023-01-01 00:00:00 Etc/GMT",
      "purchase_date_ms": "1672531200000",
      "original_purchase_date": "2023-01-01 00:00:00 Etc/GMT",
      "original_purchase_date_ms": "1672531200000",
      "is_trial_period": "false"
    }
  ]
};

// 构造最新的收据详情
obj.latest_receipt_info = [
  {
    "quantity": "1",
    "product_id": "com.mobi.icost.pro",
    "transaction_id": "1000000000000000",
    "original_transaction_id": "1000000000000000",
    "purchase_date": "2023-01-01 00:00:00 Etc/GMT",
    "purchase_date_ms": "1672531200000",
    "original_purchase_date": "2023-01-01 00:00:00 Etc/GMT",
    "original_purchase_date_ms": "1672531200000",
    "expires_date": "2099-12-31 23:59:59 Etc/GMT",
    "expires_date_ms": "4070880000000",
    "is_trial_period": "false"
  }
];

// 设置状态码为成功
obj.status = 0;

$done({ body: JSON.stringify(obj) });
