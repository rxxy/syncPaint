window.onload=function(){
    setTimeout(function() {
        window.scrollTo(0, 1)
    }, 0);
};
//调整canvas的大小
$("#myCanvas").attr("width", $(window).width());
$("#myCanvas").attr("height", $(window).height() - 43);
var offset = $("#myCanvasDiv").offset();

//一堆全局变量
//记录此移动设备一些信息deviceInfo.screen.type 横竖屏
var deviceInfo = {
    scale: {
        x: 1,
        y: 1
    }, //PC和移动端缩放倍数
    pcInfo: {
      top: 0,
      left: 0,
      width:0,
      height:0
    },
    mobileInfo: {
        screen:{
            width: 0,
            height: 0,
            type: getScreenType()
        }
    }
};
var canvasWidth;
var canvasHeight;
var c;
var cxt;
//画笔粗细 cxt的画笔粗细和颜色可能会在绘图过程中发生变化，所以这里有全局变量
var lineWidth = 10;
//画笔颜色
var lineColor = 'black'
    //存放历史的绘图数据，方便撤销和恢复/存放历史的绘图数据，方便撤销和恢复
    //格式：[{currentPoint}]
var historyCanvas;
//画完一次所有currentpoint集合
var points;
//当前画线点的坐标，pc移动同步就靠他了
var currentPoint;
//数据格式为[{type:'pen',points:[{0,0},{0,1}]},{{type:'rect',points:[{0,0},{0,1}]}],传输每次图像变化的点，points也就是currentPoint
var pointObj;
//绘制图形时第一次按下点的坐标
var initX;
var initY;
//上一次画板的数据
var lastCanvasData;
//上一次点的坐标，花线用
var lastPoint = {};
//当前画布数据在historyCanvas的下标
var current = -1;
//上次画线时间（计算画笔速度）
var lastTimestamp = 0;
//上次画笔的粗细（这个画笔粗细只在选择pen形状时局部使用）
var lastLineWidth = -1;
//记录用户是否画线了，如点击一下屏幕就不会画线，主要为了区分点击时不作为一次画线记录
var isDraw = false;
//当前的画笔形状，如pen，rect等等
var currentPenShape;
//初始化画笔(主要是那些全局变量)
function init(type) {
    var long = $(window).width()>$(window).height()?$(window).width():$(window).height();
    var short = $(window).width()<$(window).height()?$(window).width():$(window).height();
    var a = long;
    var b = short;
    if (getScreenType() === 'cross') {
        var t = a;
        a = b;
        b = t;
    }
    // console.log("init----------------");
    $('#myCanvasDiv').css("width",b);
    $('#myCanvasDiv').css("height",a - 43);
    $("#myCanvas").attr("width", b);
    $("#myCanvas").attr("height", a - 43);
    canvasWidth = parseInt($("#myCanvas").attr('width'));
    canvasHeight = parseInt($("#myCanvas").attr('height'));
    //按钮组按钮平均宽度
    $('#control>[type=button]').css('width',$(window).width()/9);
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
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        //historyCanvas.push(cxt.getImageData(0, 0, canvasWidth, canvasHeight));
        //当前画布数据在historyCanvas的下标
        current = -1;
        //默认使用画笔
        eventRebind('pencil');
    }
}

