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

function OnNewNote() {}

OnNewNote.prototype = {};

OnNewNote.prototype.trigger = function(imports, channel, sysImports, contentParts, next) {
  var $resource = this.$resource;

  this.invoke(imports, channel, sysImports, contentParts, function(err, exports) {
    if (err) {
      next(err);
    } else {
      $resource.dupFilter(exports, 'guid', channel, sysImports, function(err, note) {
        next(err, note);
      });
    }
  });

};

OnNewNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod,
    $resource = this.$resource;

  pod.findNotesInNotebook(sysImports, imports.notebook_guid, null, null, function(err, result) {
    var note;

    if (err) {
      next(err);
    } else {
      for (var i = 0; i < result.notes.length; i++) {
        pod.getNote(sysImports, result.notes[i].guid, function(err, note) {
          if (err) {
            next(err);
          } else {
            note.note = pod.xml2json(note.content)['en-note'];
            next(false, note);
          }
        });
      }
    }
  });
}

// -----------------------------------------------------------------------------
module.exports = OnNewNote;
