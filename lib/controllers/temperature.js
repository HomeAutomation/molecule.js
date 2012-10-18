module.exports = function($, fn) {
  $temp = $({ type: 'RubicsonTemperature' });
  
  console.log('temp length', $temp.length);
  
  $temp.on('temperature', function(unit, event) {
    console.log(new Date().getTime().toString(), ': got temperature ' + event.temperature + '° C and humidity ' + event.humidity + '%');
  });
};