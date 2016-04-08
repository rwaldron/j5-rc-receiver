if (!Array.from || !Map || !Object.assign || !global.Symbol) {
  require("es6-shim");
}

var Emitter = require("events").EventEmitter;
var util = require("util");
var priv = new Map();
var iterator = "@@iterator";

// TODO: should be customizable?
var channelNames = ["throttle", "aileron", "elevator", "rudder", "gear", "aux1", "aux2", "aux3"];
var addresses = [0x0A, 0x0B, 0x0C, 0x0D];

/* jshint unused: false */
var Controllers = {
  // We'll migrate to this model once we know more
  // about each type of Receiver that we want to support
};

function Channel(name, channel, value, previous) {
  this.name = name;
  this.channel = channel;
  this.value = value;
  this.previous = previous;
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
      var names = channelNames.slice();

      if (Array.isArray(channels)) {
        // TODO: add support for custom channel names
        names = channels.slice();
        channels = channels.length;
      }

      var state = {
        names: names,
        channels: Array(channels).fill(0).map(function(value, index) {
          return new Channel(names[index], index + 1, value, value);
        }),
      };

      priv.set(this, state);

      // Ensure the address is passed through
      opts.address = address;

      var channelsDescriptor = state.channels.reduce(function(accum, channel, index) {
        accum[index + 1] = {
          get: function() {
            return state.channels[index].value;
          }
        };
        return accum;
      }, {});

      Object.defineProperties(this, channelsDescriptor);

      this.io.i2cConfig(opts);

      // Send a reset command
      this.io.i2cWrite(address, 0x01);

      // Request channel data from bus
      this.io.i2cRead(address, channels * 2, function(data) {
        for (var i = 0; i < channels; i++) {
          state.channels[i].previous = state.channels[i].value;
          state.channels[i].value = five.Fn.uint16(data[i * 2], data[i * 2 + 1]);

          if (state.channels[i].value !== state.channels[i].previous) {
            var change = Object.assign({}, state.channels[i]);

            this.emit("change", change);
            this.emit("change:" + change.name, change);
          }
        }

        this.emit("data", Object.assign({}, this));
      }.bind(this));
    }

    util.inherits(Receiver, Emitter);

    if (typeof Symbol !== "undefined" && typeof Symbol.iterator !== "undefined") {
      iterator = Symbol.iterator;
    }

    Receiver.prototype[iterator] = function() {
      var channel = 0;
      var receiver = this;

      return {
        next: function() {
          return ++channel in receiver ? {
            value: receiver[channel],
            done: false
          } : {
            done: true
          };
        },
      };
    };

    Receiver.prototype.channel = function(channel) {
      var state = priv.get(this);
      var index = -1;

      if (typeof channel === "string") {
        index = state.names.indexOf(channel.toLowerCase());
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
      var channel = state.channels[index];
      return new Channel(channel.name, index + 1, channel.value, channel.previous);
    };

    return Receiver;
  }());
};

/**
 *  To use the plugin in a program:
 *
 *  var five = require("johnny-five");
 *  var Receiver = require("j5-rc-receiver")(five);
 *
 *
 */
