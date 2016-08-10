//画点(用来绘制画板历史数据，也就是撤销恢复功能,只在横屏用)
function drawShape(cxt,data){
    var shape = data.shape;
    var currentLinewidth = cxt.linewidth;
    var currentColor = cxt.strokeStyle;
    cxt.lineWidth = data.lineWidth;
    cxt.strokeStyle = data.color;
    var startPoint = data.startPoint;
    var points = data.points;
    var last = points.length-1;
    cxt.beginPath();
    if (shape === 'pencil') {
        cxt.moveTo(startPoint.x,startPoint.y);
        for(var i=0;i<points.length;i++){
            cxt.lineTo(points[i].x, points[i].y);
            cxt.stroke();
        }
    }else if (shape === 'rect') {
        cxt.strokeRect(points[last].left, points[last].top, points[last].x, points[last].y);
        cxt.stroke();
    }else if (shape === 'circle') {
        cxt.arc(points[last].x, points[last].y, points[last].r, 0, 2 * Math.PI);
        cxt.stroke();
    }else if (shape === 'triangle') {
        cxt.moveTo(points[last].x1, points[last].y1);
        cxt.lineTo(points[last].x2, points[last].y2);
        cxt.moveTo(points[last].x2, points[last].y2);
        cxt.lineTo(points[last].x3, points[last].y3);
        cxt.moveTo(points[last].x3, points[last].y3);
        cxt.lineTo(points[last].x1, points[last].y1);
        cxt.stroke();
    }else if (shape === 'line') {
        cxt.moveTo(startPoint.x, startPoint.y);
        cxt.lineTo(points[last].x, points[last].y);
        cxt.stroke();
    }else if (shape === 'pen') {
        for(var i=0;i<points.length-1;i++){
            cxt.beginPath();
            cxt.lineWidth = points[i].lineWidth
            cxt.moveTo(points[i].x, points[i].y);
            cxt.lineTo(points[i+1].x, points[i+1].y);
            cxt.stroke();
        }
    }else if (shape === 'ellipse') {
        var x =points[last].x;
        var y =points[last].y;
        var a =points[last].a;
        var b =points[last].b;
        var ox =points[last].ox;
        var oy =points[last].oy;
        cxt.beginPath();
        //从椭圆的左端点开始顺时针绘制四条三次贝塞尔曲线
        cxt.moveTo(x - a, y);
        cxt.bezierCurveTo(x - a, y - oy, x - ox, y - b, x, y - b);
        cxt.bezierCurveTo(x + ox, y - b, x + a, y - oy, x + a, y);
        cxt.bezierCurveTo(x + a, y + oy, x + ox, y + b, x, y + b);
        cxt.bezierCurveTo(x - ox, y + b, x - a, y + oy, x - a, y);
        cxt.closePath();
        cxt.stroke();
    }

    //还原画笔
    cxt.lineWidth = currentLinewidth;
    cxt.strokeStyle = currentColor;

}

//转化点坐标（即把移动端竖屏坐标转化为横屏坐标）
function convertPoint(shape,pcInfo,scale,point){
    // console.log('start---');
    // console.log(shape);
    // console.log(pcInfo);
    // console.log(scale);
    // console.log(point);
    // console.log('end---');
    if (shape === 'pencil') {
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
    }else if (shape === 'rect') {
        point.left = (point.left + pcInfo.left)/scale.x;
        point.top = (point.top + pcInfo.top)/scale.y;
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
    }else if (shape === 'circle') {
        var initx = point.x;
        var inity = point.y;
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
        point.r = point.r/scale.x;
        //point.r = Math.sqrt( (initx*initx + inity*inity) / (point.x*point.x + point.y*point.y) ) * point.r;
    }else if (shape === 'triangle') {
        point.x1 = (point.x1 + pcInfo.left)/scale.x;
        point.x2 = (point.x2 + pcInfo.left)/scale.x;
        point.x3 = (point.x3 + pcInfo.left)/scale.x;
        point.y1 = (point.y1 + pcInfo.top)/scale.y;
        point.y2 = (point.y2 + pcInfo.top)/scale.y;
        point.y3 = (point.y3 + pcInfo.top)/scale.y;
    }else if (shape === 'line') {
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
    }else if (shape === 'pen') {
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
        point.lineWidth = point.lineWidth/scale.x;
    }else if (shape === 'ellipse') {
        var k = .5522848;
        point.x = (point.x + pcInfo.left)/scale.x;
        point.y = (point.y + pcInfo.top)/scale.y;
        point.a = (point.a + pcInfo.left)/scale.x;
        point.b = (point.b + pcInfo.top)/scale.y;
        point.ox = point.a * k, // 水平控制点偏移量
        point.oy = point.b * k; // 垂直控制点偏移量
    }
    return point;
}


