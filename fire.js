var express = require('express');
var fulcrumMiddleware = require('connect-fulcrum-webhook');
var request = require('request');
var PORT = process.env.PORT || 9001;
var app = express();

function payloadProcessor (payload, done) {
  if (payload.data.form_id && payload.data.form_id === "c7e35d8e-7bb9-4ee7-a24f-0dcf35b8a6d4"){
    if (payload.type === "record.create") {
      createFireRecord(payload, done);
    } else if (payload.type === "record.update") {
      updateFireRecord(payload, done);
    } else if (payload.type === "record.delete") {
      deleteFireRecord(payload, done);
    }
  }
}

function createFireRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = "7989a430-3ef5-4fe4-94b9-c3f958c31db0";
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  console.log(payload.record.form_values);
  delete payload.data;
  delete payload.record.id;

  request({
    method: 'POST',
    url: 'https://api.fulcrumapp.com/api/v2/records.json',
    json: payload.record,
    headers: {
      'X-ApiToken': '9348ccf13cc9af57467947046bd42b15a429f9c203f708e5f2975269e57f08ca7e6f241325839215'
    }
  },
  function (err, httpResponse, body) {
    console.log('create', err, body);
  });
  done();
}

function updateFireRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = '7989a430-3ef5-4fe4-94b9-c3f958c31db0';
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  delete payload.data;

  var query = encodeURIComponent("SELECT _record_id AS fulcrum_id FROM \"Damage Assessment SYNC\" WHERE nsw_record_id = '" + payload.record.form_values['05e2'] + "'");

  request({
    method: 'GET',
    url: 'https://api.fulcrumapp.com/api/v2/query/?format=json&q=' + query,
    headers: {
      'X-ApiToken': '9348ccf13cc9af57467947046bd42b15a429f9c203f708e5f2975269e57f08ca7e6f241325839215',
      'User-Agent': 'request'
    }
  },
  function (err, httpResponse, body) {
    console.log(httpResponse, body);
    body = JSON.parse(body);

    if (body.rows[0].fulcrum_id){
      request({
        method: 'PUT',
        url: 'https://api.fulcrumapp.com/api/v2/records/' + body.rows[0].fulcrum_id + '.json',
        json: payload.record,
        headers: {
          'X-ApiToken': '9348ccf13cc9af57467947046bd42b15a429f9c203f708e5f2975269e57f08ca7e6f241325839215'
        }
      },
      function (err, httpResponse, body) {
        console.log('PUT', err)
        console.log('PUT', body);
      });
    } else {
      alert('Record from another motha');
    }
      done();
    });
  delete payload.record.id;
}

function deleteFireRecord(payload, done) {
  payload.record = payload.data;
  payload.record.form_id = "7989a430-3ef5-4fe4-94b9-c3f958c31db0";
  payload.record.form_values['05e2'] = payload.record.form_values['15af'];
  console.log('VALUE', payload.record.form_values['15af']);
  delete payload.data;
  
  var query = encodeURIComponent("SELECT _record_id FROM \"Damage Assessment SYNC\" WHERE nsw_record_id = '" + payload.record.form_values['05e2'] + "'");
  console.log(query);
    
  request({
    method: 'GET',
    url: 'https://api.fulcrumapp.com/api/v2/query/?format=json&q=' + query,
    headers: {
      'X-ApiToken': '9348ccf13cc9af57467947046bd42b15a429f9c203f708e5f2975269e57f08ca7e6f241325839215',
      'User-Agent': 'request'
    }
  },
  function (err, httpResponse, body) {
    console.log(err, body);
    body = JSON.parse(body);
    if (body.rows[0].fulcrum_id){
      console.log(body.rows[0].fulcrum_id);
      request({
        method: 'DELETE',
        url: 'https://api.fulcrumapp.com/api/v2/records/' + body.rows[0].fulcrum_id + '.json',
        json: payload.record,
        headers: {
          'X-ApiToken': '9348ccf13cc9af57467947046bd42b15a429f9c203f708e5f2975269e57f08ca7e6f241325839215'
        }
      },
      function (err, httpResponse, body) {
        console.log('DELETE', body);
      });
    }
    done();
  });

}

var fulcrumMiddlewareConfig = {
  actions: ['record.create', 'record.update', 'record.delete'],
  processor: payloadProcessor
};

app.use('/', fulcrumMiddleware(fulcrumMiddlewareConfig));

app.get('/', function (req, res) {
  res.send('<html><head><title>NSW Public</title></head><body><h2>NSW records</h2><p>going</p></body></html>');
})

app.listen(PORT, function () {
  console.log('Listening on port ' + PORT);
});