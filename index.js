"use strict";

const fs = require('fs')
const path = require('path')
const glob = require("glob")
const Promise = require('promise');
const express = require('express')
const app = express()
const endpoints = path.join(__dirname, 'endpoints')

let endpointsDictionary = [];
// load endpoints
getMockEndpoints();

app.get('/*', function (req, res) {

  let status = req.query.custom_status || 200

  var endpoint = findMockEndpoint(status, req.path)

  if(!endpoint) {
     return res.json("Mock endpoint not found");
  }

  getMockEndpoint(endpoint.filename)
    .then((resp) => {

      if(endpoint.params.length && endpoint.paramValues) {
        // TODO search in resp.data
      }

      res.json(resp.data);
    })
    .catch((err) => {
      res.json(err);
    });

});

app.listen(3000)

/**
 * Parse an endpoint filename and extract its parameters
 * @param filename
 */
function parseMockEndpointName(filename) {

  let partial = filename.split('@');
  let status = partial[0]
  let endpoint = partial[1]
  let splitted = endpoint.split('-')
  let paths = splitted.filter((s) => { return s.trim().length > 0 && s.indexOf('#') < 0; });
  let params = splitted.filter((s) => { return s.indexOf('#') === 0; }).map((p) => { return p.replace(/#/g, '') });

  return {
    filename: filename,
    status: status,
    endpoint: '/' + paths.join('/'),
    params: params
  }

}
/**
 * Find an existing mock endpoint file
 * @param status
 * @param path
 */
function findMockEndpoint(status, path) {
  console.log(status, path)
   return endpointsDictionary.find((el) => {
     return el.status == status && path.indexOf(el.endpoint) === 0;
   });
}

/**
 * Return mock endpoint data
 * @param endpointName
 */
function getMockEndpoint(endpointName) {

  return new Promise(function(fullfill, reject) {

    fs.readFile(path.join(endpoints, endpointName) + '.json', 'utf8', function(err, data) {
      if(err) {
        return reject("Mock file not found, it should be named: " + endpointName + ".json");
      }

      try{
        let obj = JSON.parse(data)
        fullfill({ status: 200, data: obj });
      } catch(e) {
        reject(e);
      }
    });

  });

}


/**
 * Load mock endpoints
 * @param filename
 */
function getMockEndpoints() {
  glob(path.join(endpoints, '*@*.json'), function (err, files) {

    if(err) {
      console.error(err);
      return false;
    }

    for(var i = 0; i < files.length; i++) {
        let filename = path.parse(path.basename(files[i])).name
        let endpoint = parseMockEndpointName(filename);
        endpointsDictionary.push(endpoint);
    }

    console.log(endpointsDictionary);

  })
}
