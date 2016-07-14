var express = require('express')
var app = express()
var url = require('url');

server = require('http').createServer(app);
io = require('socket.io').listen(server);
server.listen(80);
app.use(express.static('public'));
console.log('服务部署成功');
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
		console.log('tellPc end');
		res.send('url错误，您是怎么进来的呢');
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
			io.emit('makecode', token);
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
		drawStart(data.point, token);
	});
	//移动端结束画图
	socket.on('drawEnd', function(data) {
		var token = data.token;
		drawEnd(token);
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
				console.log("img:" + data.imgData);
				mobileList[i].socket.emit('positionChange', data.imgData);
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
function drawStart(point, token) {
	for (i in pcList) {
		if (token == pcList[i].token) { //找到与手机端匹配的PC端
			pcList[i].socket.emit('drawStart', point);
		}
	}
}
//画完一个图形
function drawEnd(token) {
	for (i in pcList) {
		if (token == pcList[i].token) { //找到与手机端匹配的PC端
			pcList[i].socket.emit('drawEnd');
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