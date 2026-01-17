const admin = require('firebase-admin');

// 1. SEGURIDAD: Leer llave maestra desde GitHub Secrets
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('ERROR CRÍTICO: No se encontró el secreto FIREBASE_SERVICE_ACCOUNT');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- CONFIGURACIÓN DE LA FÁBRICA ---
const names = [
  "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Luis Rodríguez",
  "Carmen Fernández", "Pedro Sánchez", "Laura González", "Jorge Ramírez", "Isabel Torres",
  "Diego Ruiz", "Sofía Morales", "Antonio Jiménez", "Elena Hernández", "Miguel Díaz",
  "Patricia López", "José Martín", "Claudia Ruiz", "Francisco Serrano", "Lucía García",
  "Alejandro Fernández", "Beatriz López", "David Martínez", "Marta Rodríguez", "Pablo González",
  "Laura Sánchez", "Ricardo Jiménez", "Natalia Morales", "Carlos Ramírez", "Eva Torres"
];

const teams = ["GURREN", "SHINY", "SOULS"];

const personnel = names.map((name, index) => {
    return { name: name, team: teams[Math.floor(index / 10)] };
});

const getRandomBetween = (min, max) => Math.random() * (max - min) + min;
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// --- FUNCIÓN DIARIA AUTOMÁTICA ---
async function generateDailyData() {
  const today = new Date();
  
  // 2. BLOQUEO DE FIN DE SEMANA
  // 0 = Domingo, 6 = Sábado
  // Si el Cron de GitHub se dispara por error un finde, esto nos protege.
  const day = today.getDay();
  if (day === 0 || day === 6) {
      console.log("💤 Hoy es fin de semana. La fábrica está cerrada. No se generan datos.");
      return;
  }

  const dateString = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  console.log(`🏭 Iniciando turno de producción para: ${dateString}`);

  const batch = db.batch();

  for (const person of personnel) {
    // Generación de métricas (Misma lógica matemática para consistencia)
    const volumeRaw = getRandomBetween(0.2, 14.7);
    const weightRaw = getRandomBetween(0.2, 30);
    const density = weightRaw / volumeRaw;
    const qty = getRandomInt(400, 4000);
    const end = qty / 8;
    
    let endtgt = end; 
    if (density < 1) endtgt = end * 1.1; 
    else if (density > 2) endtgt = end * 0.9;
    endtgt = Math.max(100, Math.min(1000, endtgt));

    const endp = (end / endtgt) * 100;

    let qtyerr = 0;
    // 10% probabilidad de error
    if (Math.random() < 0.1) { 
        if (Math.random() < 0.3) qtyerr = getRandomInt(10, 99); 
        else if (Math.random() < 0.1) qtyerr = getRandomInt(100, 200); 
        else qtyerr = getRandomInt(1, 9); 
    }

    const docData = {
      A_Time: dateString,
      B_Name: person.name,
      C_Team: person.team,
      D_Volume: parseFloat(volumeRaw.toFixed(1)),
      E_Weight: Math.round(weightRaw),
      F_Density: parseFloat(density.toFixed(2)),
      G_QTY: qty,
      H_END: parseFloat(end.toFixed(2)),
      I_ENDTGT: parseFloat(endtgt.toFixed(2)),
      J_ENDP_PCT: parseFloat(endp.toFixed(2)),
      K_QTYERR: qtyerr,
      timestamp: admin.firestore.FieldValue.serverTimestamp() // Hora exacta del servidor
    };

    const docRef = db.collection('productivity_data').doc();
    batch.set(docRef, docData);
  }

  await batch.commit();
  console.log("✅ ¡Turno finalizado! Datos del día cargados en Firestore.");
}

generateDailyData().catch(error => {
    console.error("❌ Error en la producción:", error);
    process.exit(1);
});
