/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * TodoStore
 */

var EventEmitter  = require('events').EventEmitter;
var Text          = require('swarm/lib/Text');
var merge         = require('react/lib/merge');
var AppDispatcher = require('../dispatcher/AppDispatcher');
var TodoConstants = require('../constants/TodoConstants');
var TodoList      = require('../models/TodoList');
var TodoItem      = require('../models/TodoItem');
var UserStore     = require('./UserStore');

var CHANGE_EVENT = 'change';

var todoList = window.todoList = new TodoList('/TodoList#todos');

function mkTodoItemID(id) {
  return '/TodoItem#' + id;
}

function mkTodoTextID(id) {
  return '/Text#' + id;
}

/**
 * Create a TODO item.
 * @param  {string} text The content of the TODO
 */
function create(text) {
  // Hand waving here -- not showing how this interacts with XHR or persistent
  // server-side storage.
  // Using the current timestamp in place of a real id.
  var id = Date.now().toString();

  var todoID = '/TodoItem#' + id;
  var todo = new TodoItem(todoID);

  var todoTextID = '/Text#' + id;
  var todoText = new Text(todoTextID);

  todo.set({text: todoTextID});
  todoText.set(text);
  todoList.addObject(todo);
}

/**
 * Update a TODO item.
 * @param  {string} id 
 * @param {object} updates An object literal containing only the data to be 
 *     updated.
 */
function update(id, updates) {
  var todoItem = todoList.get(mkTodoItemID(id));
  todoItem.set(updates);
}

function updateText(id, text) {
  var todoText = UserStore.host.get(mkTodoTextID(id));
  todoText.set(text);
}

/**
 * Update all of the TODO items with the same object. 
 *     the data to be updated.  Used to mark all TODOs as completed.
 * @param  {object} updates An object literal containing only the data to be 
 *     updated.

 */
function updateAll(updates) {
  todoList.list().forEach(function(item) {
    update(item._id, updates);
  });
}

/**
 * Delete a TODO item.
 * @param  {string} id
 */
function destroy(id) {
  todoList.removeObject(mkTodoItemID(id));
}

/**
 * Delete all the completed TODO items.
 */
function destroyCompleted() {
  todoList.list().forEach(function(item) {
    if (item.complete) {
      destroy(item._id);
    }
  });
}

var TodoStore = window.TodoStore = merge(EventEmitter.prototype, {
  
  /**
   * Gets called by Swarm to deliver changes.
   */
  deliver: function(spec, value, source) {
    todoList.list().forEach(function(item) {
      var text = UserStore.host.get(mkTodoTextID(item._id));

      item.off(TodoStore);
      item.on(TodoStore);

      text.off(TodoStore);
      text.on(TodoStore);
    });
    console.debug('CHANGE_EVENT');
    this.emit(CHANGE_EVENT);
  },

  /**
   * Tests whether all the remaining TODO items are marked as completed.
   * @return {booleam}
   */
  areAllComplete: function() {
    return todoList.list().every(function(item) { return item.complete; });
  },

  /**
   * Get the entire collection of TODOs.
   * @return {object}
   */
  getAll: function() {
    // We don't want to expose Syncables so we map the result.
    var all = todoList.list().map(function(item) {
      var text = UserStore.host.get(mkTodoTextID(item._id));
      return {
        id: item._id,
        text: text.text,
        complete: item.complete
      };
    });
    return all;
  },

  /**
   * @param {function} callback
   */
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },

  /**
   * @param {function} callback
   */
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

// Register to handle all updates
AppDispatcher.register(function(payload) {
  var action = payload.action;
  var text;

  switch(action.actionType) {
    case TodoConstants.TODO_CREATE:
      text = action.text.trim();
      if (text !== '') {
        create(text);
      }
      break;

    case TodoConstants.TODO_TOGGLE_COMPLETE_ALL:
      if (TodoStore.areAllComplete()) {
        updateAll({complete: false});
      } else {
        updateAll({complete: true});
      }
      break;

    case TodoConstants.TODO_UNDO_COMPLETE:
      update(action.id, {complete: false});
      break;

    case TodoConstants.TODO_COMPLETE:
      update(action.id, {complete: true});
      break;

    case TodoConstants.TODO_UPDATE_TEXT:
      text = action.text.trim();
      if (text !== '') {
        updateText(action.id, text);
      }
      break;

    case TodoConstants.TODO_DESTROY:
      destroy(action.id);
      break;

    case TodoConstants.TODO_DESTROY_COMPLETED:
      destroyCompleted();
      break;

    default:
      return true;
  }

  // This often goes in each case that should trigger a UI change. This store
  // needs to trigger a UI change after every view action, so we can make the
  // code less repetitive by putting it here.  We need the default case,
  // however, to make sure this only gets called after one of the cases above.
  return true; // No errors.  Needed by promise in Dispatcher.
});

todoList.on(TodoStore);

module.exports = TodoStore;
