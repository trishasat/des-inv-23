const int redPin = 9, greenPin = 10, bluePin = 11;
const int buttonPin = 2, potPin = A0;

int curR = 50, curG = 50, curB = 50;
bool isBreathing = false;
float pulseValue = 0;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(redPin, OUTPUT); pinMode(greenPin, OUTPUT); pinMode(bluePin, OUTPUT);
  setLED(curR, curG, curB);
}

void loop() {
  //send position data to website
  Serial.print("Dial_Position:"); Serial.print(analogRead(potPin));
  Serial.print(",Button_State:"); Serial.println(digitalRead(buttonPin));

  //listen
  if (Serial.available() > 0) {
    String data = Serial.readStringUntil('\n');
    data.trim();

    if (data == "START_PULSE") { isBreathing = true; }
    else if (data == "STOP_PULSE") { isBreathing = false; setLED(curR, curG, curB); }
    else if (data.indexOf(',') != -1) {
      int first = data.indexOf(','), last = data.lastIndexOf(',');
      curR = data.substring(0, first).toInt();
      curG = data.substring(first + 1, last).toInt();
      curB = data.substring(last + 1).toInt();
      if (!isBreathing) setLED(curR, curG, curB);
    }
  }

  //pulsing logic
  if (isBreathing) {
    //sine wave
    pulseValue += 0.05; 
    float level = (sin(pulseValue) + 1.2) / 2.2; // 0.1 to 1.0 range
    analogWrite(redPin, curR * level);
    analogWrite(greenPin, curG * level);
    analogWrite(bluePin, curB * level);
  }

  delay(30);
}

void setLED(int r, int g, int b) {
  analogWrite(redPin, r); analogWrite(greenPin, g); analogWrite(bluePin, b);
}