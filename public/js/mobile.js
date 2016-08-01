
<<<<<<< HEAD
//调整canvas的大小
$("#myCanvas").attr("width", $(window).width());
$("#myCanvas").attr("height", $(window).height() - 43);
var offset = $("#myCanvasDiv").offset();

//一堆全局变量
=======
//调整屏幕（横屏竖屏切换）
function setFrame(type){
    //调整canvas的大小
    $("#myCanvas").attr("width", $(window).width());
    $("#myCanvas").attr("height", $(window).height() - 43);
    offset = $("#myCanvasDiv").offset();
    //告诉PC端设置屏幕显示方式
    if (socket != null) {
        console.log('socket 不为null');
        var data = c.toDataURL("image/png");
        var img = new Image();
        img.src = data;
        img.onload = function() {
            socket.emit('viewChange', {
              'role': 'mobile',
              'screen': {'width': img.width, 'height': img.height},
              'type': type,
              'token': token
            });
        }

    }else {
      console.log('socket 为null');
    }
}


//一堆全局变量
var offset;
setFrame('vertical');
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
var canvasWidth;
var canvasHeight;
var c;
var cxt;
<<<<<<< HEAD
//画笔粗细 cxt的画笔粗细和颜色可能会在绘图过程中发生变化，所以这里有全局变量
=======
//PC和移动端缩放倍数
var scale = 1;
//画笔粗细
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
var lineWidth = 10;
//画笔颜色
var lineColor = 'black'
//存放历史的绘图数据，方便撤销和恢复/存放历史的绘图数据，方便撤销和恢复
var historyCanvas;
//当前画线点的坐标，pc移动同步就靠他了
var currentPoint;
//数据格式为[{type:'pen',points:[{0,0},{0,1}]},{{type:'rect',points:[{0,0},{0,1}]}],传输每次图像变化的点，points也就是currentPoint
var pointObj;
//绘制图形时第一次按下点的坐标
var initX;
var initY;
//上一次点的坐标，花线用
var lastPoint = {};
//当前画布数据在historyCanvas的下标
var current = 0;
//上次画线时间（计算画笔速度）
var lastTimestamp = 0;
//上次画笔的粗细（这个画笔粗细只在选择pen形状时局部使用）
var lastLineWidth = -1;
//记录用户是否画线了，如点击一下屏幕就不会画线，主要为了区分点击时不作为一次画线记录
var isDraw = false;
//初始化画笔(主要是那些全局变量)
function init(type) {
    canvasWidth = parseInt($("#myCanvas").attr('width'));
    canvasHeight = parseInt($("#myCanvas").attr('height'));
    c = document.getElementById("myCanvas");
    //获取一支画笔
    cxt = c.getContext("2d");
    //初始化画笔粗细
    cxt.lineWidth = lineWidth;
    //给线条2头戴帽子，使线条更平滑
    cxt.lineCap = "round";
    cxt.lineJoin = "round";
    //线条颜色(貌似用英文表示颜色的时候苹果下的浏览器才会画出来线条)
    cxt.strokeStyle = lineColor;
    //如果是第一次调用，初始化历史画板数据，设置默认绘图方式
    if (type === 'init') {
        historyCanvas = new Array();
        historyCanvas.push(cxt.getImageData(0, 0, canvasWidth, canvasHeight));
        //当前画布数据在historyCanvas的下标
        current = 0;
        //默认使用画笔
        eventRebind('pencil');
    }
}

