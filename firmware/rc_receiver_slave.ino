
#define EI_ARDUINO_INTERRUPTED_PIN
#include <EnableInterrupt.h>
#include <Wire.h>

#define DEBUG_MODE 1

// Address Pins
#define AD0 11
#define AD1 12

// I2C Defaults
#define I2C_DEFAULT_ADDRESS 0x0A
#define I2C_BUFFER_SIZE 16

byte buffer[I2C_BUFFER_SIZE];

int addressPins[] = { AD0, AD1 };
int address = I2C_DEFAULT_ADDRESS;
int first = 2;
int channels = 3;

volatile int pulses[8];
volatile int last_up[8];

void up() {
  uint8_t pin = arduinoInterruptedPin;

//  #if DEBUG_MODE
//    Serial.print("pin up: ");
//    Serial.println(pin);
//  #endif

  last_up[pin - first] = micros();
  enableInterrupt(pin, &down, FALLING);
}

void down() {
  uint8_t pin = arduinoInterruptedPin;

//  #if DEBUG_MODE
//    Serial.print("pin down: ");
//    Serial.println(pin);
//  #endif

  int diff = micros() - last_up[pin - first];

  if (diff > 500 && diff < 2500) {
    pulses[pin - first] = diff;
  }



  digitalWrite(pin, HIGH);
  enableInterrupt(pin, &up, RISING);

  #if DEBUG_MODE
    Serial.print(pin);
    Serial.print(": ");
    Serial.println(pulses[pin - first]);
  #endif
}

void resetState() {
  for (int i = first; i < first + channels; i++) {
    pulses[i - first] = 0;
    last_up[i - first] = 0;

    pinMode(i, INPUT);
    digitalWrite(i, HIGH);
    enableInterrupt(i, &up, RISING);
  }
}

void setup() {

  // First check if the address was set via pins 11 or 12
  int offset = 0;

  for (int i = 0; i < 2; i++) {
    pinMode(addressPins[i], INPUT);
    if (digitalRead(addressPins[i])) {
      offset |= 1 << i;
    }
  }

  address += offset;


  resetState();

  #if DEBUG_MODE
    Serial.begin(9600);
  #endif


  // Initialize Slave
  Wire.begin(address);
  Wire.onRequest(onRequest);
  Wire.onReceive(onReceive);
}

void loop() {
  for (int i = 0; i < channels; i++) {
    buffer[i * 2] = pulses[i] >> 8;
    buffer[i * 2 + 1] = pulses[i] & 0xFF;
  }
}

void onRequest() {
  Wire.write(buffer, I2C_BUFFER_SIZE);
}

void onReceive(int count) {
  while (Wire.available()) {
    // Command 0x01 => Reset.
    if (Wire.read() == 0x01) {
      Serial.println("RESET");
      resetState();
    }
  }
}

