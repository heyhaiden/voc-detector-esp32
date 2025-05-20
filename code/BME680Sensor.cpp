#include "BME680Sensor.h"

void BME680Sensor::init() {
  Wire.begin();

  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME680 sensor, check wiring!");
    while (1); // Halt execution
  }

  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_8X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // Heater: 320°C for 150ms

  Serial.println("BME680 initialized");
}

void BME680Sensor::readAndPrintData() {
  if (!bme.beginReading()) {
    Serial.println("Failed to begin reading");
    return;
  }

  delay(200); // Wait for reading to finish
  if (!bme.endReading()) {
    Serial.println("Failed to complete reading");
    return;
  }

  float temperature = bme.temperature;
  float humidity = bme.humidity;
  float pressure = bme.pressure / 100.0;
  float gas_kOhm = bme.gas_resistance / 1000.0;

  // Exponential Moving Average (EMA)
  if (gasEMA == 0) {
    gasEMA = gas_kOhm;
  } else {
    gasEMA = (smoothingAlpha * gas_kOhm) + ((1.0 - smoothingAlpha) * gasEMA);
  }

  // Output as CSV for Serial Plotter
  Serial.print("T:");
  Serial.print(temperature);
  Serial.print(",");
  Serial.print("H:");
  Serial.print(humidity);
  Serial.print(",");
  Serial.print("P:");    
  Serial.print(pressure); 
  Serial.print(",");
  Serial.print("G_RAW:");   
  Serial.print(gas_kOhm); 
  Serial.print(",");   
  Serial.print("G_AVG:");
  Serial.println(gasEMA);
}