//--------------------------------------------------------添加事件监听----------------------------------------------------------
//统一事件监听，提高代码可复用，减少重复代码 由各个形状按钮触发
function eventRebind(shape) {
    currentPenShape = shape;
    //隐藏点击形状出来那个弹出框
    $("#shape").popover('hide');
    //若上一次绑定的是pen形状，则需要同步绘图环境（主要是画笔粗细）
    drawPenChange();
    $("#myCanvas").unbind();
    //点击画板隐藏所有弹出框
    $("#myCanvas").bind('click', function(e) {
        $('#line_width').popover('hide');
        $('#shape').popover('hide');
        $('#color').popover('hide');
    });
    //移动端touch事件
    $("#myCanvas").bind('touchstart', function(e) {
        var touches = e.originalEvent.targetTouches;
        cxt.beginPath();
        var touch = touches[0];
        initX = touch.clientX - offset.left;
        initY = touch.clientY - offset.top;
        lastPoint.x = initX;
        lastPoint.y = initY;
        currentPoint = new Object();
        points = new Array();
        pointObj = new Object();
        pointObj.shape = shape;
        drawStart(initX, initY, shape);
    });
    $("#myCanvas").bind('touchend', function(e) {
        if (isDraw) {
            //如果开启了识别模式
            if (recognitionSwitch) {
                var result = recognition_repaint(cxt,points,lastCanvasData);
                var mobile_point;
                var pc_point;
                if (result != null) {
                  mobile_point = $.extend(true, {}, result.points[0]);
                  pc_point = $.extend(true, {}, result.points[0]);
                  //alert('转换前：' + JSON.stringify(result.points[0]));
                  if (getScreenType() === 'vertical') {
                      mobile_point = convertPoint(result.shape,deviceInfo.pcInfo,deviceInfo.scale,mobile_point);
                  }
                  pc_point = convertPointforPc(result.shape,deviceInfo,deviceInfo.pcInfo,pc_point);
                  //alert('转换后：' + JSON.stringify(result.points[0]) + '\nmobile_point:' + JSON.stringify(mobile_point) + '\npc_point:' + JSON.stringify(pc_point));
                  historyCanvas[++current] = {
                      shape: result.shape,
                      color: cxt.strokeStyle,
                      startPoint: {},
                      lineWidth: deviceInfo.mobileInfo.screen.viewType==='vertical'?lineWidth/deviceInfo.scale.x:lineWidth,
                      points: [mobile_point]
                  };

                  lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
                  isDraw = false;
                  drawEnd({shape:result.shape,point:pc_point,result:true});
                }else {
                    mui.toast('识别失败！');
                    drawEnd({result:false});
                    cxt.putImageData(lastCanvasData, 0, 0);
                }
                //有参数，代表是识别模式，pc端做出相应变化

                return;
            }
            var startPoint = {
                x: initX,
              　y: initY
            };
            if (getScreenType() === 'vertical') {
                startPoint = convertPoint('pencil',deviceInfo.pcInfo,deviceInfo.scale,startPoint);
                for(var i=0;i < points.length;i++){
                    points[i] = convertPoint(shape,deviceInfo.pcInfo,deviceInfo.scale,points[i]);
                }
            }
            historyCanvas[++current] = {
                shape: shape,
                color: cxt.strokeStyle,
                startPoint: startPoint,
                lineWidth: deviceInfo.mobileInfo.screen.viewType==='vertical'?lineWidth/deviceInfo.scale.x:lineWidth,
                points: points
            };
            drawEnd();
            lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
            cxt.lineWidth = lineWidth;
            isDraw = false;
        }
    });
    //根据参数绑定对应的事件
    if (shape === 'pencil') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_pencil(e);
        });
    } else if (shape === 'rect') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_rect(e);
        });
    } else if (shape === 'circle') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_circle(e);
        });
    } else if (shape === 'triangle') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_triangle(e);
        });
    } else if (shape === 'line') {
        $("#myCanvas").bind('touchmove', function(e) {
            touchmove_line(e);
        });
    } else if (shape === 'pen') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_pen(e);
        });
    } else if (shape === 'ellipse') {
        $("#myCanvas").bind('touchmove', function(e) {
            return touchmove_ellipse(e);
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
    // console.log('撤销');
    //判断有没有历史画布数据
    if (current < 0) {
        mui.toast('撤销完啦。');
        return;
    }
    current--;
    if(getScreenType() === 'cross'){
        cxt.clearRect(0, 0, canvasWidth, canvasHeight)
        for(var i=0;i<=current;i++){
            drawShape(cxt,historyCanvas[i]);
        }
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight)
    }
    //加载历史画布数据
    //cxt.putImageData(historyCanvas[current], 0, 0);
    imageChange('revoke', {});
}

function recovery() {
    if (current >= historyCanvas.length - 1) {
        mui.toast("没有要恢复的数据啦");
        return;
    }
    current++;
    if (getScreenType() === 'cross') {
        drawShape(cxt,historyCanvas[current]);
    }
    lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight)
    imageChange('recovery', {});
}

