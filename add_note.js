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

function AddNote(podConfig) {
  this.name = 'add_note';
  this.title = 'Add a Note';
  this.description = 'Adds a Note to one of your Notebooks';
  this.trigger = false;
  this.singleton = false;
  this.auto = false;
  this.podConfig = podConfig;
}

AddNote.prototype = {};

AddNote.prototype.getSchema = function() {
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
        "title" : {
          "type" :  "string",
          "description" : "Title"
        },
        "content" : {
          "type" :  "string",
          "description" : "Content"
        }
      },
      "required" : [ "title", "content" ]
    },
    "exports": {
      "properties" : {
        "outstring" : {
          "type" : "string",
          "description" : "String goes out"
        }
      }
    },
    'renderers' : {
      'hello' : {
        description : 'Hello World',
        description_long : 'Hello World',
        contentType : DEFS.CONTENTTYPE_XML
      }     
    }
  }
}

AddNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
  var pod = this.pod;
  
  if (imports.title && imports.content) {
    var noteStore = pod.getNoteStore(sysImports);
    
    var noteBody = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
    noteBody += "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">";
    noteBody += "<en-note>" + imports.content + "</en-note>";

    var newNote = pod.newNote();
    newNote.title = imports.title;
    newNote.content = noteBody;
    newNote.notebookGuid = channel.config.notebook_guid;

    noteStore.createNote(newNote, function(err, note) {
      next(err, note);
    });    
  }
}

// -----------------------------------------------------------------------------
module.exports = AddNote;
