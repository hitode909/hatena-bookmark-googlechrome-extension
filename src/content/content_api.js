var ContentAPI = {
    init: function CA_init() {
        var self = ContentAPI;
        self.port = chrome.extension.connect();
        self.port.onMessage.addListener(self.onMessage);
    },
    destroy: function CA_destroy() {
        var self = ContentAPI;
        self.port = null;
    },
    addBookmark: function(url) {
        var self = ContentAPI;
        self.port.postMessage({
            message: 'popup_add_bookmark',
            data: { url: url },
        });
    },
    showComment: function(url) {
        var self = ContentAPI;
        self.port.postMessage({
            message: 'popup_show_comment',
            data: { url: url },
        });
    }
};

if (window.top == window.self)
    ContentAPI.init();
