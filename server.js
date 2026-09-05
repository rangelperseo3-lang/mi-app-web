const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");

// Forzar el uso de los DNS de Google para evitar el error ENOTFOUND / querySrv
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANTE: la contraseña de MongoDB debe venir de una variable de entorno
// (configúrala en Render -> tu servicio -> Environment -> MONGO_URI).
// No dejes la contraseña real escrita en el código si el repositorio es público.
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Falta la variable de entorno MONGO_URI. Configúrala en Render antes de iniciar el servidor.");
}

// Conexión a la base de datos compartida en la nube
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Conectado con éxito a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

/* =========================================================
   Estado compartido de la plataforma INVERSIONES JORAN
   Se guarda como UN solo documento ("global") que contiene todo
   el objeto DB del frontend (clientes, trabajadores, seguimientos,
   categorías, parámetros, solicitudes de edición y contadores).
   Así, cualquier dispositivo que abra la página ve los mismos datos.
   ========================================================= */
const EstadoAppSchema = new mongoose.Schema(
  {
    clave: { type: String, unique: true, default: "global" },
    datos: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { minimize: false, timestamps: true }
);

const EstadoApp = mongoose.model("EstadoApp", EstadoAppSchema);

const ESTADO_POR_DEFECTO = {
  clientes: [],
  trabajadores: [],
  seguimientos: [],
  usuarios: [],
  categorias: ['Tienda de barrio', 'Panadería', 'Barbería', 'Papelería', 'Restaurante', 'Ferretería', 'Otro'],
  parametros: { moneda: 'COP', periodoSeguimiento: 'Semanal', metaCumplimientoMinimo: 80, nombreEmpresa: 'INVERSIONES JORAN S.A.S.' },
  solicitudesEdicion: [],
  nextId: { cliente: 1, trabajador: 1, seguimiento: 1, usuario: 1, solicitud: 1 }
};

// Middlewares para procesar JSON (con límite mayor, ya que las evidencias
// del trabajador van como imágenes/documentos en base64) y servir el HTML
app.use(express.json({ limit: "25mb" }));
app.use(express.static(__dirname));

// Ruta principal para cargar el diseño web
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API: Obtener el estado compartido (clientes, trabajadores, seguimientos, etc.)
app.get("/api/estado", async (req, res) => {
  try {
    let doc = await EstadoApp.findOne({ clave: "global" });
    if (!doc) {
      doc = await EstadoApp.create({ clave: "global", datos: ESTADO_POR_DEFECTO });
    }
    res.json(doc.datos || ESTADO_POR_DEFECTO);
  } catch (error) {
    console.error("Error al obtener el estado:", error);
    res.status(500).json({ error: "Error al obtener el estado" });
  }
});

// API: Guardar/actualizar el estado compartido (lo llama cualquier dispositivo
// cada vez que un cliente, trabajador o administrador hace un cambio)
app.put("/api/estado", async (req, res) => {
  try {
    const nuevosDatos = req.body;
    const doc = await EstadoApp.findOneAndUpdate(
      { clave: "global" },
      { datos: nuevosDatos },
      { new: true, upsert: true }
    );
    res.json({ mensaje: "Estado guardado correctamente", datos: doc.datos });
  } catch (error) {
    console.error("Error al guardar el estado:", error);
    res.status(500).json({ error: "Error al guardar el estado" });
  }
});

// Iniciar servidor (escuchando en 0.0.0.0 para compatibilidad en la nube)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});
