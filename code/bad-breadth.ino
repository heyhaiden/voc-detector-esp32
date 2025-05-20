#include <Arduino.h>
#include "BME680Sensor.h"

BME680Sensor sensor;

void setup() {
  Serial.begin(9600);
  delay(1000);

  sensor.init();

  // Serial Plotter header
  Serial.println("Temp (°C),Humidity (%),Pressure (hPa),Gas Raw (kΩ),Gas Smoothed (kΩ)");
}

void loop() {
  sensor.readAndPrintData();
  delay(10000); // Read every 10 seconds
}