//--------------------------------------------------------添加事件监听----------------------------------------------------------
//统一事件监听，提高代码可复用，减少重复代码 由各个形状按钮触发
function eventRebind(shape) {
    //隐藏点击形状出来那个弹出框
    $("#shape").popover('hide');
    //若上一次绑定的是pen形状，则需要同步绘图环境（主要是画笔粗细）
    drawPenChange();
    $("#myCanvas").unbind();
    //点击画板隐藏所有弹出框
    $("#myCanvas").bind('click', function(e) {
        console.log('click');
        $('#line_width').popover('hide');
        $('#shape').popover('hide');
        $('#color').popover('hide');
    });
    //移动端touch事件
    $("#myCanvas").bind('touchstart', function(e) {
        cxt.beginPath();
        var touch = e.originalEvent.changedTouches[0];
        initX = touch.clientX - offset.left;
        initY = touch.clientY - offset.top;
        lastPoint.x = initX;
        lastPoint.y = initY;
        currentPoint = new Object();
        pointObj = new Object();
        pointObj.type = shape;
        drawStart(initX, initY);
    });
    $("#myCanvas").bind('touchend', function(e) {
        if (isDraw) {
            historyCanvas[++current] = (cxt.getImageData(0, 0, canvasWidth, canvasHeight));
            drawEnd();
            //只要画了一点，就不能前进了，所以要把后边的图像清空
            while (current < historyCanvas.length - 1) {
                historyCanvas.pop();
            }
            cxt.lineWidth = lineWidth;
            isDraw = false;
        }
    });
    //根据参数绑定对应的事件
    if (shape === 'pencil') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
<<<<<<< HEAD
            cxt.beginPath();
=======
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            // x += 0.5;
            // y += 0.5;
            console.log('x:'+x+',y:'+y);
            cxt.moveTo(lastPoint.x,lastPoint.y);
            cxt.lineTo(x, y);
            lastPoint.x = x;
            lastPoint.y = y;
            cxt.closePath();
            cxt.stroke();
            currentPoint = {
                x: x,
                y: y
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'rect') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            cxt.beginPath();
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            cxt.putImageData(historyCanvas[current], 0, 0);
            cxt.strokeRect(initX, initY, x - initX, y - initY);
            currentPoint = {
                left: initX,
                top: initY,
                x: x - initX,
                y: y - initY
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'circle') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            cxt.beginPath();
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            cxt.putImageData(historyCanvas[current], 0, 0);
            temp1 = x - initX;
            temp2 = y - initY;
            var r = Math.sqrt((temp1) * (temp1) + (temp2) * (temp2)) / 2;
            cxt.arc((temp1) / 2 + initX, (temp2) / 2 + initY, r, 0, 2 * Math.PI);
            cxt.stroke();
            currentPoint = {
                x: (temp1) / 2 + initX,
                y: (temp2) / 2 + initY,
                r: r
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'triangle') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            cxt.beginPath();
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            cxt.putImageData(historyCanvas[current], 0, 0);
            temp = (x - initX) / 2 + initX;
            cxt.moveTo(initX, y);
            cxt.lineTo(x, y);
            cxt.moveTo(x, y);
            cxt.lineTo(temp, initY);
            cxt.moveTo(temp, initY);
            cxt.lineTo(initX, y);
            cxt.stroke();
            currentPoint = {
                x1: initX,
                y1: y,
                x2: x,
                y2: y,
                x3: temp,
                y3: initY
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'line') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            cxt.beginPath();
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            cxt.putImageData(historyCanvas[current], 0, 0);

            cxt.moveTo(initX, initY);
            cxt.lineTo(x, y);
            cxt.stroke();
            currentPoint = {
                x: x,
                y: y
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'pen') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            //console.log('x:'+x+',y:'+y);

            var curTimestamp = new Date().getTime();
            var s = calcDistance({
                x: x,
                y: y
            }, {
<<<<<<< HEAD
              x: lastPoint.x,
              y: lastPoint.y
=======
              x: initX,
              y: initY
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
            })
            var t = curTimestamp - lastTimestamp
            cxt.lineWidth = calcLineWidth(t, s);
            cxt.beginPath();
<<<<<<< HEAD
            cxt.moveTo(lastPoint.x, lastPoint.y);
=======
            cxt.moveTo(initX, initY);
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
            cxt.lineTo(x, y);
            cxt.closePath();
            cxt.stroke();
            currentPoint = {
                x: x,
                y: y,
                lineWidth: cxt.lineWidth
            };
            imageChange();
<<<<<<< HEAD
            lastPoint.x = x;
            lastPoint.y = y;
=======
            initX = x;
            initY = y;
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
            lastTimestamp = curTimestamp
            lastLineWidth = cxt.lineWidth;
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else if (shape === 'ellipse') {
        $("#myCanvas").bind('touchmove', function(e) {
            isDraw = true;
            var touch = e.originalEvent.changedTouches[0];
            var x = touch.clientX - offset.left;
            var y = touch.clientY - offset.top;
            cxt.putImageData(historyCanvas[current], 0, 0);
            var temp1 = x - initX;
            var temp2 = y - initY;
            var a = temp1 / 2;
            var b = temp2 / 2;
            x = temp1 / 2 + initX;
            y = temp2 / 2 + initY;
            //三次贝塞尔曲线法
            var k = .5522848,
                ox = a * k, // 水平控制点偏移量
                oy = b * k; // 垂直控制点偏移量
            cxt.beginPath();
            //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
            cxt.moveTo(x - a, y);
            cxt.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
            cxt.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
            cxt.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
            cxt.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
            cxt.closePath();
            cxt.stroke();
            currentPoint = {
                x: x,
                y: y,
                a: a,
                b: b,
                ox: ox,
                oy: oy
            };
            imageChange();
            //禁止手指滑动时屏幕跟着滚动
            e.returnValue = false;
            return false;
        });
    } else {
        //不修改代码是不会到这里滴...
        console.log('程序奔溃……-_-||  呜呜...');
    }
}
var maxLineWidth = lineWidth;
var minLineWidth = 1;
var maxStrokeV = 2;
var minStrokeV = 0.1;
//计算当前速度的画笔粗细
function calcLineWidth(t, s) {
    var v = s / t;
    var resultLineWidth;
    if (v <= minStrokeV)
        resultLineWidth = maxLineWidth;
    else if (v >= maxStrokeV)
        resultLineWidth = minLineWidth;
    else {
        resultLineWidth = maxLineWidth - (v - minStrokeV) / (maxStrokeV - minStrokeV) * (maxLineWidth - minLineWidth);
    }
    if (lastLineWidth == -1)
        return resultLineWidth;

    return resultLineWidth * 3 / 20 + lastLineWidth * 17 / 20;
}
//计算2点之间距离（pen类型画笔计算粗细用）
function calcDistance(loc1, loc2) {
    return Math.sqrt((loc1.x - loc2.x) * (loc1.x - loc2.x) + (loc1.y - loc2.y) * (loc1.y - loc2.y))
}

