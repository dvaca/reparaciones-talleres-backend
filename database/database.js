var pg = require("pg");

const { Pool } = require('pg')

var config = {
  //user: 'postgres',
  //database: 'TalleresBD', 
  //password: 'postgres123', 
  host: 'ec2-54-225-237-84.compute-1.amazonaws.com',
  user: 'yblnujhratywfx',
  database: 'd7u53hecedfq97', 
  password: '5a8bc60b8d58c11e2af2658e956f40f2bd2f934801d7e217f2521784bec26755', 
  port: 5432, 
  max: 10, // max number of connection can be open to database
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

const pool = new Pool(config);

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback)
  }
}