const admin = require('firebase-admin');

// LEER CREDENCIALES DESDE GITHUB SECRETS
// Si la variable no existe (ej. prueba local sin configurar), dará error.
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('No se encontró la variable de entorno FIREBASE_SERVICE_ACCOUNT');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- DATOS FICTICIOS ---
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

async function generateDailyData() {
  const today = new Date();
  
  // BORRÉ EL BLOQUEO DE FIN DE SEMANA
  // Ahora trabajará aunque sea sábado o domingo

  const dateString = today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  console.log(`Generando datos para: ${dateString}`);

  const batch = db.batch();

  for (const person of personnel) {
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
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = db.collection('productivity_data').doc();
    batch.set(docRef, docData);
  }

  await batch.commit();
  console.log("¡Datos cargados exitosamente en Firestore!");
}

generateDailyData().catch(error => {
    console.error(error);
    process.exit(1); // Forzar error para que GitHub notifique

});