function empty() {
  var btn = ["清空","取消"];
  mui.confirm('清空画板后将不可撤销！','提示',btn,function(e){
    if(e.index==0){
        cxt.clearRect(0, 0, canvasWidth, canvasHeight);
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        //cxt.putImageData(historyCanvas[0], 0, 0);
        historyCanvas = new Array();
        //  historyCanvas.push(cxt.getImageData(0, 0, canvasWidth, canvasHeight));
        current = -1;
        imageChange('empty', {});

    }
  });

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
    screen.viewType = getScreenType();
    screen.width = $(window).width();
    screen.height = $(window).height();
    deviceInfo.mobileInfo.screen = screen;
    socket.emit('new', {
        'role': 'Client',
        'token': token,
        'screen': {
            screen:screen,
            canvasScreen:{
                width: c.width,
                height: c.height
            }
        }
    });

});
//电脑端选定区域发生改变
socket.on('positionChange', function(imgData) {
    // console.log('positionChange');
    var img = new Image();
    img.src = imgData.data;
    //cxt.beginPath();
    img.onload = function() {
        cxt.clearRect(0, 0, canvasWidth, canvasHeight);
        cxt.drawImage(img, 0, 0);
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
    }

});
//电脑端信息
socket.on('pcInfo', function(data) {
    deviceInfo.pcInfo.left = data.pcInfo.left;
    deviceInfo.pcInfo.top = data.pcInfo.top;
    if (data.pcInfo.width!=null) {
        deviceInfo.pcInfo.width = data.pcInfo.width;
    }
    if (data.pcInfo.height!=null) {
        deviceInfo.pcInfo.height = data.pcInfo.height;
    }
    //设置minmap的高度
    var rectScale = deviceInfo.pcInfo.width/deviceInfo.mobileInfo.screen.width;
    var height = deviceInfo.pcInfo.height/rectScale;
    $('#rect').css('width', canvasWidth/rectScale);
    $('#rect').css('height',canvasHeight/rectScale);
    //minmap的高度和位置
    $('#minmap_content').css('height',height+'px');
    $('#minmap_content').css('top',($(window).height()-43)/2-parseInt($('#minmap_content').css('height'))/2);

    if (data.scale != null) {
        deviceInfo.scale = data.scale;
    }
});
//显示端断开连接
socket.on('pcExit', function() {
    mui.toast('显示端断开链接');
    // console.log('pcExit');
});
//图像发生改变，推送图像
function imageChange(type, data) {
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
function drawStart(x, y, shape) {
    // console.log('drawStart');
    socket.emit('drawStart', {
        'point': {
            x: x,
            y: y
        },
        'shape': shape,
        'token': token
    });
}
//结束画图事件，即手指离开屏幕以后
function drawEnd(result) {
    // console.log('drawEnd');
    socket.emit('drawEnd', {
        'token': token,
        'result':result
    });
}
//画布环境发生变化，如颜色，粗细等等
function drawPenChange() {
    // console.log('drawPenChange');
    lastLineWidth = cxt.lineWidth;
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
    container: 'body',
    viewport: {
        selector: 'body',
        padding: 0
    }
}).click(function() {
    $("[bootstrap_component=popover]").attr('popover_status','unactive');
    $(this).attr('popover_status','active');
    $("[popover_status=unactive]").popover('hide');
    $(this).popover('show');
    //颜色选择效果
    $(".color_btn").click(function(e) {
        $(".color_btn").removeClass("color_btn_selected");
        $(this).addClass("color_btn_selected");
        lineColor = cxt.strokeStyle = $(this).css("background-color");
        drawPenChange();
        $("#color").popover('hide');
    });
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
    container: 'body',
    viewport: {
        selector: 'body',
        padding: 0
    }
}).click(function(e) {
    if (recognitionSwitch) {
        mui.toast('请关闭识别模式后再选择');
        e.preventDefault();
        e.returnValue = false;
        return false;
    }
    //先隐藏其他的弹出框
    $("[bootstrap_component=popover]").attr('popover_status','unactive');
    $(this).attr('popover_status','active');
    $("[popover_status=unactive]").popover('hide');
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
    $("[bootstrap_component=popover]").attr('popover_status','unactive');
    $(this).attr('popover_status','active');
    $("[popover_status=unactive]").popover('hide');
    $(this).popover('show');
    //线宽按钮
    var leftValue;
    $('.nstSlider').nstSlider({
        "left_grip_selector": ".leftGrip",
        "user_mouseup_callback":function(vmin, vmax, left_grip_moved){
            lineWidth = vmin;
            cxt.lineWidth = vmin;
            maxLineWidth = vmin;
            drawPenChange();
        }
    });
    //线宽滑动条初始化
    $('.nstSlider').nstSlider('set_position', lineWidth);
});
//识别模式开关
var lastPenShape;
$('#othoer').click(function(){
    if ($(this).attr('class').indexOf('recognition-active')!=-1) {
        $(this).removeClass('recognition-active');
        recognitionSwitch = false;
        mui.toast('识别模式已关闭，画笔已解锁');
        eventRebind(lastPenShape);
    }else {
        $(this).addClass('recognition-active');
        recognitionSwitch = true;
        mui.toast('识别模式开启，画笔已锁定');
        lastPenShape = currentPenShape;
        eventRebind('pencil');
    }

});
//minmap开关
$('#minmap').click(function(){
    minmapClickFunction();
});
var rectCanvas = document.createElement('canvas');
//canvas.id = "CursorLayer";
rectCanvas.width = canvasHeight;
rectCanvas.height = canvasWidth-43;
rectCanvas.style.display = 'none';
var minmapCxt = rectCanvas.getContext('2d');
minmapCxt.lineCap = "round";
minmapCxt.lineJoin = "round";
document.body.appendChild(rectCanvas);
function minmapClickFunction(){
    if ($('#minmap').attr('class').indexOf('recognition-active')!=-1) {
        $('#minmap').removeClass('recognition-active');
        $('#minmap_content').hide();
        $('#empty_div_cover').hide();
    }else {
        $('#minmap').addClass('recognition-active');
        $('#minmap_content').css('display','block');
        $('#empty_div_cover').show();
        minmapCxt.clearRect(0, 0, rectCanvas.width, rectCanvas.height)
        for(var i=0;i<=current;i++){
            drawShape(minmapCxt,historyCanvas[i]);
        }
        $('#minmapCanvasData').attr('src',rectCanvas.toDataURL("image/png"));
        $('#minmapCanvasData').css('width',canvasWidth);
        $('#minmapCanvasData').css('height',parseInt($('#minmap_content').css('height')));
    }
}

