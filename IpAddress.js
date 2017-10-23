function getIPAdress(){  
  var interfaces = require('os').networkInterfaces();  
  for(var devName in interfaces){  
    if (devName.startsWith('VMware')) {
    }
    var iface = interfaces[devName];  
    for(var i=0;i<iface.length;i++){  
      var alias = iface[i];  
      if(alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal && !devName.startsWith('VMware')){  
           return alias.address;  
      }  
    }
  }  
}

module.exports = getIPAdress;