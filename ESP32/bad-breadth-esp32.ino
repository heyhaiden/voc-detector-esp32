// Button-triggered BME680 reading with passive buzzer cadence

#include <Wire.h>
#include <Adafruit_BME680.h>

#define BUTTON_PIN 33   // NodeMCU D6 = GPIO12
#define BUZZER_PIN 27   // NodeMCU D5 = GPIO14

Adafruit_BME680 bme(&Wire);
volatile bool buttonPressed = false;

void IRAM_ATTR onButton() {
  buttonPressed = true;
}

void setup() {
  Serial.begin(9600);
  delay(500);
  Serial.println("\n=== BME680 + Buzzer Test ===");

  // Button setup
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(BUTTON_PIN), onButton, FALLING);
  Serial.printf("Button attached on pin %d\n", BUTTON_PIN);

  // Active buzzer setup
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  Serial.printf("Active buzzer SIG on GPIO %d\n", BUZZER_PIN);

  // Sensor initialization
  Wire.begin();
  Serial.println("Initializing BME680...");
  if (!bme.begin(0x76)) {
    Serial.println("ERROR: BME680 not found at 0x76!");
    while (true) { delay(1000); }
  }
  Serial.println("BME680 found and initialized.");

  // Configure oversampling, filter, and heater
  bme.setTemperatureOversampling(BME680_OS_8X);
  bme.setHumidityOversampling(BME680_OS_8X);
  bme.setPressureOversampling(BME680_OS_4X);
  bme.setIIRFilterSize(BME680_FILTER_SIZE_3);
  bme.setGasHeater(320, 150); // 320°C for 150 ms
  Serial.println("Sensor configuration complete.");
}

void loop() {
  if (buttonPressed) {
    buttonPressed = false;  // reset flag

    Serial.println("\n--- Button Pressed ---");
    // Short delay before countdown
    delay(500);

     // Countdown with buzzer blips using active buzzer
    for (int count = 3; count >= 1; --count) {
      Serial.printf("Countdown: %d\n", count);
      digitalWrite(BUZZER_PIN, HIGH);
      delay(200);
      digitalWrite(BUZZER_PIN, LOW);
      delay(300);
    }

    // Continuous low tone during sampling
    Serial.println("Starting sensor reading...");
    digitalWrite(BUZZER_PIN, HIGH);

    // Averaging loop
        unsigned long startTime = millis();
        uint16_t samples = 0;
        double sumT = 0, sumH = 0, sumP = 0, sumG = 0;
        while (millis() - startTime < 3000) {
          if (!bme.beginReading()) {
            Serial.println("ERROR: beginReading() failed");
            break;
          }
          delay(250); // heater + conv time
          if (!bme.endReading()) {
            Serial.println("ERROR: endReading() failed");
            break;
          }
          sumT += bme.temperature;
          sumH += bme.humidity;
          sumP += bme.pressure / 100.0;
          sumG += bme.gas_resistance / 1000.0;
          samples++;
          delay(50); // small gap
        }

    // Turn off buzzer
    digitalWrite(BUZZER_PIN, LOW);
    Serial.println("Averaging complete; buzzer off.");

    // Compute averages
    if (samples > 0) {
      double avgT = sumT / samples;
      double avgH = sumH / samples;
      double avgP = sumP / samples;
      double avgG = sumG / samples;
      Serial.printf("Samples: %u\n", samples);
      Serial.printf(
        "Avg -> T: %.2f °C, H: %.2f %%, P: %.2f hPa, Gas: %.2f kΩ\n",
        avgT, avgH, avgP, avgG
      );
    } else {
      Serial.println("No valid samples collected.");
    }
  }

  delay(10); // idle
}