$(window).resizeEnd({
    delay: 50
}, function(){
    orientationchangeFunction();
});
//横竖屏切换要做的事情
function orientationchangeFunction(){
  //  mui.toast("orientationchange事件触发" + getScreenType());
    offset = $("#myCanvasDiv").offset();
    deviceInfo.mobileInfo.screen.viewType = getScreenType();
    //setTimeout('init',500);
    init();
    // console.log('orientationchange------------');
    socket.emit('screenResize', {
        'token': token,
        'screen': {
            'width': c.width,
            'height': c.height,
            'viewType': getScreenType()
        }
    });

    if (getScreenType() === 'cross') {
        // console.log('resize横屏');
        cxt.clearRect(0, 0, canvasWidth, canvasHeight)
        for(var i=0;i<=current;i++){
            drawShape(cxt,historyCanvas[i]);
        }
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        lineWidth = cxt.lineWidth = lineWidth / deviceInfo.scale.x;
        $('#minmap').unbind('click');
        $('#minmap_content').hide();
    }else if (getScreenType() === 'vertical') {
        lineWidth = cxt.lineWidth = lineWidth * deviceInfo.scale.x;
        $('#minmap').bind('click',minmapClickFunction);
    }
    drawPenChange();
}


$('#screen_switch').click(function(){
    //关掉minmap
    $('#minmap').removeClass('recognition-active');
    $('#minmap_content').hide();
    $('#empty_div_cover').hide();
    screenSwitch();
});
var screen_switch_flag = true;
//屏幕切换，横竖屏
function screenSwitch() {
  if (screen_switch_flag) {
      plus.screen.lockOrientation("landscape-primary");
      $('#screen_switch>span').removeClass('glyphicon glyphicon-resize-full');
      $('#screen_switch>span').addClass('glyphicon glyphicon-resize-small');
      screen_switch_flag = false;
  }else {
      screen_switch_flag = true;
      $('#screen_switch>span').removeClass('glyphicon glyphicon-resize-small');
      $('#screen_switch>span').addClass('glyphicon glyphicon-resize-full');
      plus.screen.lockOrientation("portrait-primary");
  }
  //mui.toast("横屏");
}
//判断当前屏幕是横屏还是竖屏
function getScreenType() {
    if (window.orientation == 180 || window.orientation == 0) {
        return 'vertical';
    } else if (window.orientation == 90 || window.orientation == -90) {
        return 'cross';
    } else if (window.screen.width > window.screen.height) { //以上判断一般手机都支持，这里对电脑端谷歌浏览器手机模式做适配
        return 'cross';
    } else if (window.screen.width < window.screen.height) {
        return 'vertical';
    }

}

