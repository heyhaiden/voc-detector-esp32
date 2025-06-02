
/****************************************************************************************************************************
  ESP32_BME680_ButtonWebSocket.ino — Final with BSEC Persistence and Non-blocking Sampling
  • ESP32 with BSEC library over I²C
  • Wi-Fi via WiFiMulti
  • GenericWebSocketServer on port 8080
  • Button on GPIO 33, buzzer on GPIO 27
  • Non-blocking 3-2-1 countdown then 10 s capture of continuous BSEC output
  • BSEC state loaded/saved via NVS Preferences every 360 minutes, or first accuracy event
****************************************************************************************************************************/

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <WebSocketsServer_Generic.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "bsec.h"
#include "secrets.h"    // defines WIFI_SSID and WIFI_PASS

#if !defined(ARDUINO_ARCH_ESP32)
  #error "Requires ESP32!"
#endif

#define _WEBSOCKETS_LOGLEVEL_ 2
#define WS_PORT            8080
#define BUTTON_PIN         33
#define BUZZER_PIN         27

// How often to persist BSEC state: 360 minutes
const uint32_t STATE_SAVE_PERIOD = 360UL * 60UL * 1000UL;

// — Persistent storage for BSEC state —
Preferences      prefs;
uint8_t          bsecState[BSEC_MAX_STATE_BLOB_SIZE];
uint32_t         lastStateSaveMs  = 0;
uint16_t         stateUpdateCounter = 0;

// — BSEC config blob —
const uint8_t bsec_config_iaq[] = {
  #include "config/generic_33v_3s_4d/bsec_iaq.txt"
};

WiFiMulti        wifiMulti;
WebSocketsServer webSocket(WS_PORT);
Bsec             iaqSensor;

portMUX_TYPE     mux = portMUX_INITIALIZER_UNLOCKED;
volatile bool    buttonPressed    = false;
volatile bool    readingRequested = false;

// — Capture State Machine —
enum CaptureState : uint8_t {
  STATE_IDLE,
  STATE_COUNTDOWN,
  STATE_COUNTDOWN_BEEP,
  STATE_SAMPLING
};

CaptureState    captureState   = STATE_IDLE;
uint8_t         countdownStage = 0;
unsigned long   countdownNext  = 0;
unsigned long   beepEndTime    = 0;
unsigned long   samplingStart  = 0;
uint16_t        sampleCount    = 0;
float           sumIAQ, sumCO2, sumVOC, sumT, sumH, sumP, sumG;

// — Last reading for Serial dump —
unsigned long   lastReadMs    = 0;
float           lastIaq, lastIaqAcc,
                lastRawTemp, lastPressure,
                lastRawHum, lastGasRes,
                lastCompTemp, lastCompHum;

// Forward for status check
void checkIaqSensorStatus();

// ISR for button
void IRAM_ATTR onButton() {
  portENTER_CRITICAL_ISR(&mux);
    buttonPressed = true;
  portEXIT_CRITICAL_ISR(&mux);
}

// WebSocket event
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED: {
      IPAddress ip = webSocket.remoteIP(num);
      Serial.printf("[WS %u] Connected from %u.%u.%u.%u\n", num, ip[0], ip[1], ip[2], ip[3]);
      webSocket.sendTXT(num, "Connected to ESP32 BSEC server");
      break;
    }
    case WStype_DISCONNECTED:
      Serial.printf("[WS %u] Disconnected\n", num);
      break;
    case WStype_TEXT: {
      char msgBuf[length+1]; memcpy(msgBuf, payload, length); msgBuf[length]='\0';
      if (String(msgBuf).equalsIgnoreCase("start")) {
        portENTER_CRITICAL(&mux);
          readingRequested = true;
        portEXIT_CRITICAL(&mux);
        Serial.println("▶ WS start command received");
      }
      break;
    }
    default: break;
  }
}

