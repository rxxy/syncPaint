var express = require('express')
var app = express()
var url = require('url');
var ip = require('./IpAddress')();
//部署
server = require('http').createServer(app);
//创建server
var server = app.listen(80, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("同步手绘板运行在 http://%s:%s", ip, port);
})
io = require('socket.io').listen(server);
app.use(express.static('public'));
//路由
app.get('/pc',
    function(req, res) {
        res.sendfile(__dirname + '/pc.html');
    }
);
app.get('/client',
    function(req, res) {
        var token = url.parse(req.url, true).query.token;
        for (i in pcList) {
            if (token == pcList[i].token) { //找到与手机端匹配的PC端，并告诉他手机连上来了
                pcList[i].socket.emit('linked');
                res.sendfile(__dirname + '/mobile.html');
                return;
            }
        }
        //没有找到pc端
        console.log('client url error');
        res.send('url错误，您是怎么进来的呢');
    }
);
app.get('/:path',
    function(req, res) {
        res.sendfile(__dirname + '/' + req.params.path);
    }
);
//所有已连接的pc端socket对象
var pcList = new Array();
//所有已连接的移动端socket对象
var mobileList = new Array();
io.on('connection', function(socket) {
    var socketId = socket.id;
    //console.log('connection ' + socket+'  '+socketId);
    //新的客户端
    socket.on('new', function(data) {
        var role = data.role;
        console.log('new   role:' + role);
        if (role === 'PC') { //将token给它
            var token = uuid();
            pcList.push({
                'socket': socket,
                'token': token
            });
            socket.emit('makecode', token);
            console.log('token:' + token);
        } else if (role === 'Client') {
            mobileList.push({
                'socket': socket,
                'token': data.token
            });
            pushInfoToPc(data.screen, data.token);
        }
    });
    //移动端推送图像信息过来(点坐标)
    socket.on('imageChange', function(data) {
        var token = data.token;
        pushImgToPc(data.imgData, token);
    });
    //移动端开始画图，推送包含起始点坐标
    socket.on('drawStart', function(data) {
        var token = data.token;
        drawStart(data.point,data.shape, token);
    });
    //移动端结束画图
    socket.on('drawEnd', function(data) {
        var token = data.token;
        drawEnd(token,data.result);
    });
    //移动端画布环境发生改变
    socket.on('drawPenChange', function(data) {
        var token = data.token;
        drawPenChange(token, data.cxt);
    });
    //PC端选定区域发生改变，将电脑端区域拉到手机端
    socket.on('positionChange', function(data) {
        var token = data.token;
        for (i in mobileList) {
            if (token == mobileList[i].token) { //找到与手机端匹配的PC端
                //console.log("img:" + data.imgData);
                mobileList[i].socket.emit('positionChange', data.imgData);
            }
        }
    });
    //移动端横竖屏切换
    socket.on('screenResize', function(data) {
        var token = data.token;
        for (i in pcList) {
            if (token == pcList[i].token) { //找到与手机端匹配的PC端
                pcList[i].socket.emit('screenResize', data);
            }
        }
    });
    //推送pc的信息给移动端
    socket.on('pcInfo', function(data) {
        // console.log('pcInfo');
        var token = data.token;
        for (i in mobileList) {
            if (token == mobileList[i].token) {
                mobileList[i].socket.emit('pcInfo', data);
            }
        }
    });
    //客户端断开连接
    socket.on('disconnect', function(){
      	// console.log('receive disconnect event');
        for (i in mobileList) {
            if (this == mobileList[i].socket) {
                console.log('移动端断开链接');
                for (j in pcList) {
                    if (mobileList[i].token == pcList[j].token) {
                        pcList[j].socket.emit('mobileExit');
                    }
                }
            }
        }
        for (i in pcList) {
            if (this == pcList[i].socket) {
                console.log('PC端断开链接');
                for (j in mobileList) {
                    if (pcList[i].token == mobileList[j].token) {
                        mobileList[j].socket.emit('pcExit');
                    }
                }
            }
        }
    });
    //minmap位置变化
    socket.on('rectTouchMove', function(data) {
        //console.log('rectTouchMove');
        var token = data.token;
        for (i in pcList) {
            if (token == pcList[i].token) {
                pcList[i].socket.emit('rectTouchMove', data);
            }
        }
    });

    socket.on('rectTouchEnd', function(data) {
        // console.log('rectTouchEnd');
        var token = data.token;
        for (i in pcList) {
            if (token == pcList[i].token) {
                pcList[i].socket.emit('rectTouchEnd', data);
            }
        }
    });
});
//推送移动端端的信息给PC端
function pushInfoToPc(data, token) {
    for (i in pcList) {
        if (token == pcList[i].token) { //找到与手机端匹配的PC端
            pcList[i].socket.emit('mobileInfo', data);
        }
    }
}
//包含起始点坐标，告诉pc移动端已经开始画图
function drawStart(point,shape, token) {
    for (i in pcList) {
        if (token == pcList[i].token) { //找到与手机端匹配的PC端
            pcList[i].socket.emit('drawStart', point,shape);
        }
    }
}
//画完一个图形
function drawEnd(token,result) {
    for (i in pcList) {
        if (token == pcList[i].token) { //找到与手机端匹配的PC端
            pcList[i].socket.emit('drawEnd',result);
        }
    }
}
//画图环境发生改变
function drawPenChange(token, cxt) {
    for (i in pcList) {
        if (token == pcList[i].token) { //找到与手机端匹配的PC端
            pcList[i].socket.emit('drawPenChange', cxt);
        }
    }
}
//给pc端推送手机上的图像数据
function pushImgToPc(data, token) {
    for (i in pcList) {
        if (token == pcList[i].token) { //找到与手机端匹配的PC端
            pcList[i].socket.emit('imgPush', data);
        }
    }
    //console.log('pushImgToPc end');
}


//生成一个uuid
function uuid() {
    //return "nihaohsidsjaklfdsjkldkjs";//开发时方便测试
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    var uuid = s.join("");
    return uuid;
}
