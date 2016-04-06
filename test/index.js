require("es6-shim");

var sinon = require("sinon");
var Emitter = require("events").EventEmitter;

function IO() {}

IO.prototype.i2cConfig = function() {};
IO.prototype.i2cWrite = function() {};
IO.prototype.i2cRead = function() {};

function Board() {
  this.io = new IO();
}

Board.Component = function(opts) {
  this.io = opts.board.io;
};

Board.Options = function(opts) {
  return Object.assign({}, opts || {});
};

var five = {
  Board: Board,
  Fn: {
    uint16: function(high, low) {
      return (high << 8) | low;
    },
  },
};

var sandbox = sinon.sandbox.create();
var Receiver = require("../")(five);

var captures = [
  [ 5, 184, 5, 216, 5, 212, 5, 208, 7, 132, 5, 212 ],
  [ 5, 184, 5, 216, 5, 212, 5, 208, 7, 132, 5, 212 ],
  [ 5, 188, 5, 212, 5, 212, 5, 212, 7, 136, 5, 212 ],
  [ 5, 96, 5, 212, 5, 216, 5, 212, 7, 132, 5, 212 ],
  [ 5, 96, 5, 212, 5, 216, 5, 212, 7, 132, 5, 212 ],
  [ 5, 68, 5, 212, 5, 212, 5, 208, 7, 136, 5, 212 ],
  [ 5, 68, 5, 212, 5, 212, 5, 208, 7, 136, 5, 212 ],
  [ 5, 68, 5, 212, 5, 212, 5, 208, 7, 136, 5, 212 ],
  [ 4, 248, 5, 212, 5, 216, 5, 208, 7, 132, 5, 212 ],
];

