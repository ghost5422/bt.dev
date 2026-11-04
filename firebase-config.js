// Daha önce kullandığın "urunrakip" Firebase projesinin istemci yapılandırması.
// Panel SADECE lifeOS/aofTrackerV1 yolunda okuma/yazma yapar.
// Web API anahtarı tek başına güvenlik sağlamaz; Realtime Database Rules önemlidir.
window.AOF_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBKUs5FM50ejN9tVdvUNzocRGU5Q5lD2eo",
  authDomain: "urunrakip.firebaseapp.com",
  databaseURL: "https://urunrakip-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "urunrakip",
  storageBucket: "urunrakip.appspot.com",
  messagingSenderId: "893193039416",
  appId: "1:893193039416:web:8624c79038f5dc9a2ac0cd"
};
window.AOF_DATABASE_PATH = "lifeOS/aofTrackerV1";
