var express = require('express');
var fulcrumMiddleware = require('connect-fulcrum-webhook');
var request = require('request');
var PORT = process.env.PORT || 9001;
var app = express();

function payloadProcessor (payload, done) {
  if (payload.data.form_id && payload.data.form_id === "c7e35d8e-7bb9-4ee7-a24f-0dcf35b8a6d4"){
    if (payload.type === "record.create") {
      createNSWRecord(payload, done);
    } else if (payload.type === "record.update") {
      updateNSWRecord(payload, done);
    } else if (payload.type === "record.delete") {
      deleteNSWRecord(payload, done);
    }
  }
}

function createNSWRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = "7989a430-3ef5-4fe4-94b9-c3f958c31db0";
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  delete payload.data;
  delete payload.record.id;

  request({
    method: 'POST',
    url: 'https://api.fulcrumapp.com/api/v2/records.json',
    json: payload.record,
    headers: {
      'X-ApiToken': '530bad65b9b7b1289635a6aa16214ed69f13d34b30cd7a5a6cb0e9806e53b1d0630dcdb1c78b2b36'
    }
  },
  function (err, httpResponse, body) {
    console.log('create', err, body);
  });
  done();
}

function updateNSWRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = '7989a430-3ef5-4fe4-94b9-c3f958c31db0';
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  delete payload.data;

  var query = encodeURIComponent("SELECT _record_id AS fulcrum_id FROM \"Damage Assessment SYNC\" WHERE fire_rescue_record_id = '" + payload.record.form_values['05e2'] + "';");

  request({
    method: 'GET',
    url: 'https://api.fulcrumapp.com/api/v2/query/?format=json&q=' + query,
    headers: {
      'X-ApiToken': '530bad65b9b7b1289635a6aa16214ed69f13d34b30cd7a5a6cb0e9806e53b1d0630dcdb1c78b2b36',
      'User-Agent': 'request'
    }
  },
  function (err, httpResponse, body) {
    console.log(httpResponse, body);
    body = JSON.parse(body);
    console.log(body['rows'][0]['fulcrum_id']);
    request({
      method: 'PUT',
      url: 'https://api.fulcrumapp.com/api/v2/records/' + body['rows'][0]['fulcrum_id'] + '.json',
      json: payload.record,
      headers: {
        'X-ApiToken': '530bad65b9b7b1289635a6aa16214ed69f13d34b30cd7a5a6cb0e9806e53b1d0630dcdb1c78b2b36'
      }
    },
    function (err, httpResponse, body) {
      console.log('PUT', err)
      console.log('PUT', body);
    });
    done();
  });
  delete payload.record.id;
}

function deleteNSWRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = "7989a430-3ef5-4fe4-94b9-c3f958c31db0";
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  delete payload.data;
  
  var query = encodeURIComponent("SELECT _record_id AS fulcrum_id FROM \"Damage Assessment SYNC\" WHERE fire_rescue_record_id = '" + payload.record.form_values['05e2'] + "'");
    
  request({
    method: 'GET',
    url: 'https://api.fulcrumapp.com/api/v2/query/?format=json&q=' + query,
    headers: {
      'X-ApiToken': '530bad65b9b7b1289635a6aa16214ed69f13d34b30cd7a5a6cb0e9806e53b1d0630dcdb1c78b2b36',
      'User-Agent': 'request'
    }
  },
  function (err, httpResponse, body) {
    console.log(err, body);
    body = JSON.parse(body);
    console.log(body['rows'][0]['fulcrum_id']);
    request({
      method: 'DELETE',
      url: 'https://api.fulcrumapp.com/api/v2/records/' + body['rows'][0]['fulcrum_id'] + '.json',
      json: payload.record,
      headers: {
        'X-ApiToken': '530bad65b9b7b1289635a6aa16214ed69f13d34b30cd7a5a6cb0e9806e53b1d0630dcdb1c78b2b36'
      }
    },
    function (err, httpResponse, body) {
      console.log('DELETE', body);
      console.log('DELETE', body);
    });
    done();
  });

}

var fulcrumMiddlewareConfig = {
  actions: ['record.create', 'record.update', 'record.delete'],
  processor: payloadProcessor
};

app.use('/', fulcrumMiddleware(fulcrumMiddlewareConfig));

app.get('/', function (req, res) {
  res.send('<html><head><title>NSW Public</title></head><body><h2>Fire Rescue</h2><p>going</p></body></html>');
})

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});