exports["Receiver"] = {
  setUp: function(done) {
    this.i2cConfig = sandbox.spy(IO.prototype, "i2cConfig");
    this.i2cWrite = sandbox.spy(IO.prototype, "i2cWrite");
    this.i2cRead = sandbox.spy(IO.prototype, "i2cRead");

    this.board = new Board({
      io: new IO()
    });

    this.opts = {
      board: this.board,
    };

    this.receiver = new Receiver(this.opts);
    this.i2cReadHandler = this.i2cRead.lastCall.args[2];
    this.handler = sandbox.spy();

    done();
  },

  tearDown: function(done) {
    sandbox.restore();
    done();
  },

  emitter: function(test) {
    test.expect(1);
    test.ok(this.receiver instanceof Emitter);
    test.done();
  },

  length: function(test) {
    test.expect(2);
    test.notEqual(typeof this.receiver.length, "undefined");
    test.equal(typeof this.receiver.length, "number");
    test.done();
  },

  defaultInstanceProperties: function(test) {
    test.expect(7);

    this.receiver = new Receiver(this.opts);

    // Defaults to 6 Channels

    test.equal(this.receiver.length, 6);

    for (var i = 1; i <= 6; i++) {
      test.equal(i in this.receiver, true);
    }

    test.done();
  },

  explicitGreaterThanDefaultInstanceProperties: function(test) {
    test.expect(9);

    this.receiver = new Receiver({
      board: this.board,
      channels: 8,
    });

    test.equal(this.receiver.length, 8);

    for (var i = 1; i <= 8; i++) {
      test.equal(i in this.receiver, true);
    }

    test.done();
  },

  explicitLessThanDefaultInstanceProperties: function(test) {
    test.expect(5);

    this.receiver = new Receiver({
      board: this.board,
      channels: 4,
    });

    test.equal(this.receiver.length, 4);

    for (var i = 1; i <= 4; i++) {
      test.equal(i in this.receiver, true);
    }

    test.done();
  },

  /*
  | Address 1 (D10) |  Address 0 (D11) | Address |
  | --------------- |  --------------- | ------- |
  | 0               |  0               | 0x0A    |
  | 0               |  1               | 0x0B    |
  | 1               |  0               | 0x0C    |
  | 1               |  1               | 0x0D    |
  */

  i2cConfigDefaultAddress: function(test) {
    test.expect(1);
    test.equal(this.i2cConfig.lastCall.args[0].address, 0x0A);
    test.done();
  },

  i2cConfigDefaultForwarding: function(test) {
    test.expect(2);

    test.equal(this.i2cConfig.callCount, 1);
    test.deepEqual(this.i2cConfig.lastCall.args[0], Object.assign({}, this.opts, {address: 0x0A}));
    test.done();
  },

  i2cConfigExplicitAddress: function(test) {
    test.expect(2);

    this.i2cConfig.reset();

    var opts = {
      board: this.board,
      address: 0x01
    };

    this.receiver = new Receiver(opts);

    test.equal(this.i2cConfig.callCount, 1);
    test.deepEqual(this.i2cConfig.lastCall.args[0], opts);
    test.done();
  },

  i2cWriteCalledToReset: function(test) {
    test.expect(3);
    test.equal(this.i2cWrite.callCount, 1);
    test.equal(this.i2cWrite.lastCall.args[0], 0x0A);
    test.equal(this.i2cWrite.lastCall.args[1], 0x01);
    test.done();
  },

  i2cReadDefaultAddressAndChannels: function(test) {
    test.expect(3);
    test.equal(this.i2cRead.callCount, 1);
    test.equal(this.i2cRead.lastCall.args[0], 0x0A);
    test.equal(this.i2cRead.lastCall.args[1], 12);
    test.done();
  },

  i2cReadExplicitAddress: function(test) {
    test.expect(3);

    this.i2cRead.reset();

    this.receiver = new Receiver({
      board: this.board,
      address: 0x01
    });

    test.equal(this.i2cRead.callCount, 1);
    test.equal(this.i2cRead.lastCall.args[0], 0x01);
    test.equal(this.i2cRead.lastCall.args[1], 12);
    test.done();
  },

  i2cReadExplicitChannels: function(test) {
    test.expect(3);

    this.i2cRead.reset();

    this.receiver = new Receiver({
      board: this.board,
      channels: 8,
    });

    test.equal(this.i2cRead.callCount, 1);
    test.equal(this.i2cRead.lastCall.args[0], 0x0A);
    test.equal(this.i2cRead.lastCall.args[1], 16);
    test.done();
  },

  i2cReadExplicitAddressAndChannels: function(test) {
    test.expect(3);

    this.i2cRead.reset();

    this.receiver = new Receiver({
      board: this.board,
      address: 0x01,
      channels: 8,
    });

    test.equal(this.i2cRead.callCount, 1);
    test.equal(this.i2cRead.lastCall.args[0], 0x01);
    test.equal(this.i2cRead.lastCall.args[1], 16);
    test.done();
  },

  data: function(test) {
    test.expect(1);

    this.receiver.on("data", this.handler);

    captures.forEach(this.i2cReadHandler, this.receiver);

    test.equal(this.handler.callCount, captures.length);
    test.done();
  },

  change: function(test) {
    test.expect(21);

    this.receiver.on("change", this.handler);

    captures.forEach(this.i2cReadHandler, this.receiver);

    var expecting = [
      [ { which: "throttle", value: 1464, previous: 0, channel: 1 } ],
      [ { which: "aileron", value: 1496, previous: 0, channel: 2 } ],
      [ { which: "elevator", value: 1492, previous: 0, channel: 3 } ],
      [ { which: "rudder", value: 1488, previous: 0, channel: 4 } ],
      [ { which: "gear", value: 1924, previous: 0, channel: 5 } ],
      [ { which: "aux1", value: 1492, previous: 0, channel: 6 } ],
      [ { which: "throttle", value: 1468, previous: 1464, channel: 1 } ],
      [ { which: "aileron", value: 1492, previous: 1496, channel: 2 } ],
      [ { which: "rudder", value: 1492, previous: 1488, channel: 4 } ],
      [ { which: "gear", value: 1928, previous: 1924, channel: 5 } ],
      [ { which: "throttle", value: 1376, previous: 1468, channel: 1 } ],
      [ { which: "elevator", value: 1496, previous: 1492, channel: 3 } ],
      [ { which: "gear", value: 1924, previous: 1928, channel: 5 } ],
      [ { which: "throttle", value: 1348, previous: 1376, channel: 1 } ],
      [ { which: "elevator", value: 1492, previous: 1496, channel: 3 } ],
      [ { which: "rudder", value: 1488, previous: 1492, channel: 4 } ],
      [ { which: "gear", value: 1928, previous: 1924, channel: 5 } ],
      [ { which: "throttle", value: 1272, previous: 1348, channel: 1 } ],
      [ { which: "elevator", value: 1496, previous: 1492, channel: 3 } ],
      [ { which: "gear", value: 1924, previous: 1928, channel: 5 } ],
    ];

    test.equal(this.handler.callCount, expecting.length);

    expecting.forEach(function(args, index) {
      test.deepEqual(this.handler.getCall(index).args, expecting[index]);
    }, this);

    test.done();
  },


  "Receiver.prototype.channel(channel|name)": {

    notZeroIndexed: function(test) {
      test.expect(2);

      captures.forEach(this.i2cReadHandler, this.receiver);

      test.equal(this.receiver.channel(-1), undefined);
      test.equal(this.receiver.channel(0), undefined);
      test.done();
    },

    returnsChannelValueByChannelNumber: function(test) {
      test.expect(6);

      captures.forEach(this.i2cReadHandler, this.receiver);

      test.deepEqual(this.receiver.channel(1), { name: "throttle", value: 1272, previous: 1348 });
      test.deepEqual(this.receiver.channel(2), { name: "aileron", value: 1492, previous: 1492 });
      test.deepEqual(this.receiver.channel(3), { name: "elevator", value: 1496, previous: 1492 });
      test.deepEqual(this.receiver.channel(4), { name: "rudder", value: 1488, previous: 1488 });
      test.deepEqual(this.receiver.channel(5), { name: "gear", value: 1924, previous: 1928 });
      test.deepEqual(this.receiver.channel(6), { name: "aux1", value: 1492, previous: 1492 });

      test.done();
    },

    returnsChannelValueByChannelName: function(test) {
      test.expect(6);

      captures.forEach(this.i2cReadHandler, this.receiver);

      test.deepEqual(
        this.receiver.channel("throttle"),
        { name: "throttle", value: 1272, previous: 1348 }
      );
      test.deepEqual(
        this.receiver.channel("aileron"),
        { name: "aileron", value: 1492, previous: 1492 }
      );
      test.deepEqual(
        this.receiver.channel("elevator"),
        { name: "elevator", value: 1496, previous: 1492 }
      );
      test.deepEqual(
        this.receiver.channel("rudder"),
        { name: "rudder", value: 1488, previous: 1488 }
      );
      test.deepEqual(
        this.receiver.channel("gear"),
        { name: "gear", value: 1924, previous: 1928 }
      );
      test.deepEqual(
        this.receiver.channel("aux1"),
        { name: "aux1", value: 1492, previous: 1492 }
      );

      test.done();
    },
  },

  "Receiver.prototype.channelAt(index)": {
    returnsChannelValueByIndex: function(test) {
      test.expect(6);

      captures.forEach(this.i2cReadHandler, this.receiver);

      test.deepEqual(this.receiver.channelAt(0), { name: "throttle", value: 1272, previous: 1348 });
      test.deepEqual(this.receiver.channelAt(1), { name: "aileron", value: 1492, previous: 1492 });
      test.deepEqual(this.receiver.channelAt(2), { name: "elevator", value: 1496, previous: 1492 });
      test.deepEqual(this.receiver.channelAt(3), { name: "rudder", value: 1488, previous: 1488 });
      test.deepEqual(this.receiver.channelAt(4), { name: "gear", value: 1924, previous: 1928 });
      test.deepEqual(this.receiver.channelAt(5), { name: "aux1", value: 1492, previous: 1492 });


      test.done();
    },
  },
};
