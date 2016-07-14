$('body').css('backgroud-color', '#eee');
//选择区域上一次移动的位置坐标
var pre_x;
var pre_y;
//初始点坐标
var initX;
var initY;
//canvas的大小
var canvasWidth = $('#myCanvasDiv').css('width');
var canvasHeight = $('#myCanvasDiv').css('height');
canvasWidth = canvasWidth.substring(0, canvasWidth.length - 2);
canvasHeight = canvasHeight.substring(0, canvasHeight.length - 2);
//设置当前画布的大小，和电脑一样大-_-||
$('#myCanvas').attr('width', canvasWidth);
$('#myCanvas').attr('height', canvasHeight);
//选择区域矩形的长宽
var rectWidth;
var rectHeight;
//现在要画图的坐标
var p_left = 0;
var p_top = 0;
var c = document.getElementById("myCanvas");
//获取一支画笔
var cxt = c.getContext("2d");
var emtpyData = cxt.getImageData(0, 0, c.width, c.height);
//存放历史的绘图数据，方便撤销和恢复/存放历史的绘图数据，方便撤销和恢复
var historyCanvas;
//当前画布数据在historyCanvas的下标
var current = 0;
historyCanvas = new Array();
historyCanvas.push({
    data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
    x: 0,
    y: 0
});
//存放当前画布数据
var currentImg;
var token;
var socket = io().connect("http://" + window.location.host);
socket.on('makecode', function(data) { //监听得到token
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
    /*alert('width:' + screen.width +'\nheight:'+ screen.height);
    $('#myCanvas').attr('width',screen.width);
    $('#myCanvas').attr('height',screen.height);
    $('#myCanvas').css('border','1px solid');
    */
    //放大图像在电脑上显示
    //cxt.scale(canvasWidth/screen.width,canvasHeight/screen.height);
    $('#selectRect').css("width", screen.width);
    $('#selectRect').css("height", screen.height);
    //创建一个选定区域矩形大小的canvas，方便矩形移动时向移动端传输数据
    rectCanvas = document.createElement('canvas');
    //canvas.id = "CursorLayer";
    rectCanvas.width = screen.width;
    rectCanvas.height = screen.height;
    rectCanvas.style.display = 'none';
    rectEmtpy = rectCanvas.getContext('2d').createImageData(screen.width, screen.height);
    // canvas.style.position = "absolute";
    // canvas.style.border = "1px solid";
    document.body.appendChild(rectCanvas);

    rectWidth = screen.width;
    rectHeight = screen.height;
    $('body').css('backgroud', 'white');
});

currentImg = emtpyData;
socket.on('imgPush', function(data) { //服务器发来图像数据
    var point = data.point;
    //cxt.beginPath();
    if (data.type === 'pen') {
        cxt.lineTo(p_left + initX, p_top + initY);
        initX = point.x;
        initY = point.y;
        cxt.stroke();
    } else if (data.type === 'rect') {
        cxt.beginPath();
        cxt.putImageData(historyCanvas[current].data, 0, 0);
        cxt.strokeRect(p_left + point.left, p_top + point.top, point.x, point.y);
    } else if (data.type === 'circle') {
        cxt.beginPath();
        cxt.putImageData(historyCanvas[current].data, 0, 0);
        cxt.arc(p_left + point.x, p_top + point.y, point.r, 0, 2 * Math.PI);
        cxt.stroke();
    } else if (data.type === 'triangle') {
        cxt.beginPath();
        cxt.putImageData(historyCanvas[current].data, 0, 0);
        cxt.moveTo(p_left + point.x1, p_top + point.y1);
        cxt.lineTo(p_left + point.x2, p_top + point.y2);
        cxt.moveTo(p_left + point.x2, p_top + point.y2);
        cxt.lineTo(p_left + point.x3, p_top + point.y3);
        cxt.moveTo(p_left + point.x3, p_top + point.y3);
        cxt.lineTo(p_left + point.x1, p_top + point.y1);
        cxt.stroke();
    } else if (data.type === 'line') {
        cxt.beginPath();
        cxt.putImageData(historyCanvas[current].data, 0, 0);
        cxt.moveTo(p_left + initX, p_top + initY);
        cxt.lineTo(p_left + point.x, p_top + point.y);
        cxt.stroke();
    } else if (data.type === 'revoke') { //撤销
        cxt.putImageData(historyCanvas[--current].data, 0, 0);
        //如果是撤销到最开始的位置的话，选择区域的坐标就会到（0,0）
        if (current > 0) {
            $('#selectRect').css('left', historyCanvas[current].x);
            $('#selectRect').css('top', historyCanvas[current].y);
        }
        return;
    } else if (data.type === 'recovery') { //恢复
        cxt.putImageData(historyCanvas[++current].data, 0, 0);
        $('#selectRect').css('left', historyCanvas[current].x);
        $('#selectRect').css('top', historyCanvas[current].y);
        return;
    } else if (data.type === 'empty') { //清空
        cxt.putImageData(historyCanvas[0].data, 0, 0);
        /*	$('#selectRect').css('left',0);
        	$('#selectRect').css('top',0);*/
        historyCanvas = new Array();
        historyCanvas.push({
            data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
            x: 0,
            y: 0
        });
        current = 0;
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


    console.log('imgPush----' + data.type);
});
//接受起始点坐标
socket.on('drawStart', function(point) {
    cxt.beginPath();
    initX = point.x;
    initY = point.y;
    console.log('drawStart');
});
//画完一个图形
socket.on('drawEnd', function(point) {
    currentImg = cxt.getImageData(0, 0, canvasWidth, canvasHeight);
    historyCanvas[++current] = ({
        data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
        x: p_left,
        y: p_top
    });
    while (current < historyCanvas.length - 1) {
        historyCanvas.pop();
    }
    console.log('drawEnd');
});
//画布环境发生改变
socket.on('drawPenChange', function(cxtObj) {
    cxt.strokeStyle = cxtObj.strokeStyle;
    cxt.lineWidth = cxtObj.lineWidth;
    console.log('drawPenChangecxt');
});
//矩形区域位置改变
function positionChange() {
    //现在小画板画出来
    var img = new Image();
    img.src = c.toDataURL("image/png");
    var cxt2 = rectCanvas.getContext('2d');
    cxt2.clearRect(0, 0, rectWidth, rectHeight);
    //cxt2.putImageData(rectEmtpy,rectWidth,rectHeight);
    cxt2.beginPath();
    cxt2.drawImage(img, p_left, p_top, rectWidth, rectHeight, 0, 0, rectWidth, rectHeight);
    //加载小画板数据，给客户端发过去，节省带宽，速度快
    var imgData = rectCanvas.toDataURL("image/png");
    historyCanvas[++current] = ({
        data: cxt.getImageData(0, 0, canvasWidth, canvasHeight),
        x: p_left,
        y: p_top
    });
    while (current < historyCanvas.length - 1) {
        historyCanvas.pop();
    }
    //debug
    // var img = new Image();
    // img.src = imgData;
    // cxt.putImageData(historyCanvas[0].data,0,0);
    // cxt.drawImage(img,p_left, p_top,rectWidth,rectHeight,0,0,rectWidth,rectHeight);



    socket.emit('positionChange', {
        token: token,
        imgData: {
            data: imgData
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
    console.log('down');
});
$('#selectRect').mouseup(function() {
    isDown = false;
    positionChange();
    console.log('up');
});
$('#selectRect').mouseout(function() {
    isDown = false;
    console.log('out');
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
