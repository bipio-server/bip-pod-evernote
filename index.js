/**
 * 
 * @author Michael Pearson <michael@bip.io>
 * Copyright (c) 2010-2014 WoT.IO
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *  
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
var Pod = require('bip-pod'),
  EVClient = require('evernote').Evernote,
  EverNote = new Pod({
    name : 'evernote', // pod name (action prefix)
    title : 'EverNote', // short description
    description : '<a href="https://evernote.com" target="_blank">Evernote</a> is the place to collect inspirational ideas, write meaningful words, and move your important projects forward',
    authType : 'oauth',
    passportStrategy : require('passport-evernote').Strategy,
    config : {
      "oauth": {
        "consumerKey" : "",
        "consumerSecret" : ""
      }
    },
    'renderers' : {
      'get_notebooks' : {
        description : 'Get Notebooks',
        contentType : DEFS.CONTENTTYPE_JSON
      }
    }
  });

EverNote.newNote = function(noteText) {
  return new EVClient.Note();
}

EverNote.getNoteStore = function(sysImports) {
  return this.getClient(sysImports).getNoteStore();
}

EverNote.getClient = function(sysImports) {
  return new EVClient.Client({
    token : sysImports.auth.oauth.token
  });  
}

EverNote.rpc = function(action, method, sysImports, options, channel, req, res) {
  var podConfig = this.getConfig(),
  self = this,
  profile = JSON.parse(sysImports.auth.oauth.profile),
  opts, client;

  if (method == 'get_notebooks') {
    client = this.getClient(sysImports);
    client.getNoteStore().listNotebooks(function(err, notebooks) {
      if (err) {        
        res.status(500).send(err);
      } else {
        res.status(200).send(notebooks);
      }      
    });
  } else {
    this.__proto__.rpc.apply(this, arguments);    
  }
}

// Include any actions
EverNote.add(require('./add_note.js'));

// -----------------------------------------------------------------------------
module.exports = EverNote;
