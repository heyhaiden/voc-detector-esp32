#pragma once
#include <Adafruit_BME680.h>
#include <Wire.h>

class BME680Sensor {
public:
  void init();
  void readAndPrintData();

private:
  Adafruit_BME680 bme;
  float gasEMA = 0.0;
  const float smoothingAlpha = 0.1; // EMA smoothing constant
};
