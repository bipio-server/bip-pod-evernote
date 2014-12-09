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
});

OnNewNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod,
    $resource = this.$resource;

  pod.findNotesInNotebook(sysImports, channel.config.notebook_guid, null, null, function(err, result) {
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
