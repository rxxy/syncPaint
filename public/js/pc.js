$('body').css('backgroud-color', '#eee');
//选择区域上一次移动的位置坐标
var pre_x;
var pre_y;
//初始点坐标
var initX;
var initY;
//canvas的大小
$('#myCanvasDiv').css('height',$(window).height());
var canvasWidth = $('#myCanvasDiv').css('width');
var canvasHeight = $('#myCanvasDiv').css('height');
canvasWidth = canvasWidth.substring(0, canvasWidth.length - 2);
canvasHeight = canvasHeight.substring(0, canvasHeight.length - 2);
//设置当前画布的大小，和电脑一样大-_-||
$('#myCanvas').attr('width', $(window).width());
$('#myCanvas').attr('height', $(window).height());
/*
移动端的各种信息
screen.viewType(横屏(cross)或竖屏(vertical))
screen.width，screen.height(屏幕宽高)
*/
var deviceInfo = {
    scale: {
        x: 1,
        y: 1
    }, //PC和移动端缩放倍数
    mobileInfo: {
        screen:{
            width: 0,
            height: 0,
            type: 'vertical'
        }
    }
};
//选择区域矩形的长宽
var rectWidth;
var rectHeight;
//现在要画图的坐标
var p_left = 0;
var p_top = 0;
var c = document.getElementById("myCanvas");
//获取一支画笔
var cxt = c.getContext("2d");
//给线条2头戴帽子，使线条更平滑
cxt.lineCap = "round";
cxt.lineJoin = "round"
var lineWidth;
var emtpyData = cxt.getImageData(0, 0, c.width, c.height);
//存放历史的绘图数据，方便撤销和恢复/存放历史的绘图数据，方便撤销和恢复
var historyCanvas;
//当前画布数据在historyCanvas的下标
var current = -1;
historyCanvas = new Array();
// historyCanvas.push({
//     data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
//     x: 0,
//     y: 0
// });
//存放最近一次的历史画布数据
var lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
//当前画笔形状
var currentShape;
//存放上一次画的点的坐标
var lastPoint = new Object();
//存放画一次线的所有坐标
var points = new Array();
var token;
var socket = io().connect("http://" + window.location.host);
socket.on('makecode', function(data) { //监听得到token
    console.log('makecode');
    token = data;
    $('#qrcode').qrcode({
        text: "http://" + window.location.host + "/client?token=" + token
    });
});
socket.on('linked', function() { //手机端已连接，
    //alert('手机端已连接，应该切换到画板');
    //给到用户提示，撤销二维码
    console.log('接收到linked事件');
    $("#myModal").modal("hide");
    //弹窗提醒
    Messenger.options = {
        extraClasses: "messenger-fixed messenger-on-bottom",
        theme: "ice"
    };
    var msg = Messenger().post({
        message: '连接成功',
        type: 'string',
        hideAfter: 2
    });

});

socket.on('connect', function(sockets) { //在服务端注册
    socket.emit('new', {
        role: 'PC'
    });
    //console.log('connect');
});
var rectCanvas;
var rectEmtpy; //这个画布的空内容数据，用于清空画布用
socket.on('mobileInfo', function(screen) { //服务端推送过来移动端的屏幕大小数据
    screen = screen.screen;
    console.log('mobileInfo');
    console.log(screen);
  //  screen.height += 86;
    var long = screen.width>screen.height?screen.width:screen.height;
    var short = screen.width<screen.height?screen.width:screen.height;
    if (screen.viewType === 'vertical') {
        long -= 43;
    }else {
        short -= 43;
    }
    deviceInfo.scale = {
        x: canvasWidth / long,
        y: canvasHeight / short
    };
    console.log('long:' + long + "short:" + short);
    console.log('mobileinfo计算出来的scale.x:' + deviceInfo.scale.x);
    socket.emit('pcInfo', {
        token: token,
        pcInfo:{
            top: p_top,
            left: p_left
        },
        scale:deviceInfo.scale
    });
    $('#selectRect').css("width", screen.width);
    $('#selectRect').css("height", screen.height);
    deviceInfo.mobileInfo.screen = screen;
    //创建一个选定区域矩形大小的canvas，方便矩形移动时向移动端传输数据
    rectCanvas = document.createElement('canvas');
    //canvas.id = "CursorLayer";
    rectCanvas.width = screen.width;
    rectCanvas.height = screen.height;
    rectCanvas.style.display = 'none';
    rectEmtpy = rectCanvas.getContext('2d').createImageData(screen.width, screen.height);
    document.body.appendChild(rectCanvas);
    rectWidth = screen.width;
    rectHeight = screen.height;
    $('body').css('backgroud', 'white');
});

