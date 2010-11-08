var execute = function(func){
    location.href = "javascript:void (" + encodeURIComponent(func) + ")()";
}

execute(function() {
    var key_add = 'c';          // TODO: なんとかする
    var key_comment = 'C';      // TODO: なんとかする
    var id = setTimeout(function(){
        if(id) clearTimeout(id);
        if(typeof Keybind !== 'undefined'){
            Keybind.add(key_add, function() {
                try{
                    var feed = get_active_feed();
                    var item = get_active_item(true);
                    var target = item.element;
                    var data = item.link;
                    var ev = document.createEvent('MessageEvent');
                    ev.initMessageEvent('HatenaBookmark.AddBookmark', true, false, data, location.protocol+"//"+location.host, "", window);
                    document.dispatchEvent(ev);
                }catch(e){};
            });

            Keybind.add(key_comment, function() {
                try{
                    var feed = get_active_feed();
                    var item = get_active_item(true);
                    var target = item.element;
                    var data = item.link;
                    var ev = document.createEvent('MessageEvent');
                    ev.initMessageEvent('HatenaBookmark.ShowComment', true, false, data, location.protocol+"//"+location.host, "", window);
                    document.dispatchEvent(ev);
                }catch(e){};
            });
        } else {
            id = setTimeout(arguments.callee, 100);
        }
    });
});

document.addEventListener("HatenaBookmark.AddBookmark", function (event) {
    ContentAPI.addBookmark(event.data);
}, false);

document.addEventListener("HatenaBookmark.ShowComment", function (event) {
    ContentAPI.showComment(event.data);
}, false);
