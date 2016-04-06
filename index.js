var Emitter = require("events").EventEmitter;
var util = require("util");
var priv = new Map();


// TODO: should be customizable?
var channelNames = ["throttle", "aileron", "elevator", "rudder", "gear", "aux1", "aux2", "aux3"];
var addresses = [0x0A, 0x0B, 0x0C, 0x0D];

/* jshint unused: false */
var Controllers = {
  // We'll migrate to this model once we know more
  // about each type of Receiver that we want to support
};


function Channel(state) {
  this.name = state.name;
  this.value = state.value;
  this.previous = state.previous;
  Object.freeze(this);
}

module.exports = function(five) {

  return (function() {

    function Receiver(opts) {
      if (!(this instanceof Receiver)) {
        return new Receiver(opts);
      }

      five.Board.Component.call(
        this, opts = five.Board.Options(opts)
      );

      var address = opts.address || addresses[0];
      var channels = opts.channels || 6;

      if (Array.isArray(channels)) {
        // TODO: add support for custom channel names
        channels = channels.length;
      }

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
      var index;

      if (typeof channel === "string") {
        index = channelNames.indexOf(channel.toLowerCase());
      } else {
        // `channel` is expected to be 1-8 (as in, not zero indexed)
        index = channel - 1;
      }

      if (index < 0) {
        return null;
      }

      return this.channelAt(index);
    };

    Receiver.prototype.channelAt = function(index) {
      var state = priv.get(this);

      return new Channel({
        name: channelNames[index],
        value: state.channels[index],
        previous: state.previous[index],
      });
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
