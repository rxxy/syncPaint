function touchmove_pencil(e){
    var touch = e.originalEvent.targetTouches[0];
    isDraw = true;
    cxt.beginPath();
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    // x += 0.5;
    // y += 0.5;
    cxt.moveTo(lastPoint.x, lastPoint.y);
    cxt.lineTo(x, y);
    lastPoint.x = x;
    lastPoint.y = y;
    cxt.closePath();
    cxt.stroke();
    currentPoint = {
        x: x,
        y: y
    };
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_rect(e){
    isDraw = true;
    cxt.beginPath();
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    cxt.putImageData(lastCanvasData, 0, 0);
    cxt.strokeRect(initX, initY, x - initX, y - initY);
    currentPoint = {
        left: initX,
        top: initY,
        x: x - initX,
        y: y - initY
    };
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_circle(e){
    isDraw = true;
    cxt.beginPath();
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    cxt.putImageData(lastCanvasData, 0, 0);
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
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_triangle(e){
    isDraw = true;
    cxt.beginPath();
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    cxt.putImageData(lastCanvasData, 0, 0);
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
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_line(e){
    isDraw = true;
    cxt.beginPath();
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    cxt.putImageData(lastCanvasData, 0, 0);

    cxt.moveTo(initX, initY);
    cxt.lineTo(x, y);
    cxt.stroke();
    currentPoint = {
        x: x,
        y: y
    };
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_pen(e){
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
        x: lastPoint.x,
        y: lastPoint.y
    })
    var t = curTimestamp - lastTimestamp
    cxt.lineWidth = calcLineWidth(t, s);
    cxt.beginPath();
    cxt.moveTo(lastPoint.x, lastPoint.y);
    cxt.lineTo(x, y);
    cxt.closePath();
    cxt.stroke();
    currentPoint = {
        x: x,
        y: y,
        lineWidth: cxt.lineWidth
    };
    points.push(currentPoint);
    imageChange();
    lastPoint.x = x;
    lastPoint.y = y;
    lastTimestamp = curTimestamp
    lastLineWidth = cxt.lineWidth;
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
function touchmove_ellipse(e){
    isDraw = true;
    var touch = e.originalEvent.changedTouches[0];
    var x = touch.clientX - offset.left;
    var y = touch.clientY - offset.top;
    cxt.putImageData(lastCanvasData, 0, 0);
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
    points.push(currentPoint);
    imageChange();
    //禁止手指滑动时屏幕跟着滚动
    e.returnValue = false;
    return false;
}
