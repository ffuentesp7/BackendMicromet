import "dotenv/config";
import express from "express";
import cors from "cors";
import { router } from "./routes/item";
const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());
app.use(router);
app.listen(PORT, () => console.log(`Escuchando por el puerto ${PORT}`));