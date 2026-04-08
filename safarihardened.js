// Safari 病毒防护 & 验证脚本
let body = $response.body;

if (body && body.includes("<head>")) {
    const shield = `
    <script>
    (function() {
        // 禁用 WebAssembly
        if (window.WebAssembly) {
            delete window.WebAssembly;
            // 【验证用】如果禁用成功，就在网页顶部弹个框
            alert("🛡️ lockDown 保护已激活：WebAssembly 已封堵");
        }
        
        // 禁用其他高危 API
        if (window.SharedArrayBuffer) delete window.SharedArrayBuffer;
        console.log("Safari Hardening Active.");
    })();
    </script>
    `;
    body = body.replace("<head>", "<head>" + shield);
}

$done({ body });