function revoke() {
    console.log('撤销');
    //判断有没有历史画布数据
    if (current <= 0) {
        alert('撤销完啦。');
        return;
    }
    current--;
    //加载历史画布数据
    cxt.putImageData(historyCanvas[current], 0, 0);
    imageChange('revoke', {});
}

function recovery() {
    if (current >= historyCanvas.length - 1) {
        alert("没有要恢复的数据啦");
        return;
    }
    cxt.putImageData(historyCanvas[++current], 0, 0);
    imageChange('recovery', {});
}

function empty() {
    cxt.putImageData(historyCanvas[0], 0, 0);
    historyCanvas = new Array();
    historyCanvas.push(cxt.getImageData(0, 0, canvasWidth, canvasHeight));
    current = 0;
    imageChange('empty', {});
}



//按钮事件
$('#empty').click(function() {
    empty();
});
//撤销
$("#revoke").click(function() {
    revoke();
});
//恢复
$("#recovery").click(function() {
    recovery();
});

//取网址的url的token参数
var token = getQueryString('token');
//socket连接
var socket = io().connect("http://" + window.location.host);
init('init');
socket.on('connect', function(sockets) {
    var screen = new Object();
    if (window.orientation == 180 || window.orientation == 0) {
        screen.viewType = 'vertical';
    }
    if (window.orientation == 90 || window.orientation == -90) {
        screen.viewType = 'cross';
    }
    var data = c.toDataURL("image/png");
    var img = new Image();
    img.src = data;
    img.onload = function() {
        screen.width = img.width;
        screen.height = img.height;
        socket.emit('new', {
            'role': 'Client',
            'token': token,
            'screen': screen
        });
    }
});
//电脑端选定区域发生改变
socket.on('positionChange', function(imgData) {
    var img = new Image();
    img.src = imgData.data;
    //cxt.beginPath();
    img.onload = function() {
        cxt.putImageData(historyCanvas[0], 0, 0);
        //console.log(imgData.left + '--' + imgData.top + '--' + imgData.width + '--' + imgData.height);
        cxt.drawImage(img, 0, 0);
        historyCanvas[++current] = (cxt.getImageData(0, 0, canvasWidth, canvasHeight));
    }

});
//切换横竖屏后要显示的数据
socket.on('viewChange', function(data) {
    if (data.type === 'vertical') {
        lineWidth = lineWidth * scale;
    }else if (data.type === 'cross') {
        var img = new Image();
        img.src = data.imgData;
        // img.width = 568;
        // img.height = 320;
        //cxt.beginPath();
        img.onload = function() {
          cxt.putImageData(historyCanvas[0], 0, 0);
          //console.log(imgData.left + '--' + imgData.top + '--' + imgData.width + '--' + imgData.height);
          cxt.drawImage(img, 0, 0,img.width ,img.height , 0, 0, img.width/data.scale,img.height/data.scale);
          //cxt.putImageData(historyCanvas[current], 0, 0, 0, 0,$("#myCanvas").attr("width"), $("#myCanvas").attr("height"));
        }
        scale = data.scale;
        lineWidth = lineWidth/data.scale;
    }


    //只还原绘图环境
    init('drawEnv');
    drawPenChange();
});

