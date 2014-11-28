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
  passthrough = require('stream').PassThrough,
  Q = require('q'),
  xml2json = require('xml2json'),
  EVClient = require('evernote').Evernote,
  EverNote = new Pod();

EverNote.xml2json = function(payload) {
  return xml2json.toJson(payload, { "object" : true} );
}


EverNote.newFilter = function() {
  return new EVClient.NoteFilter();
}

EverNote.newNote = function(noteText) {
  return new EVClient.Note();
}

EverNote.getNoteStore = function(sysImports) {
  return this.getClient(sysImports).getNoteStore();
}

EverNote.getClient = function(sysImports) {
  var podConfig = this.getConfig();
  return new EVClient.Client({
    token : sysImports.auth.oauth.token,
    sandbox : podConfig.sandbox
  });
}

EverNote.getFileResource = function(fileStruct, next) {
  var self = this;

  self.$resource.file.get(fileStruct, function(err, fileStruct, readStream) {
    if (err) {
      next(err);
    } else {
      var hashStream = new passthrough,
        hashDefer = Q.defer(),
        bufferStream = new passthrough,
        bufDefer = Q.defer(),
        promises = [ hashDefer.promise, bufDefer.promise ];


      readStream.pipe(hashStream);
      self.$resource.stream.toHash(hashStream, function(err, hash) {
        if (err) {
          hashDefer.reject(err);
        } else {
          hashDefer.resolve({ hash : hash });
        }
      });

      readStream.pipe(bufferStream);
      self.$resource.stream.toBuffer(bufferStream, function(err, buffer) {
        if (err) {
          bufDefer.reject(err);
        } else {
          bufDefer.resolve({ buffer : buffer });
        }
      });

      Q.all(promises).then(
        function(results) {
          var buffer, hash, r;

          for (var i = 0; i < results.length; i++) {
            r = results[i];
            if (r.hash) {
              hash = r.hash;
            } else if (r.buffer) {
              buffer = r.buffer;
            }
          }

          var data = new EVClient.Data();

          data.size = fileStruct.size;
          data.bodyHash = hash;
          data.body = buffer;

          resource = new EVClient.Resource();
          resource.mime = fileStruct.type;
          resource.data = data;

          next(false, resource);
        },
        function(err) {
          next(err);
        }
      );
    }
  });
}

EverNote.getNote = function(sysImports, noteGUID, next) {
  this.getNoteStore(sysImports).getNote(noteGUID, true, true, true, true, next);
}

EverNote.findNotesInNotebook = function(sysImports, notebookGUID, page, limit, next) {
  var store = this.getNoteStore(sysImports),
    filter = new EVClient.NoteFilter(),
    meta = new EVClient.NotesMetadataResultSpec();

  filter.notebookGuid = notebookGUID;

  store.findNotesMetadata(filter, page || 0, limit || 100, meta, next);
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

// -----------------------------------------------------------------------------
module.exports = EverNote;
