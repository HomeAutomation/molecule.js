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
  
  $remoteBedroom.on('button', fn.limit(500, function(unit, event) {
    var targets = buttonActions[event.buttonNumber];

    if (event.isOn) {
      if (level < 4) {
        level += 1;        
      }
    } else {
      level = 0;
    }
    
    console.log('Turning ' + (event.isOn ? 'on' : 'off') + ' lights: ' + targets.map(function(t) {
      return t.toArray()[0].metadata.get('description').toLowerCase();
    }).join(', ') + ' (dimmer value: ' + (level * 0.25) + ')');
    
    var sequence = [this];
    
    targets.forEach(function($target) {
      sequence.push(fn.sleep(500));
      sequence.push(function() {
        if ($target.toArray()[0].metadata.get('type') === 'Nexa2Dimmer' && event.isOn) {
          $target.send('absoluteDim', 0.25 * level);  
        } else {
          $target.send('state', event.isOn);  
        }
      });
    });

    fn.step.apply(fn, sequence);
  }));
};
