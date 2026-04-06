/**
 * @name Decibel Meter Pro Unlock (Optimized)
 * @author Custom
 * @description 整合 UA 判断，精准解锁分贝仪专业版 Pro 订阅
 */

const url = $request.url;
const ua = $request.headers['User-Agent'] || $request.headers['user-agent'];

// 定义分贝仪的 UA 特征（根据该 App 开发商习惯，通常包含 DBMeter 或 SoundDetector）
if (ua && (ua.includes("DBMeter") || ua.includes("SoundDetector") || ua.includes("DecibelMeter"))) {
    
    let obj = JSON.parse($response.body);

    // 构造永久 Pro 订阅数据
    const proData = {
        "quantity": "1",
        "product_id": "com.haoli.dbmeter.pro_annual", 
        "transaction_id": "1000000000000000",
        "original_transaction_id": "1000000000000000",
        "purchase_date": "2024-01-01 00:00:00 Etc/GMT",
        "purchase_date_ms": "1704067200000",
        "expires_date": "2099-12-31 23:59:59 Etc/GMT",
        "expires_date_ms": "4092599349000",
        "is_in_intro_offer_period": "false",
        "is_trial_period": "false"
    };

    // 注入收据信息
    if (obj.receipt) {
        obj.receipt.in_app = [proData];
    }
    
    obj.latest_receipt_info = [proData];
    obj.pending_renewal_info = [{
        "product_id": "com.haoli.dbmeter.pro_annual",
        "auto_renew_status": "1"
    }];
    obj.status = 0; // 核心：状态码 0 代表苹果验证服务器返回“成功”

    console.log("检测到分贝仪请求，已成功注入 Pro 凭证");
    $done({ body: JSON.stringify(obj) });

} else {
    // 如果不是该 App 发起的请求，则原样返回，不做任何改动
    $done({});
}
