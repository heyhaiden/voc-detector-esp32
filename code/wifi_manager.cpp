// wifi_manager.cpp
#include "wifi_manager.h"
#include <ESP8266WiFi.h>
#include <Arduino.h>

void WiFiManager::connect(const char* ssid, const char* pass, uint8_t maxRetries) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  Serial.printf("Connecting to WiFi \"%s\"", ssid);

  uint8_t tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < maxRetries) {
    delay(500);
    Serial.print(".");
    tries++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected, IP=%s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\nFAILED to connect WiFi");
    // could choose to reboot() or continue in AP mode
  }
}
