const admin = require('firebase-admin');

// VERIFICACIÓN DE SEGURIDAD
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('No se encontró la variable de entorno FIREBASE_SERVICE_ACCOUNT');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- CONFIGURACIÓN ---
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

// --- FUNCIÓN HISTÓRICA ---
async function generateHistoricalData() {
  console.log("Iniciando carga histórica desde 01/01/2026...");
  
  const startDate = new Date('2026-01-01T12:00:00'); // Mediodía para evitar problemas de zona horaria
  const endDate = new Date(); // Hoy
  let currentDate = new Date(startDate);
  
  let totalDocs = 0;

  // BUCLE DE FECHAS
  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    
    // Si NO es Domingo (0) Y NO es Sábado (6)
    if (day !== 0 && day !== 6) {
        
        const dateString = currentDate.toLocaleDateString('es-ES', { 
            day: '2-digit', month: '2-digit', year: 'numeric' 
        });
        
        console.log(`Procesando día: ${dateString}`);
        
        // Creamos un lote (Batch) por día para no saturar la memoria
        const batch = db.batch();

        for (const person of personnel) {
            // Generación de métricas
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
                // Usamos la fecha del bucle para el timestamp, no la de "hoy"
                timestamp: new Date(currentDate) 
            };

            const docRef = db.collection('productivity_data').doc();
            batch.set(docRef, docData);
            totalDocs++;
        }

        // Subimos el día completo a Firebase
        await batch.commit();
    }
    
    // Avanzamos al día siguiente
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`¡Carga Histórica Completada! Se generaron ${totalDocs} registros.`);
}

generateHistoricalData().catch(error => {
    console.error(error);
    process.exit(1);
});