socket.on('imgPush', function(data) { //服务器发来图像数据
    var point = data.point;
    console.log('imgPush:' + data);
    point = convertPointforPc(data.shape,deviceInfo,{left:p_left,top:p_top},point);
    //console.log(point);
    if(data.type!='revoke' && data.type!='recovery' && data.type!='empty'){
        //console.log('point:' + JSON.stringify(point));
        points.push(point);       //这里是移动端的坐标
    }
    if (data.shape === 'pencil') {
        //console.log(p_left + '--' + lastPoint.x + '--' + point.x);
        cxt.beginPath();
        cxt.moveTo(lastPoint.x,lastPoint.y);
        cxt.lineTo(point.x, point.y);
        lastPoint.x = point.x;
        lastPoint.y = point.y;
        cxt.stroke();
    } else if (data.shape === 'pen') {
        cxt.lineWidth = point.lineWidth;
        if (deviceInfo.mobileInfo.screen.viewType === 'cross') {
            cxt.lineWidth = point.lineWidth * deviceInfo.scale.x;
        }
        cxt.beginPath();
        cxt.moveTo(lastPoint.x,lastPoint.y);
        cxt.lineTo(point.x, point.y);
        lastPoint.x = point.x;
        lastPoint.y = point.y;
        cxt.stroke();
    }else if (data.shape === 'rect') {
        cxt.beginPath();
        cxt.putImageData(lastCanvasData, 0, 0);
        cxt.strokeRect(point.left, point.top, point.x, point.y);
    } else if (data.shape === 'circle') {
        cxt.beginPath();
        cxt.putImageData(lastCanvasData, 0, 0);
        cxt.arc( point.x, point.y, point.r, 0, 2 * Math.PI);
        cxt.stroke();
    } else if (data.shape === 'ellipse') {
        var k = .5522848
        var a = point.a,b=point.b,x=point.x,y=point.y,ox=point.ox,oy=point.oy;
        cxt.beginPath();
        cxt.putImageData(lastCanvasData, 0, 0);
        //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
        cxt.moveTo(x - a, y);
        cxt.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
        cxt.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
        cxt.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
        cxt.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
        cxt.closePath();
        cxt.stroke();
    } else if (data.shape === 'triangle') {
        cxt.beginPath();
        cxt.putImageData(lastCanvasData, 0, 0);
        cxt.moveTo(point.x1,point.y1);
        cxt.lineTo(point.x2,point.y2);
        cxt.moveTo(point.x2,point.y2);
        cxt.lineTo(point.x3,point.y3);
        cxt.moveTo(point.x3,point.y3);
        cxt.lineTo(point.x1,point.y1);
        cxt.stroke();
    } else if (data.shape === 'line') {
        cxt.beginPath();
        cxt.putImageData(lastCanvasData, 0, 0);
        cxt.moveTo(initX, initY);
        cxt.lineTo(point.x, point.y);
        cxt.stroke();
    } else if (data.type === 'revoke') { //撤销
        console.log('撤销');
        cxt.clearRect(0,0,canvasWidth,canvasHeight)
        //var data = historyCanvas[--current];
        current--;
        for(var i=0;i <= current;i++){
            drawShape(cxt,historyCanvas[i]);
        }
        //如果是竖屏就需要推送过去选定区域的数据
        if (deviceInfo.mobileInfo.screen.viewType === 'vertical') {
            positionChange();
        }
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        return;
    } else if (data.type === 'recovery') { //恢复
        console.log('恢复');
        current++;
        drawShape(cxt,historyCanvas[current]);
        //如果是竖屏就需要推送过去选定区域的数据
        if (deviceInfo.mobileInfo.screen.viewType === 'vertical') {
            positionChange();
        }
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        return;
    } else if (data.type === 'empty') { //清空
        cxt.clearRect(0,0,canvasWidth,canvasHeight);
        /*	$('#selectRect').css('left',0);
        	$('#selectRect').css('top',0);*/
        historyCanvas = new Array();
        lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
        current = -1;
        return;
    } else {
        /*var img = new Image();
        img.src = data.data;
        cxt.putImageData(emtpyData,0,0);
        //cxt.beginPath();
        cxt.drawImage(img, 0, 0,img.width,img.height);*/
        return;
    }

    //cxt.putImageData(emtpyData,0,0);
    //cxt.drawImage(img, p_left, p_top,img.width,img.height);

    //console.log('imgPush----' + data.shape);
});
//接受起始点坐标
socket.on('drawStart', function(point,shape) {
    lastPoint.x = point.x;
    lastPoint.y = point.y;
    lastPoint = convertPointforPc(shape,deviceInfo,{left:p_left,top:p_top},lastPoint);
    initX = lastPoint.x;
    initY = lastPoint.y;
    currentShape = shape;
    points = new Array();
    console.log('drawStart');
});
//画完一个图形
socket.on('drawEnd', function(point) {
    historyCanvas[++current] = {
        shape: currentShape,
        lineWidth: lineWidth,
        color: cxt.strokeStyle,
        startPoint: {
            x: initX,
            y: initY
        },
        points: points
    };
    lastCanvasData = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
    // while (current < historyCanvas.length - 1) {
    //     historyCanvas.pop();
    // }
    console.log('drawEnd');
});
//画布环境发生改变
socket.on('drawPenChange', function(cxtObj) {
    cxt.strokeStyle = cxtObj.strokeStyle;
    lineWidth = cxt.lineWidth = cxtObj.lineWidth;
    if (deviceInfo.mobileInfo.screen.viewType === 'cross') {
        lineWidth = cxt.lineWidth = cxtObj.lineWidth * deviceInfo.scale.x;
    }
    console.log('drawPenChangecxt');
});
//移动端断开连接
socket.on('mobileExit', function() {
  var msg = Messenger().post({
      message: '输入端断开',
      type: 'string',
      hideAfter: 2
  });
    console.log('mobileExit');
});
//一般是横竖屏切换
socket.on('screenResize', function(data) {
    var screen = data.screen;
    console.log('screenResize' + "--" + JSON.stringify(screen));
    deviceInfo.mobileInfo.screen = screen;
    if (deviceInfo.mobileInfo.screen.viewType === 'cross') {
      console.log(screen.width + '---' + canvasWidth / screen.width);
        var long = screen.width>screen.height?screen.width:screen.height;
        var short = screen.width<screen.height?screen.width:screen.height;
        deviceInfo.scale = {
            x: canvasWidth / long,
            y: canvasHeight / short
        };
        console.log('screenResize计算出来的scale.x:' + deviceInfo.scale.x);
        lineWidth = cxt.lineWidth = cxt.lineWidth * deviceInfo.scale.x;
        socket.emit('pcInfo', {
            token: token,
            pcInfo:{
                top: p_top,
                left: p_left
            },
            scale:deviceInfo.scale
        });
        $('#selectRect').hide();
    }else if (deviceInfo.mobileInfo.screen.viewType === 'vertical') {
        $('#selectRect').show();
        lineWidth = cxt.lineWidth = cxt.lineWidth / deviceInfo.scale.x;
        positionChange();
    }
});

