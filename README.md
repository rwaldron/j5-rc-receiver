# Receiver

[![Build Status](https://travis-ci.org/rwaldron/j5-rc-receiver.svg?branch=master)](https://travis-ci.org/rwaldron/j5-rc-receiver)

RC Receiver component plugin for [Johnny-Five](https://github.com/rwaldron/johnny-five).

- ["rc receiver" @ Amazon.com](http://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=rc+receiver)
- ["rc transmitter" @ Amazon.com](http://www.amazon.com/s/ref=nb_sb_noss_1?url=search-alias%3Daps&field-keywords=rc+transmitter)


## API & Documentation

### Receiver 

The `Receiver` class constructs objects that represent a single RC Receiver component.

```js
var receiver = new Receiver();

receiver.on("change", function() {
  console.log(this.x, this.y);
});
```

#### Options

| Property   | Type      | Value(s)/Description        | Default | Required |
|------------|-----------|---------------------------- |---------|----------|
| address    | number    | Address for I2C device \*   | `0x0A`  | no       |
| channels   | number    | Number of channels          | 6       | no       |
| channels   | array     | Array of channel names \*\* | \*\*    | no       |


```js
// Example of explicitly specified address
var receiver = new Receiver({
  address: 0x04
});
```

\* The I2C address defaults to `0x0A`, however digital pins 10 & 11 can be used to configure the address, according to the following table: 

| D11 | D12 | Address |
| --- | --- | ------- |
| 0   | 0   | 0x0A    |
| 0   | 1   | 0x0B    |
| 1   | 0   | 0x0C    |
| 1   | 1   | 0x0D    |


\*\* The built-in channel names are derived from the most commonly used names in the most common order: 

1. `throttle`
2. `aileron`
3. `elevator`
4. `rudder`
5. `gear`
6. `aux1`
7. `aux2`
8. `aux3`

When `channels: [...]` are specified, the length is used to set the channel count and the names provided are used to override the above listed names.


#### Properties

| Property | Type      | Value(s)/Description      |
|----------|-----------|---------------------------|
| 1-n      | number    | Each channel value is accessible via numeric channel property. These are NOT zero-indexed|


#### Iterable/Iterator Protocol

For code running in Node.js 4.2.x or newer, `Receiver` objects implement the [Iterable Protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable).

```js
var receiver = new Receiver();

// Create a zero-indexed array of receiver's current values:
var array = Array.from(receiver);
```

#### Events

- **change** Fired whenever any channel value changes.
- **change:[name]** Fired whenever the channel matching `[name]` changes.
  ```js
  receiver.on("change", function(change) {
    console.log("Channel(%d): %d", change.channel, change.value);
  });
  ```
  
  ```js
  receiver.on("change:throttle", function(change) {
    console.log("Throttle: %d", change.value);
  });
  ```

- **data** Fired as frequently as the hardware can be read.


## Backpack Controller

### Install Firmware

Using the Arduino IDE, install the [firmware](https://github.com/rwaldron/j5-rc-receiver/blob/master/firmware/rc_receiver_slave.ino) to your AVR based microcontroller of choice. 

### Assembly

![RC Receiver, I2C Nano Backpack](https://github.com/rwaldron/j5-rc-receiver/blob/master/assets/rc-receiver-backpack.png)


## Connect To I2C Capable Platform

### Arduino UNO

[![RC Receiver, I2C Nano Backpack + Arduino Uno](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-arduino.png)](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-arduino.png)

```js
var five = require("johnny-five");
var Receiver = require("j5-rc-receiver")(five);
var board = new five.Board();

board.on("ready", function() {
  var receiver = new Receiver();

  receiver.on("change", function(change) {
    console.log("Channel(%d): %d", change.channel, change.value);
  });
});
```

### Tessel 2

[![RC Receiver, I2C Nano Backpack + Tessel 2](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-tessel-small.png)](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-tessel.png)

[![RC Receiver, I2C Mini Backpack + Tessel 2](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-tessel-mini-small.png)](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-tessel-mini.png)

```js
var five = require("johnny-five");
var Receiver = require("j5-rc-receiver")(five);
var Tessel = require("tessel-io");
var board = new five.Board({
  io: new Tessel()
});

board.on("ready", function() {
  var receiver = new Receiver({
    // Tessel-IO allow omitting the bus when using Port A, 
    // but for illustrative purposes, we specify it here...
    bus: "A"
  });

  receiver.on("change", function(change) {
    console.log("Channel(%d): %d", change.channel, change.value);
  });
});
```

### Intel Edison MiniBoard

[![RC Receiver, I2C Mini Backpack + Intel Edison MiniBoard](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-edison-mini-small.png)](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-edison-mini.png)

### Intel Edison Arduino Board

[![RC Receiver, I2C Nano Backpack + Intel Edison Arduino Board](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-edison-arduino-small.png)](https://raw.githubusercontent.com/rwaldron/j5-rc-receiver/master/assets/rc-receiver-backpack-edison-arduino.png)


```js
var five = require("johnny-five");
var Receiver = require("j5-rc-receiver")(five);
var Edison = require("edison-io");
var board = new five.Board({
  io: new Edison()
});

board.on("ready", function() {
  var receiver = new Receiver();

  receiver.on("pointermove", function() {
    console.log({ x: this.x, y: this.y });
  });
});
```

## Flight Simulator

Coming soon?


## NOTE

The examples shown here are provided for illustration and do no specifically indicate platform support. This component class is expected to work with any platform that has I2C support. 
