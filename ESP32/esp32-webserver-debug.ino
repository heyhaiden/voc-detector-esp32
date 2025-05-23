/****************************************************************************************************************************
  ESP32_BME680_ButtonWebSocket.ino
  Single‐file sketch for ESP32 that:
    • Connects to Wi-Fi (via WiFiMulti)
    • Hosts a WebSocket server on port 8080 (WebSocketsServer_Generic)
    • Initializes BME680 over I²C
    • On hardware button press, reads temperature, humidity, pressure, gas resistance
    • Broadcasts a JSON payload to all connected WS clients

  Dependencies:
    • WebSockets_Generic (Links2004/arduinoWebSockets with ESP32 support)
    • Adafruit_BME680
    • WiFi, Wire
*****************************************************************************************************************************/

// Ensure this is only compiled for ESP32
#if !defined(ARDUINO_ARCH_ESP32)
  #error "This code requires an ESP32 board!"
#endif

#define _WEBSOCKETS_LOGLEVEL_ 2

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WebSocketsServer_Generic.h>
#include <Adafruit_BME680.h>
#include "secrets.h"   // defines WIFI_SSID and WIFI_PASS

// —— Configuration ——  
#define WS_PORT     8080
#define BUTTON_PIN  33        // hardware button for triggering reading

// —— Globals ——  
WiFiMulti         wifiMulti;
WebSocketsServer  webSocket(WS_PORT);
Adafruit_BME680   bme(&Wire);

volatile bool buttonPressed = false;

// —— Button ISR ——  
void IRAM_ATTR onButton() {
  buttonPressed = true;
}

// —— WebSocket Event Handler ——  
void webSocketEvent(const uint8_t &num,
                    const WStype_t &type,
                    uint8_t * payload,
                    const size_t &length) {
  if (type == WStype_CONNECTED) {
    IPAddress ip = webSocket.remoteIP(num);
    Serial.printf("[WS %u] Connected from %u.%u.%u.%u\n",
                  num, ip[0], ip[1], ip[2], ip[3]);
    webSocket.sendTXT(num, "Connected to ESP32 BME680 server");
  }
  else if (type == WStype_DISCONNECTED) {
    Serial.printf("[WS %u] Disconnected\n", num);
  }
}

// —— Initialize Wi-Fi ——  
void initWiFi() {
  Serial.print("Connecting to Wi-Fi ");
  wifiMulti.addAP(WIFI_SSID, WIFI_PASS);
  while (wifiMulti.run() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.printf("\nWi-Fi connected, IP=%s\n", WiFi.localIP().toString().c_str());
}

// —— Initialize BME680 Sensor ——  
void initSensor() {
  Wire.begin();

  if (!bme.begin(0x76)) {
    Serial.println("ERROR: BME680 not found at 0x76!");
    while (1) delay(1000);
  }
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling   (BME680_OS_8X);
  bme.setPressureOversampling   (BME680_OS_4X);
  bme.setIIRFilterSize          (BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320°C for 150 ms

  Serial.println("BME680 initialized");
}

// —— Initialize WebSocket ——  
void initWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.printf("WebSocket server started on port %d\n", WS_PORT);
}

// —— Arduino setup() ——  
void setup() {
  Serial.begin(9600);
  delay(100);

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN),
                  onButton, FALLING);

  initWiFi();
  initSensor();
  initWebSocket();

  Serial.printf("Button attached on GPIO %d (press to broadcast reading)\n", BUTTON_PIN);
}

// —— Arduino loop() ——  
void loop() {
  // Maintain WebSocket connections
  webSocket.loop();

  // On button press, read sensor and broadcast JSON
  if (buttonPressed) {
    buttonPressed = false;

    // Trigger a forced reading
    if (!bme.beginReading()) {
      Serial.println("ERROR: BME680 beginReading() failed");
    } else {
      delay(250);  // wait for heater + conversion
      if (!bme.endReading()) {
        Serial.println("ERROR: BME680 endReading() failed");
      } else {
        // Read sensor values
        float T = bme.temperature;
        float H = bme.humidity;
        float P = bme.pressure / 100.0f;     // hPa
        float G = bme.gas_resistance / 1000.0f; // kΩ

        // Build JSON payload
        char buf[128];
        int len = snprintf(buf, sizeof(buf),
          "{\"temperature\":%.2f,\"humidity\":%.2f,"
          "\"pressure\":%.2f,\"gas_kOhm\":%.2f}",
          T, H, P, G
        );
        if (len > 0 && len < (int)sizeof(buf)) {
          webSocket.broadcastTXT(buf);
          Serial.printf("Broadcast: %s\n", buf);
        } else {
          Serial.println("ERROR: JSON buffer overflow");
        }
      }
    }
  }

  delay(10);  // small yield
}
