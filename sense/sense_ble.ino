/*
BLE JSON Multi-Sensor
Temp + Humidity + Mic dB
Rounded to 1 decimal
Board: Arduino Nano 33 BLE Sense
*/

#include <ArduinoBLE.h>
#include <Arduino_HTS221.h>
#include <ArduinoJson.h>
#include <PDM.h>

// Device name
const char* nameOfPeripheral = "EnvSensor";

// Environmental Sensing Service
const char* uuidOfService = "0000181A-0000-1000-8000-00805f9b34fb";
const char* uuidOfTxChar  = "00002A6E-0000-1000-8000-00805f9b34fb";

// BLE Service
BLEService envService(uuidOfService);

// TX Characteristic
#define TX_BUFFER_SIZE 96
BLECharacteristic txChar(uuidOfTxChar, BLERead | BLENotify, TX_BUFFER_SIZE);

// State
bool notificationsEnabled = false;

// Microphone buffer
short sampleBuffer[256];
volatile int samplesRead = 0;

// ===============================
// Setup
// ===============================

void setup() {
  Serial.begin(9600);
  while (!Serial);

  pinMode(LEDR, OUTPUT);
  pinMode(LEDG, OUTPUT);
  disconnectedLight();

  if (!BLE.begin()) {
    Serial.println("BLE start failed!");
    while (1);
  }

  if (!HTS.begin()) {
    Serial.println("HTS221 failed!");
    while (1);
  }

  // Start microphone
  PDM.onReceive(onPDMdata);
  if (!PDM.begin(1, 16000)) {
    Serial.println("PDM start failed!");
    while (1);
  }

  BLE.setLocalName(nameOfPeripheral);
  BLE.setAdvertisedService(envService);

  envService.addCharacteristic(txChar);
  BLE.addService(envService);

  BLE.setEventHandler(BLEConnected, onBLEConnected);
  BLE.setEventHandler(BLEDisconnected, onBLEDisconnected);

  txChar.setEventHandler(BLESubscribed, onTxSubscribed);
  txChar.setEventHandler(BLEUnsubscribed, onTxUnsubscribed);

  BLE.advertise();

  Serial.println("BLE Multi-Sensor Ready");
}

// ===============================
// Main Loop
// ===============================

void loop() {

  BLEDevice central = BLE.central();

  if (central && central.connected()) {

    if (notificationsEnabled) {
      sendSensorJSON();
    }

    delay(2000);
  }
}

// ===============================
// Sensor + JSON
// ===============================

void sendSensorJSON() {

  float temperature = round1(HTS.readTemperature());
  float humidity    = round1(HTS.readHumidity());
  float volumeDb    = round1(calculateDecibels());

  StaticJsonDocument<96> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["micLevel"] = volumeDb;

  char jsonBuffer[TX_BUFFER_SIZE];
  size_t len = serializeJson(doc, jsonBuffer);

  txChar.writeValue((uint8_t*)jsonBuffer, len);

  Serial.println("---- Data Sent ----");
  Serial.print("Temp: "); Serial.print(temperature); Serial.println(" °C");
  Serial.print("Hum:  "); Serial.print(humidity); Serial.println(" %");
  Serial.print("Vol:  "); Serial.print(volumeDb); Serial.println(" dB");
  Serial.print("JSON: "); Serial.println(jsonBuffer);
  Serial.println("-------------------");
}

// ===============================
// 1 Decimal Rounding Helper
// ===============================

float round1(float val) {
  return round(val * 10.0) / 10.0;
}

// ===============================
// Microphone Processing
// ===============================

void onPDMdata() {
  samplesRead = PDM.available();
  PDM.read(sampleBuffer, samplesRead);
}

float calculateDecibels() {

  if (samplesRead == 0) return 0.0;

  long sum = 0;
  for (int i = 0; i < samplesRead / 2; i++) {
    sum += abs(sampleBuffer[i]);
  }

  float average = (float)sum / (samplesRead / 2);

  if (average <= 0) return 0.0;

  float db = 20.0 * log10(average);

  samplesRead = 0;
  return db;
}

// ===============================
// BLE Events
// ===============================

void onBLEConnected(BLEDevice central) {
  Serial.println("\n>>> CONNECTED <<<");
  connectedLight();
}

void onBLEDisconnected(BLEDevice central) {
  notificationsEnabled = false;
  Serial.println("\n>>> DISCONNECTED <<<");
  disconnectedLight();
}

void onTxSubscribed(BLEDevice central, BLECharacteristic characteristic) {
  notificationsEnabled = true;
  Serial.println("\n+++ NOTIFICATIONS ENABLED +++");
}

void onTxUnsubscribed(BLEDevice central, BLECharacteristic characteristic) {
  notificationsEnabled = false;
  Serial.println("\n--- NOTIFICATIONS DISABLED ---");
}

// ===============================
// LED Helpers
// ===============================

void connectedLight() {
  digitalWrite(LEDR, HIGH);
  digitalWrite(LEDG, LOW);
}

void disconnectedLight() {
  digitalWrite(LEDR, LOW);
  digitalWrite(LEDG, HIGH);
}