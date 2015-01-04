/**
 * Ember.js response Hook
 *
 * This hook adds the res.ember() function to send json records in ember.js default rest format
 */

var _ = require('lodash');
var responseOk = require('./responseOk.js');

module.exports = function (sails) {
  return {

    // Implicit default configuration
    // (mixed in to `sails.config`)
    defaults: {
      emberjs: {
        loadDefaultOkResponse: true,
        sendRelatedModel: true
      }
    },

    /**
     * initialize hook
     *
     * @param  {Function} cb  callback
     */
    initialize: function (cb) {
      if( !sails.hooks.responses || !sails.hooks.responses.middleware) {
        return cb('Sails.js responses hook is required for load res.emberjs');
      }

      // register in initialize hook
      sails.hooks.responses.middleware.emberjs = emberjsResponse;

      if (sails.config.emberjs.loadDefaultOkResponse) {
        sails.hooks.responses.middleware.ok = responseOk;
      }

      cb();
    },

    routes: {
      before: {
        // set res.locals.metadata in all requests
        '/*': setMetadataLocals
      }
    }
  }
}

/**
 * Function middlewar to ser local metadata variable
 *
 * @param {object}   req  express.js request
 * @param {object}   res  express.js response
 * @param {Function} next middleware next callback function
 */
function setMetadataLocals(req, res, next) {
  if (!res.locals.metadata) {
    res.locals.metadata = {};
  }
  return next();
}
/**
 * Ember js response function
 *
 * @param  {object} data    records to send
 */
function emberjsResponse(data) {
  // Get access to `req`, `res`, & `sails`
  var req = this.req;
  var res = this.res;
  //var sails = req._sails;

  var dataToSend = parseSailsResponseToEmberResponse(req, data);

  // if has metadata set it in locals variable
  if (res.locals.metadata) {
    dataToSend.meta = res.locals.metadata;
  }

  return res.json(dataToSend);
}

/**
 * Parse Ember.js response data
 *
 * TODO add suport to sails.js populate
 */
function parseSailsResponseToEmberResponse(req, data) {
    var model = req.options.model || req.options.controller;

    var dataToSend = {};

    if ( _.isArray(data) ) {
      if (req.options.associations) {
      // list response
        dataToSend[model] = [];
        for (var i = data.length - 1; i >= 0; i--) {
          dataToSend[model].push(parseSailsRecordToEmberRecord (
            data[i],
            req.options.associations,
            dataToSend,
            req._sails.config.emberjs.sendRelatedModel
          ));
        }
      }
    } else {
    // single item response
      dataToSend[model] = parseSailsRecordToEmberRecord (
        data,
        req.options.associations,
        dataToSend,
        req._sails.config.emberjs.sendRelatedModel
      );
    }

    // converts associated model list to array
    var modelNames = Object.keys(dataToSend);
    modelNames.forEach(function (name) {
      if (name !== model) {
        // convert it to array
        dataToSend[name] = _.toArray(dataToSend[name]);
      }
    })

    return dataToSend;
}

/**
 * Helper function to get ember.js model name
 *
 * @param  {object} association  req.options.associations object
 */
function getModelName(association) {
  if (association.model ) return association.model;
  if (association.collection) return association.collection;

  return console.error('cant find model name associated in getModelName', association);
}

/**
 * Parse one record to return data in ember.js
 *
 * @param  {object} dataRecord    waterline record with associations
 * @param  {object} associations  req.options.associations
 * @param  {object} dataToSend    object used to store fetched data
 * @return {object}               parsed record
 */
function parseSailsRecordToEmberRecord (dataRecord, associations, dataToSend, sendRelatedModel) {

  var attribute;
  var assocModelName;
  var associatedRecord;
  var record;

  // if has toJSON function
  if ( dataRecord.toJSON ) {
    // clone to remove default waterline model toJSON how removes associations from arrays
    record = _.clone(dataRecord.toJSON());
  } else {
    record = dataRecord;
  }
  //sails.log.warn('res.emberjs <><><><', record);
  for (var l = associations.length - 1; l >= 0; l--) {

    attribute = associations[l].alias;
    assocModelName = getModelName(associations[l]);

    if ( _.isUndefined( dataToSend[ assocModelName ] ) )  {
      dataToSend[ assocModelName ] = {};
    }

    if ( record[attribute] ) {
      // if a has many relationship
      if ( _.isArray(record[attribute]) ) {
        // for each associated record ...
        for (var i = record[attribute].length - 1; i >= 0; i--) {

          associatedRecord = record[attribute][i];

          // skip if associated record dont are object
          if (! _.isObject(associatedRecord)) continue;

          // only set model one time for each model id
          if(! dataToSend[ assocModelName ][ associatedRecord.id ] ) {
            dataToSend[ assocModelName ][ associatedRecord.id ] = associatedRecord;
          }

          // change model object to model id
          record[ attribute ][i] = associatedRecord.id;
        }

      // else is a bellongs to relationship
      } else {
        // skip if associated record dont are object
        if (! _.isObject( record[ attribute ] )) continue;

        // only set model one time for each model id
        if(!
          dataToSend[assocModelName][ record[ attribute ].id ] &&
          sendRelatedModel
        ) {
          dataToSend[assocModelName][ record[ attribute ].id ] = record[ attribute ];
        }
        // change model object to model id
        record[ attribute ] = record[ attribute ].id;

      }
    }
  }

  return record;
}