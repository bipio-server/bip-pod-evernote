/**
 *
 * Copyright (c) 2017 InterDigital, Inc. All Rights Reserved
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    token : sysImports.auth.oauth.access_token,
    sandbox : undefined === sysImports.auth.oauth.sandbox
      ? podConfig.sandbox
      : sysImports.auth.oauth.sandbox
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
  var self = this;

  this.getNoteStore(sysImports).getNote(noteGUID, true, true, true, true, function(err, note) {
    if (err) {
      next(err);
    } else {
      self.getNoteTags(sysImports, note.tagGuids, function(err, tags) {
        note.tagNames = tags;
        next(err, note);
      });
    }
  });
}

EverNote.getNoteTags = function(sysImports, tagGUIDs, next) {
  var tagsDeferred = [],
    self = this,
    _ = this.$resource._,
    defer;

  if (tagGUIDs && tagGUIDs.length) {
    for (var i = 0; i < tagGUIDs.length; i++) {
      defer = Q.defer();
      tagsDeferred.push(defer);

      (function(tagGUID, defer) {
        self.getNoteStore(sysImports).getTag(tagGUID, function(err, tag) {
          if (err) {
            defer.reject(err);
          } else {
            defer.resolve(tag);
          }
        });
      })(tagGUIDs[i], defer);
    }

    Q.all(_.pluck(tagsDeferred, 'promise')).then(
      function(tags) {
        next(false, _.pluck(tags, 'name'));
      },
      function(err) {
        next(err.toString());
      }
    );
  } else {
    next(false, []);
  }
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
