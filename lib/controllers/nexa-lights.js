var http = require('http'),
    url = require('url');

module.exports = function($, fn) {
  var $remote1 = $({ type: 'Nexa1Remote' });
  var $remote2 = $({ type: 'Nexa2Remote', location: 'living-room' });
  var $switch1 = $({ type: 'Nexa1Switch', window: 1 });
  var $switch2 = $({ type: 'Nexa1Switch', window: 2 });
  var $dimmer = $({ type: 'Nexa2Dimmer', location: 'living-room' });


  

  // $remote1.on('button', function(unit, event) {
  //   if (event.buttonNumber === 0) {
  //     fn.step(
  //       function() { $switch.send('state', event.isOn); },
  //       fn.sleep(500),
  //       function() { $switch.send('state', !event.isOn); }
  //     );
  //   }
  // });

  $({ type: 'RfTransceive' }).on('online', function(unit, count, all) {
    console.log('rftransceive online!', count, all);
  });
  
  $remote2.on('button', function(unit, event) {
    if (event.buttonNumber === 3) {
      console.log('begin all lights', event.isOn ? 'on' : 'off');
      fn.step(
        function() { $switch1.send('state', event.isOn); },
        fn.sleep(500),
        function() { $switch2.send('state', event.isOn); },
        fn.sleep(500),
        function() { $dimmer.send('absoluteDim', event.isOn ? 0.5 : 0); }
      );
      console.log('end all lights', event.isOn ? 'on' : 'off');  
    }
  });

  var $remoteBedroom = $({ type: 'Nexa2Remote', location: 'bedroom' });

  var $dimmerB = $({ type: 'Nexa2Dimmer', location: 'bedroom', subLocation: 'bjorns-table' });
  var $dimmerL = $({ type: 'Nexa2Dimmer', location: 'bedroom', subLocation: 'lindas-table' });
  var $switchWindow = $({ type: 'Nexa2Switch', location: 'bedroom', subLocation: 'window' });
  var $switchBureau = $({ type: 'Nexa2Switch', location: 'bedroom', subLocation: 'bureau' });

  var buttonActions = {
    0: [$dimmerL],
    1: [$dimmerB],
    2: [$dimmerL, $dimmerB, $switchWindow, $switchBureau]
  };

  var level = 0;

  var sendLightState = fn.limit(500, function(targets, isOn) {
    if (isOn) {
      if (level < 4) {
        level += 1;        
      }
    } else {
      level = 0;
    }
    
    console.log('Turning ' + (isOn ? 'on' : 'off') + ' lights: ' + targets.map(function(t) {
      return t.toArray()[0].metadata.get('description').toLowerCase();
    }).join(', ') + ' (dimmer value: ' + (level * 0.25) + ')');
    
    var sequence = [this];
    
    targets.forEach(function($target) {
      sequence.push(fn.sleep(500));
      sequence.push(function() {
        if ($target.toArray()[0].metadata.get('type') === 'Nexa2Dimmer' && isOn) {
          $target.send('absoluteDim', 0.25 * level);  
        } else {
          $target.send('state', isOn);  
        }
      });
    });

    fn.step.apply(fn, sequence);
  });
  
  $remoteBedroom.on('button', fn.limit(500, function(unit, event) {
    var targets = buttonActions[event.buttonNumber];
    sendLightState(targets, event.isOn);
  }));

  http.createServer(function(req, res) {
    var parsedUrl = url.parse(req.url, true);
    if (req.method === 'GET' && parsedUrl.pathname === '/lights') {
      var ok = function(text) {
        console.log('OK ' + text);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('OK ' + text + ': ' + req.url);
      };
      if (parsedUrl.query.all) {
        sendLightState(buttonActions[2], true);
        ok('all');
      } else if (parsedUrl.query.bjorn) {
        sendLightState(buttonActions[1], true);
        ok('bjorn');
      } else {
        res.writeHead(400, {'Content-Type': 'text/plain'});
        res.end('Invalid request.');
        console.log('400, invalid ' + req.url + ': ' + parsedUrl.query);
      }
    } else {
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('Not found');
      console.log('404 ' + req.method + ': ' + req.url + ': ' + parsedUrl.pathname);
    }
  }).listen(9876);
};
