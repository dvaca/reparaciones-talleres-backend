var express = require('express');
var app = express();
var db = require('../database/database');
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = process.env.PORT || 4010;

var corsOptions = {
  //origin: 'http://localhost:4200',
  //origin: 'http://192.168.0.6:4200',
  origin: 'https://reparaciones-talleres.herokuapp.com', // INTERNET
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204 
};

app.use(bodyParser.json({limit: '50mb'})); // for parsing application/json
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors(corsOptions));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.listen(PORT, function () {
    console.log('Server is running.. on Port ' + PORT);
});

  //PING
  app.get('/', (req, res, next) => {
    log('Start', 'PING', 'Hello world!');
    db.query('SELECT $1::text as message', ['Hello world!'], (err, result) => {
      if (err) {
        return next(err);
      }
      fecha = new Date().toLocaleString();
      log('End', 'PING', 'Hello world!');
      res.send(result.rows[0]);
    })
  });

  //CONSULTA DE UNA REPARACION CON SUS EVIDENCIAS
  app.get('/reparacion/:id', (req, res, next) => {
    var listaReparaciones, listaEvidencias;
    log('Start', 'CONSULTA REPARACION COMPLETO', req.params.id);
    db.query('SELECT * FROM reparacion WHERE id = $1', 
    [req.params.id], (err, result) => {
      if (err) {
        return next(err);
      }
      listaReparaciones = result.rows;
      db.query(`select e.*
              from reparacion r 
              inner join evidencia e
              on r.id = e.idreparacion
              where r.id = $1`, 
              [req.params.id], (err, result) => {
        if (err) {
          return next(err);
        }
        listaEvidencias = result.rows;
        log('End', 'CONSULTA REPARACION COMPLETO', req.params.id);
        if(listaReparaciones.length == 0){
          res.send("{}");
        }else{
          res.send(arbolReparaciones(listaReparaciones, listaEvidencias)[0]);
        }
      });
    });
  });

  //INSERTA UNA REPARACION CON SUS RESPECTIVAS EVIDENCIAS
  app.post('/reparacion', (req, res, next) => {
    var evidencia, reparacion;    
    log('Start', 'CREA REPARACION', req.body.idVehiculo);
    db.query(`INSERT INTO reparacion(
                idvehiculo, descripcion, fechaingreso, fechaentrega)
              VALUES ($1, $2, current_timestamp, current_timestamp);`, 
              [req.body.idVehiculo, 
                req.body.descripcion
              ], (err, result) => {
      if (err) {
        return next(err);
      }
      //res.status(201).send(req.body);    
      db.query('SELECT * FROM reparacion WHERE idvehiculo = $1 ORDER BY id DESC', 
        [req.body.idVehiculo], (err, result) => {
          if (err) {
            return next(err);
          }
          reparacion = result.rows[0];
          for (i = 0; i < req.body.evidencias.length; i += 1) {
            evidencia = req.body.evidencias[i];
            db.query(`INSERT INTO evidencia(
                  idreparacion, descripcion, mecanico, valor, foto, fecha)
                  VALUES ($1, $2, $3, $4, $5, current_timestamp);`, 
                  [reparacion.id, 
                    evidencia.descripcion,
                    evidencia.mecanico,
                    evidencia.valor,
                    evidencia.foto
                  ], (err, result) => {
            if (err) {
            return next(err);
            }
            //res.status(201).send(req.body);    
            });
          }
          req.body.id = reparacion.id;
          log('End', 'CREA REPARACION', req.body.idVehiculo);
          res.status(201).send(req.body);    //TODO Validar si es correcto el valor devuelto
        });
    });
  });

  //CONSULTA DE UN VEHICULO CON EL CLIENTE ASOCIADO
  app.get('/vehiculo/:id', (req, res, next) => {
    var listaVehiculos, vehiculo, cliente;
    log('Start', 'CONSULTA VEHICULO', req.params.id);
    db.query('SELECT * FROM vehiculo WHERE id = $1', 
    [req.params.id], (err, result) => {
      if (err) {
        return next(err);
      }
      listaVehiculos = result.rows;
      if(listaVehiculos.length == 0){
        res.send("{}");
      }else{
        vehiculo = listaVehiculos[0];
        db.query(`select *
              from cliente c 
              where c.id = $1`, 
              [vehiculo.idcliente], (err, result) => {
          if (err) {
            return next(err);
          }
          cliente = result.rows[0];
          vehiculo.cliente = cliente;
          res.send(vehiculo);
        });
      }
      log('End', 'CONSULTA VEHICULO', req.params.id);
    });
  });
  
  function log(tipo, metodo, parametro){
    var fecha = new Date().toLocaleString();
    var milisegundos = new Date().getMilliseconds();
    console.log(tipo + ':' + metodo + ':' + parametro + ':' + fecha + '.' + milisegundos);
  }

  function arbolReparaciones(listaPadre, listaHijos) {
    try{
      var nodoPadre, nodoHijo, roots = [], i, j;
      for (i = 0; i < listaPadre.length; i += 1) {
        nodoPadre = listaPadre[i];
        nodoPadre.evidencias = [];
      }
      for (i = 0; i < listaPadre.length; i += 1) {
        nodoPadre = listaPadre[i];
        for (j = 0; j < listaHijos.length; j += 1) {
          nodoHijo = listaHijos[j];
          if (nodoHijo.idreparacion == nodoPadre.id) {
              nodoPadre.evidencias.push(nodoHijo);
          } 
        }
        roots.push(nodoPadre);
      }
      return roots;
    }
    catch(error){
      console.log(error);
    }
    return null;
  }
  