//图像发生改变，推送图像
function imageChange(type, data) {
    //console.log('imageChange');
    if (type == null) {
        pointObj.point = currentPoint;
        socket.emit('imageChange', {
            'imgData': pointObj,
            'token': token
        });
    } else {
        socket.emit('imageChange', {
            'imgData': {
                type: type,
                data: data
            },
            'token': token
        });
    }
}
//开始画图事件，即手指触摸屏幕以后
function drawStart(x, y) {
    console.log('drawStart');
    socket.emit('drawStart', {
        'point': {
            x: x,
            y: y
        },
        'token': token
    });
}
//结束画图事件，即手指离开屏幕以后
function drawEnd() {
    console.log('drawEnd');
    socket.emit('drawEnd', {
        'token': token
    });
}
//画布环境发生变化，如颜色，粗细等等
function drawPenChange() {
    console.log('drawPenChange');
    socket.emit('drawPenChange', {
        'token': token,
        cxt: {
            lineWidth: cxt.lineWidth,
            strokeStyle: cxt.strokeStyle
        }
    });
}
//获取网址上的参数（根据key返回value）
function getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}
//点击canvas事件，调出菜单栏
// $("#myCanvas").bind('click', function(e) {
//   alert('点击了');
// });

//颜色按钮
$('#color_content').hide();
$('#color').popover({
    content: function() {
        return $('#color_content').html();
    },
    html: true,
    placement: 'top',
    trigger: 'focus',
    container: '#containerDiv',
    viewport: {
        selector: 'body',
        padding: 0
    }
}).click(function() {
    $(this).popover('show');
    //颜色选择效果
    $(".color_btn").click(
        function(e) {
            $(".color_btn").removeClass("color_btn_selected");
            $(this).addClass("color_btn_selected");
            lineColor = cxt.strokeStyle = $(this).css("background-color");
            drawPenChange();
            $("#color").popover('hide');
        }
    )
});
//形状按钮
$('#shape_content').hide();
$('#shape').popover({
    content: function() {
        return $('#shape_content').html();
    },
    html: true,
    placement: 'top',
    trigger: 'focus',
    container: '#containerDiv',
    viewport: {
        selector: 'body',
        padding: 0
    }
}).click(function() {
    //$("#color")..popover('hide');
    $(this).popover('show');
    //选择有shape属性的元素来绑定事件
    $('[shape]').click(function() {
        //为已选择的绘图工具加active类
        $("[shape]").removeClass('active');
        var shape = $(this).attr('shape');
        $("[shape=" + shape + "]").addClass('active');
        //重新绑定手指移动事件
        eventRebind($(this).attr('shape'));
        //设置形状按钮为对应形状
        $('#shape>img').attr('src', $("[shape=" + shape + "]>img").attr('src'));
    });
});


$('#line_width_content').hide();
$('#line_width').popover({
    content: function() {
        return $('#line_width_content').html();
    },
    html: true,
    placement: 'top',
    trigger: 'focus',
    container: 'body',
    viewport: {
        selector: 'body',
        padding: 0
    }
}).click(function() {
    $(this).popover('show');
    console.log(lineWidth);
    //线宽按钮
    $('.nstSlider').nstSlider({
        "left_grip_selector": ".leftGrip",
        "value_changed_callback": function(cause, leftValue) {
            if (cause === 'drag_move') {
                lineWidth = leftValue;
                cxt.lineWidth = leftValue;
                drawPenChange();
                maxLineWidth = leftValue;
            }
        }
    });
    //线宽滑动条初始化
    $('.nstSlider').nstSlider('set_position', lineWidth);
<<<<<<< HEAD
=======
});
//横竖屏的切换
$(window).bind('orientationchange',function(e){
    if (window.orientation == 180 || window.orientation == 0) {
        alert("竖屏");
        setFrame('vertical');
    }
    if (window.orientation == 90 || window.orientation == -90) {
        alert("横屏");
        setFrame('cross');
    }
>>>>>>> 0983402285018e614a686df63aac33cdb107122b
});
