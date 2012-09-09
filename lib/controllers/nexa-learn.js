var net = require('net');

module.exports = function($, fn) {
  $units = $({ type: 'Nexa2Switch' });
  
  var server = net.createServer(function(conn) {
    console.log('Connected.');
    conn.on('end', function() {
      console.log('Disconnected.');
    });
    
    conn.on('data', function(data) {
      var offId = parseInt(data.toString());
      if (offId != null) {
        var $found = $units.select({ offId: offId });
        console.log('Found ' + $found.length + ' units. Sending on.');
        $found.send('on');
        conn.write("Paste one of the IDs: ");
      }
    });

    conn.write($units.toArray().map(function(unit) {
      return unit.metadata.get('offId') + ': ' + unit.metadata.get('location') + ' - ' + unit.metadata.get('description');
    }).join('\n') + '\nPaste one of the IDs: ');
  }).listen(12345);
};