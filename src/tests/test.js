
Deferred.define();
Deferred.prototype._fire = function (okng, value) {
    var next = "ok";
    try {
        value = this.callback[okng].call(this, value);
    } catch (e) {
        next  = "ng";
        if (Deferred.debug) console.error(e);
        value = e;
    }
    if (value instanceof Deferred) {
        value._next = this._next;
    } else {
        if (this._next) this._next._fire(next, value);
    }
    return this;
}

var p = function() {
    console.log(Array.prototype.slice.call(arguments, 0));
}

var is = function(a, b, mes) {
    equals(a.toString(), b.toString(), mes);
}

Deferred.test = function(name, t, count, wait) {
    var d = new Deferred();
    var search = location.search;
    var func = function() {
        setTimeout(function() {
            var setupDeferred = new Deferred(), teardownDeferred = new Deferred();
            var setup = Deferred.test.setup, teardown = Deferred.test.teardown;
            setupDeferred.next(function() {
                next(function() {
                    var args = [name, function() {
                        stop(wait || 3000);
                        try {
                            t(teardownDeferred);
                        } catch(e) {
                            ok(false, 'test error: ' + e.toString());
                            teardownDeferred.call();
                        }
                    }];
                    if (count) args.push(count)
                    test.apply(test, args);
                });//, 0);
                return teardownDeferred;
            }).next(function() {
                teardown(d);
            });
            setup(setupDeferred);
        }, 0);
    }
    if (search.indexOf('?') == 0) {
        if (decodeURIComponent(search.substring(1)) != name) {
            setTimeout(function() {
                d.call();
            }, 0);
        } else {
            func();
        }
    } else {
        func();
    }
    return d;
};

// var i = 0;
Deferred.test.setup = function(d) {
//    console.log('setup' + (++i));
    d.call();
};

Deferred.test.teardown = function(d) {
    start(); // XXX
//    console.log('teardown' + i);
    d.call();
};

Deferred.prototype.method = function(name) {
    return d[name]();
};

Deferred.register('test', Deferred.test);

var Database = Deferred.WebDatabase;
var Model = Database.Model, SQL = Database.SQL;

Deferred.
test("uri", function(d) {
    var hatena = 'http://www.hatena.ne.jp/foobar?query=foo#hash=bar';
    var u = URI.parse(hatena);
    equals(u.search, '?query=foo');
    equals(u.hash, '#hash=bar');
    equals(u.schema, 'http');
    ok(!u.isHTTPS, 'is not HTTPS');
    equals(u.port, '');
    equals(u.host, 'www.hatena.ne.jp');
    equals(u.path, '/foobar');
    equals(u.href, hatena);
    equals(u.path_query, '/foobar?query=foo');
    equals(u.encodeURI, encodeURIComponent(hatena));
    equals(u.entryURL, B_HTTP + 'entry/www.hatena.ne.jp/foobar?query=foo%23hash=bar');

    hatena = 'https://www.hatena.ne.jp/';
    u = URI.parse(hatena);
    equals(u.search, '');
    equals(u.hash, '');
    equals(u.schema, 'https');
    ok(u.isHTTPS, 'isHTTPS');
    equals(u.port, '');
    equals(u.host, 'www.hatena.ne.jp');
    equals(u.path, '/');
    equals(u.href, hatena);
    equals(u.path_query, '/');
    equals(u.encodeURI, encodeURIComponent(hatena));
    equals(u.entryURL, B_HTTP + 'entry/s/www.hatena.ne.jp/');

    d.call();
}, 22, 1000).

test("timer", function(d){
    var t = Timer.create(10, 5); // 10ms, 5times
    var i = 0;
    t.bind('timer', function(ev, c) {
        equals(c, ++i);
    });
    t.bind('timerComplete', function(ev, c) {
        equals(c, 5);
        d.call();
    });
    t.start();
}, 6, 1000).

test("timer stop", function(d){
    var t = Timer.create(10, 5); // 10ms, 5times
    var i = 0;
    t.bind('timer', function(ev, c) {
        equals(c, ++i);
        if (c == 3) t.stop();
    });
    t.bind('timerComplete', function(ev, c) {
        ok(false, 'not call this');
    });
    setTimeout(function() { d.call() }, 500);
    t.start();
}, 3, 1000).

