'use strict';

var Swarm = require('swarm');

var TodoItem = Swarm.Model.extend('TodoItem', {
  defaults: {
    textID: String,
    complete: false
  }
});

module.exports = TodoItem;
