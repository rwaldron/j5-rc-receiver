// npm install johnny-five
var five = require("johnny-five");
var Receiver = require("../")(five);
var board = new five.Board();

board.on("ready", function() {
  // Defaults to 6 Channels
  var receiver = new Receiver();

  receiver.on("change", function(change) {
    console.log(`Channel: ${change.channel}: ${change.value}`);
  });
});
