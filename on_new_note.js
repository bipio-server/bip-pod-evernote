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

function OnNewNote(podConfig) {
  this.name = 'on_new_note';
  this.title = 'On A New Note';
  this.description = 'Triggers when a new Note appears in one of your Notebooks';
  this.trigger = true;
  this.singleton = false;
  this.auto = false;
  this.podConfig = podConfig;
}

OnNewNote.prototype = {};

OnNewNote.prototype.getSchema = function() {
  return {
    "config": {
      "properties" : {
        "notebook_guid" : {
          "type" :  "string",
          "description" : "Notebook GUID",
          "oneOf" : [
            {
              "$ref" : '/renderers/get_notebooks/{guid}'
            }
          ],
          "label" : {
            "$ref" : "/renderers/get_notebooks/{name}"
          }
        }
      },
      "required" : [ "notebook_guid" ]
    },
    "imports": {
      "properties" : {
      }
    },
    "exports": {
      "properties" : {
        "guid" : {
          "type" : "string",
          "description" : "Note GUID"
        },
         "title" : {
          "type" : "string",
          "description" : "Title"
        },
        "content" : {
          "type" : "string",
          "description" : "XML Content"
        },
        "note" : {
          "type" : "string",
          "description" : "Extracted Note"
        },
        "notebookGuid" : {
          "type" : "string",
          "description" : "Notebook GUID"
        }
      }
    }
  }
}

OnNewNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod,
    $resource = this.$resource;

  if (channel.config.notebook_guid) {
    pod.findNotesInNotebook(sysImports, channel.config.notebook_guid, null, null, function(err, result) {
      var note;
      if (err) {
        next(err);
      } else {
        for (var i = 0; i < result.notes.length; i++) {
          $resource.dupFilter(result.notes[i], 'guid', channel, sysImports, function(err, note) {
            if (err) {
              next(err);
            } else {
              pod.getNote(sysImports, note.guid, function(err, note) {
                if (err) {
                  next(err);
                } else {
                  note.note = pod.xml2json(note.content)['en-note'];
                  next(false, note);
                }
              });
            }
          });
        }
      }
    });
  }
}

// -----------------------------------------------------------------------------
module.exports = OnNewNote;