/*退出*/
mui.back = function(event){
    var btn = ["确定","取消"];
    mui.confirm('要退出吗？请记得保存喔','提示',btn,function(e){
      if(e.index==0){
        plus.screen.lockOrientation("portrait-primary");
      	//执行mui封装好的窗口关闭逻辑；
        mui.openWindow({
          url: 'index.html',
          id: 'index',
          waiting: {
            autoShow: true
          }
        });
      }
    });
  return false;
}
var pre_x = 0;
var pre_y = 0;
var diffLeft;
var diffTop;
//minmap里的矩形区域的事件
$("#rect").bind('touchmove', function(e) {
        var touches = e.originalEvent.changedTouches;
        var touch = touches[0];
        var x = touch.clientX - offset.left;
        var y = touch.clientY - offset.top;
        var left_css = $('#rect').css('left');
        var top_css = $('#rect').css('top');
        p_left = parseInt(left_css.substring(0, left_css.length - 2));
        p_top = parseInt(top_css.substring(0, top_css.length - 2));

        var rectWidthCss = $('#rect').css('width');
        var rectHeightCss = $('#rect').css('height');
        var rectWidth = parseInt(rectWidthCss.substring(0, rectWidthCss.length - 2));
        var rectHeight = parseInt(rectHeightCss.substring(0, rectHeightCss.length - 2));
        var minmapWidth = $('#minmap_content').css('width').substring(0,$('#minmap_content').css('width').length-2);
        var minmapHeight = $('#minmap_content').css('height').substring(0,$('#minmap_content').css('height').length-2);
        if ((x - pre_x < 0 && p_left > 0 ) || (x - pre_x > 0 && p_left < minmapWidth - rectWidth)) { //可以水平移动
            if ( (x - diffLeft) >= 0 && (x - diffLeft) <= minmapWidth-rectWidth) {
                $('#rect').css('left', x - diffLeft);
            }
        }
        if ((y - pre_y < 0 && p_top > 0 ) || (y - pre_y > 0 && p_top < minmapHeight - rectHeight-3)) { //可以垂直移动
            if ( (y - diffTop) >= 0 && (y - diffTop) <= minmapHeight-rectHeight) {
              $('#rect').css('top', y - diffTop);
            }
        }
        var xScale = deviceInfo.pcInfo.width/parseInt($('#minmap_content').css('width'));
        var yScale = deviceInfo.pcInfo.height/parseInt($('#minmap_content').css('height'));
        rectPositionChange({top:(y-diffTop)*yScale,left:(x - diffLeft)*xScale});
        pre_x = x;
        pre_y = y;
        e.returnValue = false;
        return false;
});
$("#rect").bind('touchend', function(e) {
    socket.emit('rectTouchEnd', {
        'token': token
    });
});

$("#rect").bind('touchstart', function(e) {
    var touches = e.originalEvent.changedTouches;
    var touch = touches[0];
    pre_x = touch.clientX - offset.left;
    pre_y = touch.clientY - offset.top;

    var left_css = $('#rect').css('left');
    var top_css = $('#rect').css('top');
    p_left = parseInt(left_css.substring(0, left_css.length - 2));
    p_top = parseInt(top_css.substring(0, top_css.length - 2));
    diffLeft = pre_x - p_left;
    diffTop = pre_y - p_top;
});
//移动端控制矩形区域移动
function rectPositionChange(data){
  socket.emit('rectTouchMove', {
      'token': token,
      'data': data
  });
}
