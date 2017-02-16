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

var Q = require('q');

function AddNote(podConfig) {}

AddNote.prototype = {};

AddNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod,
    $resource = this.$resource,
    noteStore = pod.getNoteStore(sysImports),
    noteBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    newNote = pod.newNote();

  newNote.title = imports.title;

  noteBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";

  newNote.notebookGuid = imports.notebook_guid;

  if (imports.tags) {
    if ($resource.helper.isArray(imports.tags)) {
      newNote.tagNames = imports.tags;
    } else if ($resource.helper.isString(imports.tags)) {
      newNote.tagNames = imports.tags.split(',').map(function(tag) {
        return tag.trim();
      });
    }
  }

  if (contentParts._files && contentParts._files.length) {
    var deferred, promises = [];
    for (var i = 0; i < contentParts._files.length; i++) {
      deferred = Q.defer();
      promises.push(deferred.promise);

      (function(deferred) {
        pod.getFileResource(contentParts._files[i], function(err, resource) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(resource);
          }
        });
      })(deferred);
    }

    Q.all(promises).then(function(resources) {
      newNote.resources = resources;

      noteBody += "<en-note>" + imports.note;

      if (imports.embed_attachments) {
        for (var i = 0; i < resources.length; i++) {
          noteBody += '<en-media type="' + resources[i].mime + '" hash="' + resources[i].data.bodyHash + '" />';
        }
      }

      noteBody += '</en-note>';

      newNote.content = noteBody;

      noteStore.createNote(newNote, function(err, note) {
        next(err, note);
      });
    }, function(err) {
      next(err);
    });
  } else {

    noteBody += "<en-note>" + imports.note;
    noteBody += '</en-note>';
    newNote.content = noteBody;

    noteStore.createNote(newNote, function(err, note) {
      next(err, note);
    });
  }

}

// -----------------------------------------------------------------------------
module.exports = AddNote;
