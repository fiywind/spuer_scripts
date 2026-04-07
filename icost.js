let obj = JSON.parse($response.body);

// 常见的 iCost 私有校验字段修改
if (obj.data) {
    obj.data.isPro = true;
    obj.data.vip = true;
    obj.data.purchased = true;
    obj.data.expires_date = "2099-12-31T23:59:59Z";
}
// 部分接口可能直接在根目录
obj.isPro = true;
obj.vip = true;

$done({ body: JSON.stringify(obj) });
