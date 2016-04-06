var Emitter = require("events").EventEmitter;
var util = require("util");
var priv = new Map();

var channelNames = ["throttle", "aileron", "elevator", "rudder", "gear", "aux1", "aux2", "aux3"];


module.exports = function(five) {
  return (function() {

    function Receiver(opts) {
      if (!(this instanceof Receiver)) {
        return new Receiver(opts);
      }

      five.Board.Component.call(
        this, opts = five.Board.Options(opts)
      );

      var address = opts.address || 0x0A;
      var channels = opts.channels || 6;
      var mode = opts.mode || 2;
      var state = {
        channels: Array(channels).fill(0),
        previous: Array(channels).fill(0),
      };

      priv.set(this, state);

      // Ensure the address is passed through
      opts.address = address;

      var channelsDescriptor = state.channels.reduce(function(accum, channel, index) {
        accum[index + 1] = {
          get: function() {
            return state.channels[index];
          }
        };
        return accum;
      }, {});

      channelsDescriptor.length = {
        get: function() {
          return channels;
        }
      };

      Object.defineProperties(this, channelsDescriptor);

      this.io.i2cConfig(opts);

      // Send a reset command
      this.io.i2cWrite(address, 0x01);

      // Request channel data from bus
      this.io.i2cRead(address, channels * 2, function(data) {
        for (var i = 0; i < channels; i++) {
          state.previous[i] = state.channels[i];
          state.channels[i] = five.Fn.uint16(data[i * 2], data[i * 2 + 1]);

          if (state.channels[i] !== state.previous[i]) {
            var which = channelNames[i];
            var change = {
              which: which,
              value: state.channels[i],
              previous: state.previous[i],
              channel: i + 1,
            };

            this.emit("change", change);
            this.emit("change:" + which, change);
          }
        }

        this.emit("data", Object.assign({}, this));
      }.bind(this));
    }

    util.inherits(Receiver, Emitter);

    Receiver.prototype.channel = function(channel) {
      // `channel` is expected to be 1-8 (as in, not zero indexed)
      return priv.get(this).channels[channel - 1];
    };

    Receiver.prototype.channelAt = function(index) {
      // `index` is expected to be 0-7 (as in, zero indexed)
      return priv.get(this).channels[index];
    };

    return Receiver;
  }());
};


/**
 *  To use the plugin in a program:
 *
 *  var five = require("johnny-five");
 *  var Receiver = require("component")(five);
 *
 *
 */
