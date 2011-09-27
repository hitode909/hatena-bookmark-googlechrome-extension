var KeyManager = {
    init: function KH_init() {
        var self = KeyManager;
        self.port = chrome.extension.connect();
        self.port.onMessage.addListener(self.onMessage);
        self.start();
        self.getConfig();
    },
    destroy: function KH_destroy() {
        var self = KeyManager;
        // XXX Can we remove the listener 'onMessage'?
        self.port = null;
    },
    onMessage: function KH_onMessage(info) {
        var self = KeyManager;
        // TODO: config changed...
        switch (info.message) {
        case 'send_config':
            self.onGotConfig(info.data);
            break;
        }
    },
    onGotConfig: function(data) {
        var self = KeyManager;
        self.config = data;
    },
    getConfig: function() {
        var self = KeyManager;
        self.port.postMessage({
            message: 'get_config',
            data: {
                keys: [
                    'shortcuts.addBookmark.key',
                    'shortcuts.addBookmark.ctrl',
                    'shortcuts.addBookmark.shift',
                    'shortcuts.addBookmark.alt',
                    'shortcuts.addBookmark.meta',
                    'shortcuts.showComment.key',
                    'shortcuts.showComment.ctrl',
                    'shortcuts.showComment.shift',
                    'shortcuts.showComment.alt',
                    'shortcuts.showComment.meta',
                ],
            }
        });
    },

    started: false,

    commands: {},
    config: {},

    start: function () {
        if (this.started)
            return;

        window.addEventListener("keydown", this, true);
        this.started = true;
    },

    stop: function () {
        if (!this.started)
            return;

        window.removeEventListener("keydown", this, true);
        this.started = false;
    },

    add: function (prefix, func) {
        this.commands[prefix] = func;
    },

    correctKeyCode: function (keyCode) {
        if (keyCode >= 0x61 && keyCode <= 0x7a)
            return keyCode;

        if (keyCode >= 0x41 && keyCode <= 0x5a)
            return keyCode + 32;

        return -1;
    },

    checkEquality: function (prefix, ev) {
        var self = KeyManager;

        var keyCode = this.correctKeyCode(ev.keyCode);

        if (keyCode < 0)
            return false;

        var key = String.fromCharCode(keyCode);

        return (self.config[["shortcuts", prefix, "key"].join(".")]   == key)
            && (self.config[["shortcuts", prefix, "shift"].join(".")] == ev.shiftKey)
            && (self.config[["shortcuts", prefix, "ctrl"].join(".")]  == ev.ctrlKey)
            && (self.config[["shortcuts", prefix, "alt"].join(".")]   == ev.altKey)
            && (self.config[["shortcuts", prefix, "meta"].join(".")]  == ev.metaKey);
    },

    execCommand: function (prefix, ev) {
        this.commands[prefix](ev);
    },

    inputtingText: function (ev) {
        var elem = ev.target;
        var tag  = elem.localName.toLowerCase();

        if (tag === 'textarea' || tag === 'input')
            return true;

        return false;
    },

    smartChangeStatus: function () {
        if (self.config.addBookmark.key !== "disabled" ||
            self.config.showComment.key !== "disabled") {
            KeyManager.start();
        } else {
            KeyManager.stop();
        }
    },

    handleEvent: function (ev) {
        if (this.inputtingText(ev))
            return;

        for (var prefix in this.commands) {
            if (this.checkEquality(prefix, ev)) {
                this.execCommand(prefix, ev);

                ev.stopPropagation();
                ev.preventDefault();

                return;
            }
        }
    }
};

KeyManager.add("addBookmark", function () {
    ContentAPI.addBookmark(location.href);
});

KeyManager.add("showComment", function () {
    ContentAPI.showComment(location.href);
});

if (window.top == window.self && location.href.indexOf("http://reader.livedoor.com/reader/") == -1 && location.href.indexOf("http://fastladder.com/reader/") == -1)
    KeyManager.init();
