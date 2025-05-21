#include "BME680Sensor.h"
#include <Arduino.h>

bool Sensor::begin(uint8_t i2c_addr) {
  Wire.begin();  
  if (!_bme.begin(i2c_addr)) {
    Serial.println("ERROR: BME680 not found at I²C");
    return false;
  }
  // basic oversampling/filter setup
  _bme.setTemperatureOversampling(BME680_OS_8X);
  _bme.setHumidityOversampling   (BME680_OS_8X);
  _bme.setPressureOversampling   (BME680_OS_4X);
  _bme.setIIRFilterSize          (BME680_FILTER_SIZE_3);
  _bme.setGasHeater(320, 150); // 320°C @ 150 ms
  
  initBSECPlaceholder();
  return true;
}

void Sensor::initBSECPlaceholder() {
  // TODO: hook in Bosch BSEC AI initialization here
  // e.g. load state, set sample rate, config profile, etc.
}

SensorReading Sensor::takeReading() {
  SensorReading out{};
  
  if (!_bme.beginReading()) {
    Serial.println("ERROR: failed to start BME read");
    return out;
  }
  delay(200);  // match gas heater duration + conversion time
  if (!_bme.endReading()) {
    Serial.println("ERROR: failed to complete BME read");
    return out;
  }

  out.temperature = _bme.temperature;
  out.humidity    = _bme.humidity;
  out.pressure    = _bme.pressure / 100.0;      // hPa
  out.voc         = _bme.gas_resistance / 1000.0; // kΩ

  // EMA smoothing
  if (_vocEMA == 0.0f) {
    _vocEMA = out.voc;
  } else {
    _vocEMA = out.voc * smoothingAlpha + _vocEMA * (1.0f - smoothingAlpha);
  }
  out.vocSmooth = _vocEMA;

  return out;
}