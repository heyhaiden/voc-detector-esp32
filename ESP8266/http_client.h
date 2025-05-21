// http_client.hpp
#pragma once
#include <ESP8266WebServer.h>
#include "BME680Sensor.h"
#include <ArduinoJson.h>

class WebServerModule {
public:
  WebServerModule(uint16_t port = 80);

  // must call after WiFiManager.connect()
  void begin();

  // register sensor pointer to fetch data on demand
  void attachSensor(Sensor* sensorPtr);

  // call inside your loop()
  void handleClient();

private:
  ESP8266WebServer _server;
  Sensor* _sensor = nullptr;

  void handleRoot();
  void handleData();
};
