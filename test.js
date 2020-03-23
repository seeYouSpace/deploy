const { ipcRenderer } = require('electron');

// 检测是否已登出
function checkIsLogout() {
    setTimeout(() => {
        if (!$('.user_login_code').length) {
            ipcRenderer.sendToHost('WEBVIEW:LOGOUT_EVENT', true);
        }
    }, 5000)
}
// 登录事件
ipcRenderer.on('HOST:LOGIN', (e, message) => {
    const contents = message.split('@');
    $('#usernameU').val(contents[0]);
    $('#password').val(contents[1]);

    $('#btn_login1').click();
})
// 跳转
ipcRenderer.on('HOST:GOTO', (e, message) => {
    window.location.href = message;
})
// 监听
let searchcenterObserver = new MutationObserver(() => {
    if ($('table.searchcenter_table tr').length) {
        if (!$('a[_type=publishDate]').hasClass('red') || $('a[_type=publishDate]').hasClass('up')) {
            $('a[_type=publishDate]').click();
        } else {
            const addedProduction = [];
            $('table.searchcenter_table tr').each((index, element) => {
                const dataString = $(element).find('.load_product_pic').attr('o-data');
                if (dataString) {
                    addedProduction.push(JSON.parse(dataString))
                }
            });
            // 向 host 发送一个字符串，作为是否为新商品的比较依据
            ipcRenderer.sendToHost('WEBVIEW:PRODUCTIONS_RESOURCEID_STRING', addedProduction.map(p => p.resourceId).join(','));
        }
    } else {
        ipcRenderer.sendToHost('WEBVIEW:PRODUCTIONS_RESOURCEID_STRING');
    }
});
ipcRenderer.on('HOST:BIND_OBSERVER', (e, message) => {
    checkIsLogout();
    if ($('.searchcenter_result_content')) {
        // 监听 searchcenter_result_content 的商品列表变化
        searchcenterObserver.disconnect();
        searchcenterObserver.observe($('.searchcenter_result_content')[0], {childList: true, subtree: true});
    }
})
ipcRenderer.on('HOST:UBIND_OBSERVER', (e, message) => {
    searchcenterObserver.disconnect();
})
ipcRenderer.on('HOST:SEEK_PRODUCTION', (e, message) => {
    if ($('table.searchcenter_table tr .add_cart:not(.disabled)').length) {
        new Promise((res, rej) => {
            let i = 0;
            let $timer = setInterval(() => {
                console.log('=====>', i)
                if ($('table.searchcenter_table tr .add_cart:not(.disabled)').get(i)) {
                    const $a = $($('table.searchcenter_table tr .add_cart:not(.disabled)').get(i));
                    if ($a.find('.sp_add_cart_status').text() === '加入购物车') {
                        $a.click();
                        // addedProduction.push(JSON.parse($($('table.searchcenter_table tr .load_product_pic').get(i)).attr('o-data')))
                        ipcRenderer.sendToHost('WEBVIEW:SEEKED_PRODUCTION', JSON.parse($($('table.searchcenter_table tr .load_product_pic').get(i)).attr('o-data')));
                    }
                }
                ++i;
                if (i == $('table.searchcenter_table tr .add_cart:not(.disabled)').length) {
                    clearInterval($timer);
                    res();
                }
            }, 500)
        }).then(() => {
            ipcRenderer.sendToHost('WEBVIEW:STOP_SEEK');
        })
    } else {
        ipcRenderer.sendToHost('WEBVIEW:STOP_SEEK')
    }
})
ipcRenderer.on('HOST:NEXT_PAGE', (e, message) => {
    if (!$('._page_ .next').length || $('._page_ .next').hasClass('disabled')) {
        // 没有下一页了
        ipcRenderer.sendToHost('WEBVIEW:NO_NEXT_PAGE', false);
    } else {
        $('._page_ .next')[0].click();
    }
})
ipcRenderer.on('HOST:RELOAD', (e, message) => {
    window.location.reload();
})
window.addEventListener("offline", function(e) {
    ipcRenderer.sendToHost('WEBVIEW:OFFLINE');
})
ipcRenderer.on('HOST:IS_ONLINE', (e, message) => {
    ipcRenderer.sendToHost('WEBVIEW:ONLINE', navigator.onLine);
})