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

var Q = require('q');

function AddNote(podConfig) {}

AddNote.prototype = {};

AddNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod,
    noteStore = pod.getNoteStore(sysImports),
    noteBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",
    newNote = pod.newNote();

  newNote.title = imports.title;

  noteBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";

  newNote.notebookGuid = channel.config.notebook_guid;

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

      if (channel.config.embed_attachments) {
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
