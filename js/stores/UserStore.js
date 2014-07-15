/**
 * Storage which keeps track of a current user.
 *
 * @jsx React.DOM
 */
'use strict';

var Swarm        = require('swarm');
var DummyStorage = require('swarm/lib/DummyStorage');

var LOCALSTORAGE_KEY = '.todomvc-user';
var SERVER = 'ws://localhost:3000';

function generateID(prefix) {
  prefix = prefix || 'anon';
  return prefix + Swarm.Spec.int2base((Math.random() * 10000) | 0);
}

function getUserID() {
  var userID = window.localStorage.getItem(LOCALSTORAGE_KEY);

  if (!userID) {
    userID = generateID();
    window.localStorage.setItem(LOCALSTORAGE_KEY, userID);
  }

  return userID;
}

function getHost(userID) {
  var host = new Swarm.Host(userID + '~todomvc', 0, new DummyStorage());
  Swarm.setLocalhost(host);
  host.connect(SERVER);
  return host;
}

var userID = getUserID();
var host = getHost(userID);

module.exports = {
  userID: userID,
  host: host
};