// Load saved BSEC state from NVS
void loadState() {
  size_t len = prefs.getBytes("state", bsecState, sizeof(bsecState));
  if (len == sizeof(bsecState)) {
    Serial.println("Restoring BSEC state from NVS");
    iaqSensor.setState(bsecState);
    checkIaqSensorStatus();
  } else {
    Serial.println("No valid BSEC state, starting fresh burn-in");
  }
}

// Periodically save BSEC state to NVS
void updateState() {
  bool doSave = false;
  if (stateUpdateCounter == 0) {
    if (iaqSensor.iaqAccuracy >= 1) {
      doSave = true;
      stateUpdateCounter++;
    }
  } else if ((millis() - lastStateSaveMs) >= STATE_SAVE_PERIOD) {
    doSave = true;
    stateUpdateCounter++;
  }
  if (doSave) {
    iaqSensor.getState(bsecState);
    prefs.putBytes("state", bsecState, sizeof(bsecState));
    lastStateSaveMs = millis();
    Serial.println("Saved BSEC state to NVS");
  }
}

// Ensure BSEC reports OK
void checkIaqSensorStatus() {
  if (iaqSensor.bsecStatus != BSEC_OK) {
    Serial.printf("BSEC error: %d\n", iaqSensor.bsecStatus);
    while (1);
  }
  if (iaqSensor.bme68xStatus != BME68X_OK) {
    Serial.printf("BME68x error: %d\n", iaqSensor.bme68xStatus);
    while (1);
  }
}

// WiFi init
void initWiFi() {
  Serial.print("Connecting to Wi-Fi");
  wifiMulti.addAP(WIFI_SSID, WIFI_PASS);
  while (wifiMulti.run() != WL_CONNECTED) { Serial.print('.'); delay(500);}  
  Serial.printf("\nWi-Fi connected, IP=%s\n", WiFi.localIP().toString().c_str());
}

// Sensor init
void initSensor() {
  iaqSensor.begin(BME68X_I2C_ADDR_LOW, Wire);
  iaqSensor.setConfig(bsec_config_iaq);

  prefs.begin("bsec", false);
  loadState();

  bsec_virtual_sensor_t sensors[] = {
    BSEC_OUTPUT_IAQ,
    BSEC_OUTPUT_STATIC_IAQ,
    BSEC_OUTPUT_CO2_EQUIVALENT,
    BSEC_OUTPUT_BREATH_VOC_EQUIVALENT,
    BSEC_OUTPUT_RAW_TEMPERATURE,
    BSEC_OUTPUT_RAW_PRESSURE,
    BSEC_OUTPUT_RAW_HUMIDITY,
    BSEC_OUTPUT_RAW_GAS,
    BSEC_OUTPUT_STABILIZATION_STATUS,
    BSEC_OUTPUT_RUN_IN_STATUS,
    BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_TEMPERATURE,
    BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_HUMIDITY,
    BSEC_OUTPUT_GAS_PERCENTAGE
  };
  iaqSensor.updateSubscription(sensors, sizeof(sensors)/sizeof(sensors[0]), BSEC_SAMPLE_RATE_LP);
  Serial.println("BSEC sensor initialized");
}

// WebSocket init
void initWebSocket() {
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.printf("WebSocket server started on port %d\n", WS_PORT);
}

void setup() {
  Serial.begin(9600);
  delay(100);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButton, FALLING);
  pinMode(BUZZER_PIN, OUTPUT); digitalWrite(BUZZER_PIN, LOW);
  initWiFi();
  initSensor();
  initWebSocket();
  Serial.printf("Button GPIO=%d, Buzzer GPIO=%d\n", BUTTON_PIN, BUZZER_PIN);
}

