const nano = require('./src/config/database.js');
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

// Router Imports
// const userRouter = require('./routes/userRouter');
//const systemRouter = require('./routes/stationRouter');

// Packages Imports
const dotenv = require('dotenv');
dotenv.config();
const dbInstance = require('./src/config/database');
const iniaDB = dbInstance.server.db.use('inia');
// App Settings and Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Configura el puerto de la aplicación
const port = process.env.PORT || 3000;
// Configura el middleware
app.use(bodyParser.json());
//app.use(cors());
// Configura las rutas
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/getInfo', async(req, res) => {
  const response = await getInfo();
  res.send(response);
});

async function getInfo() {
  //const response = await iniaDB.get('aerodromobalmacedacoyhaiquedmc-2013:06298315ea3afdbe6a186abe2d05dc82')
  const response = await iniaDB.list({include_docs: true, limit: 10, skip: 10})
  return response
}

// Routes definition
app.get('/', (req, res) => {
  res.send('Hola desde la nube!');
});

//app.use('/users', userRouter);
//app.use('/systems', systemRouter);

// App Serving
app.listen(port);
console.log(`Listening On http://localhost:${port}/`);