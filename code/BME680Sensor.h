#pragma once
#include <Adafruit_BME680.h>
#include <Wire.h>

struct SensorReading {
  float temperature;
  float humidity;
  float pressure;
  float voc;      // raw gas resistance
  float vocSmooth; // EMA
};

class Sensor {
public:
  bool begin(uint8_t i2c_addr = 0x76);
  SensorReading takeReading();

  // EMA smoothing factor (0–1). Public so you can tune at runtime if needed.
  float smoothingAlpha = 0.1;

private:
  Adafruit_BME680 _bme{&Wire};
  float _vocEMA = 0.0f;

  void initBSECPlaceholder();  
};
