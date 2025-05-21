// wifi_manager.h
#pragma once
#include <Arduino.h> 

class WiFiManager {
public:
  // blocks until connected (with simple retry)
  void connect(const char* ssid, const char* pass, uint8_t maxRetries = 20);
};
