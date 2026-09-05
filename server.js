const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dns = require("dns");

// Forzar el uso de los DNS de Google para evitar el error ENOTFOUND / querySrv
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = express();
const PORT = process.env.PORT || 3000;

// Reemplaza TU_CONTRASEÑA_REAL por la contraseña que creaste en MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ran9282148_db_user:dr9609208dr@cluster0.hr7feyk.mongodb.net/?appName=Cluster0";

// Conexión a la base de datos compartida en la nube
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Conectado con éxito a MongoDB Atlas"))
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Definir la estructura de los datos que van a compartir los usuarios
const DatoSchema = new mongoose.Schema({
  contenido: String,
  fecha: { type: Date, default: Date.now }
});

const Dato = mongoose.model("Dato", DatoSchema);

// Middlewares para procesar JSON y servir archivos estáticos (tu HTML)
app.use(express.json());
app.use(express.static(__dirname));

// Ruta principal para cargar el diseño web
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// API: Ruta para OBTENER todos los datos guardados por cualquier usuario
app.get("/api/datos", async (req, res) => {
  try {
    const datos = await Dato.find().sort({ fecha: -1 });
    res.json(datos);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

// API: Ruta para GUARDAR un nuevo dato desde cualquier computadora
app.post("/api/datos", async (req, res) => {
  try {
    const nuevoDato = new Dato({ contenido: req.body.contenido });
    await nuevoDato.save();
    res.json({ mensaje: "Dato guardado correctamente", dato: nuevoDato });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar el dato" });
  }
});

// Iniciar servidor (escuchando en 0.0.0.0 para compatibilidad en la nube)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});