//移动端坐标转化为PC端坐标
function convertPointforPc(shape,deviceInfo,pcInfo,point){
    // console.log('start---');
    // console.log(shape);
    // console.log(deviceInfo);
    // console.log(pcInfo);
    // console.log(point);
    // console.log('end---');
    var scale = deviceInfo.scale;
    var viewType = deviceInfo.mobileInfo.screen.viewType;
    var p = {};
    p.cross = {};
    p.vertical = {};
    if (shape === 'pencil') {
        p.cross.x = point.x * scale.x;
        p.cross.y = point.y * scale.y;
        p.vertical.x = point.x + pcInfo.left;
        p.vertical.y = point.y + pcInfo.top;
    }else if (shape === 'rect') {
        p.cross.left = point.left * scale.x;
        p.cross.top =  point.top * scale.y;
        p.cross.x = point.x * scale.x;
        p.cross.y =  point.y * scale.y;
        p.vertical.left = pcInfo.left + point.left;
        p.vertical.top =  pcInfo.top + point.top;
        p.vertical.x = point.x;
        p.vertical.y =  point.y;
    }else if (shape === 'circle') {
        p.cross.x = point.x * scale.x;
        p.cross.y = point.y * scale.y;
        p.cross.r = point.r * scale.x;
        p.vertical.x = point.x + pcInfo.left;
        p.vertical.y = point.y + pcInfo.top;
        p.vertical.r = point.r;
    }else if (shape === 'triangle') {
        p.cross.x1 = point.x1 * scale.x;
        p.cross.x2 = point.x2 * scale.x;
        p.cross.x3 = point.x3 * scale.x;
        p.cross.y1 = point.y1 * scale.y;
        p.cross.y2 = point.y2 * scale.y;
        p.cross.y3 = point.y3 * scale.y;
        //竖屏
        p.vertical.x1 = point.x1 + pcInfo.left;
        p.vertical.x2 = point.x2 + pcInfo.left;
        p.vertical.x3 = point.x3 + pcInfo.left;
        p.vertical.y1 = point.y1 + pcInfo.top;
        p.vertical.y2 = point.y2 + pcInfo.top;
        p.vertical.y3 = point.y3 + pcInfo.top;
    }else if (shape === 'line') {
        p.cross.x = point.x * scale.x;
        p.cross.y = point.y * scale.y;
        p.vertical.x = point.x + pcInfo.left;
        p.vertical.y = point.y + pcInfo.top;
    }else if (shape === 'pen') {
        p.cross.x = point.x * scale.x;
        p.cross.y = point.y * scale.y;
        p.cross.lineWidth = point.lineWidth;
        p.vertical.x = point.x + pcInfo.left;
        p.vertical.y = point.y + pcInfo.top;
        p.vertical.lineWidth = point.lineWidth;
    }else if (shape === 'ellipse') {
        var k = .5522848;
        p.cross.x = point.x * scale.x;
        p.cross.y = point.y * scale.y;
        p.cross.a = point.a * scale.x;
        p.cross.b = point.b * scale.y;
        p.cross.ox = p.cross.a * k;
        p.cross.oy = p.cross.b * k;

        p.vertical.x = point.x + pcInfo.left;
        p.vertical.y = point.y + pcInfo.top;
        p.vertical.a = point.a;
        p.vertical.b = point.b;
        p.vertical.ox = p.vertical.a * k;
        p.vertical.oy = p.vertical.b * k;

    }
    if (viewType === 'vertical') {
        return p.vertical;
    }else if (viewType === 'cross') {
        return p.cross;
    }

}
