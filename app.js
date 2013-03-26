/*jshint laxcomma:true */

/**
 * Module dependencies.
 */
var express = require('express')
    //, mongoose = require('mongoose')
    //, auth = require('./auth')
    //, mongoose_auth = require('mongoose-auth')
    //, mongoStore = require('connect-mongo')(express)
    , routes = require('./routes')
    //, middleware = require('./middleware')
    //, request = require('request')
    , http = require('http')
    , url = require('url')
    , canvas = require('canvas')
    ;

var HOUR_IN_MILLISECONDS = 3600000;
//var session_store;

var init = exports.init = function (config) {
  
  //var db_uri = process.env.MONGOLAB_URI || process.env.MONGODB_URI || config.default_db_uri;

  //mongoose.connect(db_uri);
  //session_store = new mongoStore({url: db_uri});

  var app = express.createServer();

  app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { pretty: true });

    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    //app.use(express.session({secret: 'top secret', store: session_store,
    //  cookie: {maxAge: HOUR_IN_MILLISECONDS}}));
    //app.use(mongoose_auth.middleware());
    //app.use(express.static(__dirname + '/public'));
    app.use(app.router);

  });

  app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: false}));
  });
  
  
  // Routes
  app.get('/', function(req, res){
    res.send('alert("returned");');
  });
  app.get('/inpark', function(req, res){
    //res.send('alert("inpark");');
    var ll = req.query.ctr.split(",");
    var zoom = 15;
    if(ll[2] * 1 < 500){
      zoom = 16;
      if(ll[2] * 1 < 250){
        zoom = 17;
      }
    }
    
http.get(
    {
        host: 'api.tiles.mapbox.com',
        port: 80,
        path: "/v3/mapmeld.map-ofpv1ci4/" + ll[1] + "," + ll[0] + "," + zoom + "/256x256.png"
    },
    function(rez) {
        var data = new Buffer(parseInt(rez.headers['content-length'],10));
        var pos = 0;
        rez.on('data', function(chunk) {
            chunk.copy(data, pos);
            pos += chunk.length;
        });
        rez.on('end', function () {
            img = new canvas.Image;
            img.onload = function(){
              //return res.send('loaded');
              var canv = new canvas(256, 256);
              var ctx = canv.getContext('2d');
              ctx.drawImage(img, 0, 0, 256, 256);
              var imgData = ctx.getImageData(0, 0, 256, 256);
              var naturals = 0;
              for(var x=1;x<256;x++){
                for(var y=1;y<256;y++){
				  var r = imgData.data[y*4*256+x*4];
				  var g = imgData.data[y*4*256+x*4+1];
				  var b = imgData.data[y*4*256+x*4+2];
				  var a = imgData.data[y*4*256+x*4+3];
				  if((g > 210 && r < 210 && b < 170) || (r < 120 && g < 190 && b > 220)){
				    // natural
				    naturals++;
				  }
                }
              }
              res.send("confirmTotal(" + naturals + ");");
              
              /*canv.toDataURL('image/png', function(err, str){
                if(err){
                  return res.send(err);
                }
                // output HTML with the image included
                res.send('<img src="' + str + '" width="256" height="256"/>');
              });*/
            };
            img.onerror = function(e){
              res.send(e);
            }
            img.src = data;
        });
    }
);



  });
  
  // redirect all non-existent URLs to doesnotexist
  app.get('*', function onNonexistentURL(req,res) {
    res.send('error');
  });

  //mongoose_auth.helpExpress(app);

  return app;
};

// Don't run if require()'d
if (!module.parent) {
  var config = require('./config');
  var app = init(config);
  app.listen(process.env.PORT || 3000);
  console.info("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}