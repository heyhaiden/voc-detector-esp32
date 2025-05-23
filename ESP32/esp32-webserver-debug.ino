/****************************************************************************************************************************
  ESP32_BME680_ButtonWebSocket.ino
  Single‐file sketch for ESP32 that:
    • Connects to Wi-Fi (via WiFiMulti)
    • Hosts a WebSocket server on port 8080 (WebSocketsServer_Generic)
    • Initializes BME680 over I²C
    • On hardware button press **or** remote “start” message, runs a 3-2-1 countdown with buzzer,
      then performs a 3 s continuous sampling window (buzzer on), averages the results,
      and broadcasts a single JSON payload with keys:
        temperature, humidity, pressure, gas_kOhm

  Dependencies:
    • WebSockets_Generic (Links2004/arduinoWebSockets with ESP32 support)
    • Adafruit_BME680
    • WiFi, Wire, WiFiMulti
****************************************************************************************************************************/

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
#define BUTTON_PIN  33    // hardware button for triggering reading
#define BUZZER_PIN  27    // active buzzer signal pin

// —— Globals ——  
WiFiMulti         wifiMulti;
WebSocketsServer  webSocket(WS_PORT);
Adafruit_BME680   bme(&Wire);

volatile bool buttonPressed    = false;
volatile bool readingRequested = false;

// —— Button ISR ——  
void IRAM_ATTR onButton() {
  buttonPressed = true;
}

// —— WebSocket Event Handler ——  
void webSocketEvent(const uint8_t &num,
                    const WStype_t &type,
                    uint8_t * payload,
                    const size_t &length) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS %u] Connected from %u.%u.%u.%u\n",
                    num, ip[0], ip[1], ip[2], ip[3]);
      webSocket.sendTXT(num, "Connected to ESP32 BME680 server");
      break;
    }
    case WStype_DISCONNECTED:
      Serial.printf("[WS %u] Disconnected\n", num);
      break;
    case WStype_TEXT: {
      // Null-terminate and parse the incoming text
      payload[length] = '\0';
      String msg = (char*)payload;
      if (msg.equalsIgnoreCase("start")) {
        Serial.println("▶ WS start command received");
        readingRequested = true;
      }
      break;
    }
    default:
      break;
  }
}

// —— Initialize Wi-Fi ——  
void initWiFi() {
  Serial.print("Connecting to Wi-Fi");
  wifiMulti.addAP(WIFI_SSID, WIFI_PASS);
  while (wifiMulti.run() != WL_CONNECTED) {
    Serial.print('.');
    delay(500);
  }
  Serial.printf("\nWi-Fi connected, IP=%s\n",
                WiFi.localIP().toString().c_str());
}

// —— Initialize BME680 Sensor ——  
void initSensor() {
  Wire.begin();  // use default SDA/SCL pins

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

// —— Initialize WebSocket Server ——  
void initWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.printf("WebSocket server started on port %d\n", WS_PORT);
}

// —— Arduino setup() ——  
void setup() {
  Serial.begin(9600);
  delay(100);

  // Button setup
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN),
                  onButton, FALLING);

  // Buzzer setup
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  initWiFi();
  initSensor();
  initWebSocket();

  Serial.printf("Button on GPIO %d, Buzzer on GPIO %d\n",
                BUTTON_PIN, BUZZER_PIN);
}

// —— Arduino loop() ——  
void loop() {
  // Service WebSocket
  webSocket.loop();

  // If either hardware button or remote command triggered…
  if (buttonPressed || readingRequested) {
    buttonPressed    = false;
    readingRequested = false;

    Serial.println("\n--- Reading Triggered ---");
    delay(500);

    // 3-2-1 countdown with buzzer blips
    for (int i = 3; i >= 1; --i) {
      Serial.printf("Countdown: %d\n", i);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);         // beep duration
      digitalWrite(BUZZER_PIN, LOW);
      if (i > 1) {
        delay(800);       // silence to complete 1 s total per count
      }
    }

    delay(800);

    Serial.println("Sampling for 3 seconds…");
    digitalWrite(BUZZER_PIN, HIGH);

    // 3 s averaging window
    unsigned long start    = millis();
    uint16_t      samples  = 0;
    double        sumT = 0, sumH = 0, sumP = 0, sumG = 0;

    while (millis() - start < 3000) {
      if (!bme.beginReading()) {
        Serial.println("ERROR: beginReading() failed");
        break;
      }
      delay(250); // heater + conversion
      if (!bme.endReading()) {
        Serial.println("ERROR: endReading() failed");
        break;
      }
      sumT += bme.temperature;
      sumH += bme.humidity;
      sumP += bme.pressure    / 100.0;   // hPa
      sumG += bme.gas_resistance / 1000.0; // kΩ
      samples++;
      delay(50);
    }

    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("Sampling done; buzzer off.");

    // Compute averages
    double avgT = samples ? (sumT/samples) : 0;
    double avgH = samples ? (sumH/samples) : 0;
    double avgP = samples ? (sumP/samples) : 0;
    double avgG = samples ? (sumG/samples) : 0;

    Serial.printf("Avg T:%.2f°C H:%.2f%% P:%.2f hPa G:%.2f kΩ (%u samples)\n",
                  avgT, avgH, avgP, avgG, samples);

    // Build JSON payload using the same keys as before
    char json[128];
    int n = snprintf(json, sizeof(json),
      "{\"temperature\":%.2f,\"humidity\":%.2f,"
      "\"pressure\":%.2f,\"gas_kOhm\":%.2f}",
      avgT, avgH, avgP, avgG
    );

    if (n > 0 && n < (int)sizeof(json)) {
      webSocket.broadcastTXT(json);
      Serial.printf("Broadcast: %s\n", json);
    } else {
      Serial.println("ERROR: JSON buffer overflow");
    }
  }

  delay(10);
}
