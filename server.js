const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// SERVIR FRONTEND
app.use(express.static(path.join(__dirname)));

//  CONEXIÓN A MONGODB
mongoose.connect("mongodb://arquitecturaenlanube26_db_user:Admin123456@ac-0off1lc-shard-00-00.kzcnojw.mongodb.net:27017,ac-0off1lc-shard-00-01.kzcnojw.mongodb.net:27017,ac-0off1lc-shard-00-02.kzcnojw.mongodb.net:27017/chat?ssl=true&replicaSet=atlas-1fslab-shard-0&authSource=admin&retryWrites=true&w=majority")
.then(() => console.log("✅ Conectado a MongoDB"))
.catch(err => console.log("❌ Error:", err));

// MODELOS ORIGINALES
const MensajeSchema = new mongoose.Schema({
    de: String,
    para: String,
    mensaje: String,
    fecha: { type: Date, default: Date.now }
});
const Mensaje = mongoose.model("Mensaje", MensajeSchema);

const UsuarioSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String
});
const Usuario = mongoose.model("Usuario", UsuarioSchema);

//  NUEVOS MODELOS (SaaS)
const TicketSchema = new mongoose.Schema({
    titulo: String,
    descripcion: String,
    estado: { type: String, default: "Abierto" },
    creadoPor: String,
    fecha: { type: Date, default: Date.now }
});
const Ticket = mongoose.model("Ticket", TicketSchema);

const TareaSchema = new mongoose.Schema({
    titulo: String,
    asignadoA: String,
    estado: { type: String, default: "Pendiente" },
    fecha: { type: Date, default: Date.now }
});
const Tarea = mongoose.model("Tarea", TareaSchema);

//  REGISTRO Y LOGIN (Intactos)
app.post("/registro", async (req, res) => {
    try {
        const { username, password } = req.body;
        const nuevo = new Usuario({ username, password });
        await nuevo.save();
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Usuario ya existe" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await Usuario.findOne({ username, password });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });
    res.json({ ok: true, username });
});

app.get("/usuarios", async (req, res) => {
    const usuarios = await Usuario.find({}, "username");
    res.json(usuarios);
});

//  ENDPOINTS DE CHAT
app.get("/mensajes/:usuario", async (req, res) => {
    const usuario = req.params.usuario;
    const mensajes = await Mensaje.find({
        $or: [
            { para: null },
            { para: usuario },
            { de: usuario }
        ]
    }).sort({ fecha: 1 });
    res.json(mensajes);
});

app.post("/mensaje", async (req, res) => {
    try {
        const { de, para, mensaje } = req.body;
        const nuevo = new Mensaje({ de, para: para || null, mensaje });
        await nuevo.save();
        res.json(nuevo);
    } catch (error) {
        res.status(500).json({ error: "Error al guardar mensaje" });
    }
});

//  NUEVOS ENDPOINTS (Tickets y Tareas)
app.post("/ticket", async (req, res) => {
    try {
        const nuevoTicket = new Ticket(req.body);
        await nuevoTicket.save();
        res.json(nuevoTicket);
    } catch (error) {
        res.status(500).json({ error: "Error al crear ticket" });
    }
});

app.get("/tickets", async (req, res) => {
    const tickets = await Ticket.find().sort({ fecha: -1 });
    res.json(tickets);
});

app.post("/tarea", async (req, res) => {
    try {
        const nuevaTarea = new Tarea(req.body);
        await nuevaTarea.save();
        res.json(nuevaTarea);
    } catch (error) {
        res.status(500).json({ error: "Error al crear tarea" });
    }
});

app.get("/tareas", async (req, res) => {
    const tareas = await Tarea.find().sort({ fecha: -1 });
    res.json(tareas);
});

//  SERVIDOR
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("Servidor corriendo en puerto " + port);
});