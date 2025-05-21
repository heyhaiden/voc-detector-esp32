#include <Arduino.h>
#include "secrets.h"         
#include "BME680Sensor.h"
#include "wifi_manager.h"
#include "http_client.h"

Sensor sensor;
WiFiManager wifiMgr;
WebServerModule webSrv(80);

void setup() {
  Serial.begin(9600);
  delay(500);
  Serial.println("\n=== BOOT ===");
  
  // 1. Sensor init
  Serial.print("1) Initializing BME680 sensor… ");
  if (!sensor.begin()) {
    Serial.println("❌ FAILED");
    while (true) {
      Serial.println("HALTED: sensor.begin() failed");
      delay(2000);
    }
  }
  Serial.println("✅ OK");

  // 2. Wi-Fi connect
  Serial.print("2) Connecting to Wi-Fi \""  );
  Serial.print(WIFI_SSID);
  Serial.print("\" … ");
  wifiMgr.connect(WIFI_SSID, WIFI_PASS);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("✅");
    Serial.print("   IP Address: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("❌");
    Serial.println("   Wi-Fi not connected—check SSID/PASS and signal.");
  }

  // 3. Attach sensor & start server
  Serial.println("3) Attaching sensor to web server");
  webSrv.attachSensor(&sensor);
  Serial.println("   Sensor attached");

  Serial.print("4) Starting HTTP server on port 80… ");
  webSrv.begin();
  Serial.println("✅");

  Serial.println("5) SETUP COMPLETE\n");
}

void loop() {
  Serial.println("loop(): handling client…");
  webSrv.handleClient();
  Serial.println("loop(): done");
  delay(500);  // throttle logs so you can read them
}