test('ExpireCache', function(d) {
    ExpireCache.clearAllCaches();
    var cache = new ExpireCache('testcache' + (new Date-0));
    ok(cache.get('foo') == null );
    cache.set('foo', 'bar');
    equals(cache.get('foo'), 'bar');
    cache.set('foo1', 'baz1');
    equals(cache.get('foo1'), 'baz1');
    cache.clear('foo1');
    ok(cache.get('foo1') == null, 'cache clear');
    cache.clearAll();
    ok(cache.get('foo') == null, 'cache clear all');

    var cache2 = new ExpireCache('testcache1' + (new Date-0), 60, 'JSON');
    var data = {foo: 'bar'};
    cache2.set('data', data);
    equals(cache2.get('data').foo, 'bar', 'serialize json');

    cache = new ExpireCache('testcache2' + (new Date-0), 0.01); // 10ms cache
    cache.set('foo1', 'bar');
    equals(cache.get('foo1'), 'bar');
    wait(0.2).next(function() {
        ok(cache.get('foo1') == null, 'cache expired');
        d.call();
    });
}, 8, 3000).

test('HTTPCache', function(d) {
    ExpireCache.clearAllCaches();
    var cache = new HTTPCache('test');
    var url = 'http://www.google.com/';
    cache.get(url).next(function(res) {
        ok(res, 'get cache1');
    }).next(function() {
        ok(cache.has(url), 'has cache');
        cache.get(url).next(function(res) {
            ok(res, 'get cache2');
            cache.clearAll();
            ok(!cache.has(url), 'cache clear all');
        });
    }).next(function() {
        d.call();
    });
}, 4, 3000).

test('HTTPCache(s)', function(d) {
    var url = 'http://b.hatena.ne.jp/secondlife/';
    ExpireCache.clearAllCaches();
    Deferred.parallel([
        HTTPCache.counter.get('https://www.hatena.ne.jp/').next(function(r) {
            ok(r == null, 'counter cache null');
        }),
        HTTPCache.counter.get(url).next(function(r) {
            ok(r, 'counter cache');
            ok(r >= 1, 'counter cache');
        }),
        HTTPCache.comment.get(url).next(function(r) {
            ok(r, 'comment cache');
            ok(r.count >= 1, 'comment cache count');
        }),
        HTTPCache.entry.get(url).next(function(r) {
            ok(r, 'entry cache');
        })
    ]).next(function() { return Deferred.parallel([
        HTTPCache.counter.get('https://example.comn/').next(function(r) {
            ok(r == null, '2: counter cache null');
        }),
        HTTPCache.counter.get(url).next(function(r) {
            ok(r, '2: counter cache');
            ok(r >= 1, '2: counter cache');
        }),
        HTTPCache.comment.get(url).next(function(r) {
            ok(r, '2: comment cache');
            ok(r.count >= 1, '2: comment cache count');
        }),
        HTTPCache.entry.get(url).next(function(r) {
            ok(r, '2: entry cache');
        })
    ]) }).next(function() { d.call(); });
}, 12, 10000).

test('Model Bookmark/Tag', function(d) {
    var db = new Database('testModelBookmarkTag');
    var Bookmark = Model.Bookmark, Tag = Model.Tag;
    Model.getDatabase = function() { return db };
    // Database.debugMessage = true;
    Model.initialize().next(function() {
        ok(true, 'initialize model');
        var bookmark = new Bookmark({
            url: 'http://www.hatena.ne.jp/',
            comment: '[hatena][はてな]これはすごい',
            title: 'はてなのサイト',
            date: 1255519120
        });
        bookmark.saveWithTransaction().next(function(b) {
            equals(b.id, 1);
            ok(b.search.indexOf('これはすごい') != -1, 'search comment');
            ok(b.search.indexOf('サイト') != -1, 'search title');
            Tag.find({}).next(function(tags) {
                equals(tags.length, 2);
                equals(tags[0].name, 'hatena');
                equals(tags[1].name, 'はてな');
            }).next(function() {
                db.transaction(function() {
                    for (var i = 0;  i < 99; i++) {
                        var b = new Bookmark({
                            url: 'http://www.hatena.ne.jp/' + i,
                            comment: '[hatena][はてな]これはすごい' + i,
                            title: 'はてなのサイト' + i,
                            date: 1255519120 + i
                        });
                        b.save().next();
                    }
                }).next(function() {
                    ok(true, '100 bookmark insert');
                    Tag.count().next(function(c) {
                        equals(c, 200);
                        d.call();
                    });
                });
            });
        });
    });
}, 9, 2000).

test('UserManeger', function(d) {
    UserManager.MY_NAME_URL = '/tests/data/hatenatest.my.name';
    UserManager.login();
}, 9, 2000).

test('finished', function(d) {
    ok(true, 'finished!!!');
    d.call();
}).

error(function(e) {
    console.log('error' + e.toString());
    throw(e);
});

