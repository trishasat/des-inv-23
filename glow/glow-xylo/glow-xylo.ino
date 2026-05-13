//5 leds on arduino
int ledPins[] = {2, 3, 4, 5, 6}; 

void setup() {
  Serial.begin(9600);
  for (int i = 0; i < 5; i++) {
    pinMode(ledPins[i], OUTPUT);
  }
}

void loop() {
  if (Serial.available() > 0) {
    int keyID = Serial.read(); //reads key from website
    
    if (keyID >= 0 && keyID < 5) {
      digitalWrite(ledPins[keyID], HIGH); //Light up
      delay(200);                        //Glow duration
      digitalWrite(ledPins[keyID], LOW);  //Turn off
    }
  }
}