//矩形区域位置改变
function positionChange() {
    //先在小画板画出来
    var img = new Image();
    img.src = c.toDataURL("image/png");
    var cxt2 = rectCanvas.getContext('2d');
    cxt2.clearRect(0, 0, rectWidth, rectHeight);
    //cxt2.putImageData(rectEmtpy,rectWidth,rectHeight);
    cxt2.beginPath();
    cxt2.drawImage(img, p_left, p_top, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);
    //加载小画板数据，给客户端发过去，节省带宽，速度快
    var imgData = rectCanvas.toDataURL("image/png");
    // historyCanvas[++current] = ({
    //     data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
    //     x: p_left,
    //     y: p_top
    // });
    // while (current < historyCanvas.length - 1) {
    //     historyCanvas.pop();
    // }
    socket.emit('positionChange', {
        token: token,
        imgData: {
            data: imgData
        }
    });
    socket.emit('pcInfo', {
        token: token,
        pcInfo:{
            top: p_top,
            left: p_left
        }
    });
}
$("#save").click(function() {
    var image = c.toDataURL("image/png").replace("image/png", "image/octet-stream");
    var filename = new Date().getTime() + '.' + 'png';
    saveFile(image, filename);
});

/**
 * 在本地进行文件保存
 * @param  {String} data     要保存到本地的图片数据
 * @param  {String} filename 文件名
 */
var saveFile = function(data, filename) {
    var save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
    save_link.href = data;
    save_link.download = filename;

    var event = document.createEvent('MouseEvents');
    event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    save_link.dispatchEvent(event);
};
//选择区域移动事件
var isDown = false;
$('#selectRect').mousedown(function(event) {
    isDown = true;
    pre_x = event.pageX;
    pre_y = event.pageY;
    //console.log('down');
});
$('#selectRect').mouseup(function() {
    isDown = false;
    positionChange();
    //console.log('up');
});
$('#selectRect').mouseout(function() {
    isDown = false;
    //console.log('out');
});
$('#selectRect').mousemove(function(event) {
    if (isDown) {
        var x = event.pageX;
        var y = event.pageY;
        var left_css = $('#selectRect').css('left');
        var top_css = $('#selectRect').css('top');
        p_left = parseInt(left_css.substring(0, left_css.length - 2));
        p_top = parseInt(top_css.substring(0, top_css.length - 2));
        var resultX = x - pre_x + p_left;
        var resultY = y - pre_y + p_top;

        if ((x - pre_x < 0 && p_left > 0) || (x - pre_x > 0 && p_left < canvasWidth - rectWidth - 10)) { //可以水平移动
            $('#selectRect').css('left', resultX);
        }
        if ((y - pre_y < 0 && p_top > 0) || (y - pre_y > 0 && p_top < canvasHeight - rectHeight - 5)) { //可以垂直移动
            $('#selectRect').css('top', resultY);
        }

        pre_x = x;
        pre_y = y;
    }

});

$('#selectRect').css('left', 0);
$('#selectRect').css('top', 0);