void loop() {
  unsigned long now = millis();

  webSocket.loop();
  bool gotData = iaqSensor.run();
  if (gotData) updateState();

  if (gotData) {
    lastReadMs   = now;
    lastIaq      = iaqSensor.iaq;
    lastIaqAcc   = iaqSensor.iaqAccuracy;
    lastRawTemp  = iaqSensor.rawTemperature;
    lastPressure = iaqSensor.pressure / 100.0f;
    lastRawHum   = iaqSensor.rawHumidity;
    lastGasRes   = iaqSensor.gasResistance;
    lastCompTemp = iaqSensor.temperature;
    lastCompHum  = iaqSensor.humidity;
  }

  if (Serial.available()) {
    while (Serial.available()) Serial.read();
    Serial.println("Timestamp [ms], IAQ, IAQ accuracy, raw temp[°C], pressure [hPa], raw relative humidity [%], gas [Ohm], comp temp[°C], comp humidity [%]");
    String out = String(lastReadMs)+", "+String(lastIaq,2)+", "+String(lastIaqAcc)+", "+String(lastRawTemp,2)+", "+String(lastPressure,2)+", "+String(lastRawHum,2)+", "+String(lastGasRes)+", "+String(lastCompTemp,2)+", "+String(lastCompHum,2);
    Serial.println(out);
  }

  if (gotData && captureState == STATE_SAMPLING) {
    sumIAQ += iaqSensor.iaq;
    sumCO2 += iaqSensor.co2Equivalent;
    sumVOC += iaqSensor.breathVocEquivalent;
    sumT   += iaqSensor.temperature;
    sumH   += iaqSensor.humidity;
    sumP   += iaqSensor.pressure / 100.0f;
    sumG   += iaqSensor.gasResistance / 1000.0f;
    sampleCount++;
  }

  bool trigger = false;
  portENTER_CRITICAL(&mux);
    if (buttonPressed) { buttonPressed=false; trigger=true; }
    else if (readingRequested) { readingRequested=false; trigger=true; }
  portEXIT_CRITICAL(&mux);

  if (trigger && captureState == STATE_IDLE) {
    countdownStage=3; countdownNext=now; captureState=STATE_COUNTDOWN;
    Serial.println("\n--- Trigger received: starting countdown ---");
  }

  switch (captureState) {
    case STATE_COUNTDOWN:
      if (now>=countdownNext) {
        Serial.printf("Countdown: %u\n", countdownStage);
        digitalWrite(BUZZER_PIN,HIGH);
        beepEndTime=now+200; 
        captureState=STATE_COUNTDOWN_BEEP;
      }
      break;
    case STATE_COUNTDOWN_BEEP:
      if (now>=beepEndTime) {
        digitalWrite(BUZZER_PIN,LOW);
        if (--countdownStage>0) { countdownNext=now+800; captureState=STATE_COUNTDOWN; }
        else { 
          Serial.println("Collecting for 10 seconds...");
          samplingStart=now; sampleCount=0; sumIAQ=sumCO2=sumVOC=sumT=sumH=sumP=sumG=0.0f;
          captureState=STATE_SAMPLING;
        }
      }
      break;
    case STATE_SAMPLING:
      if (now-samplingStart>=10000) {
        digitalWrite(BUZZER_PIN,LOW);
        Serial.println("Sampling complete; computing averages...");
        float avgIAQ=sampleCount?sumIAQ/sampleCount:0;
        float avgCO2=sampleCount?sumCO2/sampleCount:0;
        float avgVOC=sampleCount?sumVOC/sampleCount:0;
        float avgT  =sampleCount?sumT  /sampleCount:0;
        float avgH  =sampleCount?sumH  /sampleCount:0;
        float avgP  =sampleCount?sumP  /sampleCount:0;
        float avgG  =sampleCount?sumG  /sampleCount:0;
        StaticJsonDocument<200> doc;
        doc["iaq"]=avgIAQ; doc["co2_eq"]=avgCO2; doc["voc_eq"]=avgVOC;
        doc["temp"]=avgT; doc["hum"]=avgH; doc["pres"]=avgP; doc["gas_kOhm"]=avgG;
        char buf[200]; size_t l=serializeJson(doc,buf);
        webSocket.broadcastTXT(buf,l);
        Serial.printf("Broadcast: %s\n",buf);
        captureState=STATE_IDLE;
      }
      break;
    case STATE_IDLE: default: break;
  }

  delay(5);
}
