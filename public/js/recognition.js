/**
  实现手绘板识别模式，对一些简单的图形进行识别，并且生成标准的图形。
  识别算法使用 @dollar.js
*/

var recognitionSwitch = false;



function recognition_repaint(cxt,points,lastCanvasData){
    //xy大小写转换

    $.each(points,function(index,value){
        points[index].X = points[index].x;
        points[index].Y = points[index].y;
    });

		var dollar = new DollarRecognizer();
		var result = dollar.Recognize(points);
		console.log('识别结果：' + JSON.stringify(result));
		//以下内容开始根据识别图形绘制标准图形
    var requirePoint = {};
		var topP = points[0];
		var top,down,left,right;
		left = right = points[0].X;
		top = down = points[0].Y;
		cxt.beginPath();
		for (var i = 0; i < points.length; i++) {
  			if (points[i].Y < top) {
  				top = points[i].Y;
  				topP = points[i];
  			}
  			if (points[i].Y > down) {
  				down = points[i].Y;
  			}
  			if (points[i].X < left) {
  				left = points[i].X;
  			}
  			if (points[i].X > right) {
  				right = points[i].X;
  			}

		}
    cxt.putImageData(lastCanvasData, 0, 0);
		if (result.Name === 'circle') {
  			var r = (right - left + down - top)/2/2;
  			var x = (right - left) / 2 + left;
  			var y = (down - top) / 2 + top;
  			cxt.arc(x,y, r, 0, 2 * Math.PI);
        cxt.stroke();
        requirePoint.r = r;
        requirePoint.x = x;
        requirePoint.y = y;
		}else if (result.Name === 'caret') {  //这个是补字符号，貌似是一个倒V
        result.Name = 'rect';
		    cxt.strokeRect(left, top, right-left, down-top);
        requirePoint.left = left;
        requirePoint.top = top;
        requirePoint.x = right-left;
        requirePoint.y = down-top;
		}else if (result.Name === 'rectangle') {
        result.Name = 'rect';
		    cxt.strokeRect(left, top, right-left, down-top);
        requirePoint.left = left;
        requirePoint.top = top;
        requirePoint.x = right-left;
        requirePoint.y = down-top;
		}else if (result.Name === 'triangle') {
    		cxt.moveTo(topP.X,topP.Y);
    		cxt.lineTo(left,down);
    		cxt.moveTo(left,down);
    		cxt.lineTo(right,down);
    		cxt.moveTo(right,down);
    		cxt.lineTo(topP.X,topP.Y);
    		cxt.stroke();
        requirePoint.x1 = topP.X;
        requirePoint.y1 = topP.Y;
        requirePoint.x2 = left;
        requirePoint.y2 = down;
        requirePoint.x3 = right;
        requirePoint.y3 = down;
		}else {
        result.Name = '未识别';
		}
    if (result.Name != '未识别') {
        return {
            shape:result.Name,
            points:[requirePoint]
        }
    }else {
        return null;
    }
    //  startPoint,shape,points(一个currentPoint)
	}
