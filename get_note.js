/**
 *
 * @author Michael Pearson <michael@bip.io>
 * Copyright (c) 2010-2015 WoT.IO
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

function GetNote() {}

GetNote.prototype = {};

GetNote.prototype.invoke = function(imports, channel, sysImports, contentParts, next) {
	var pod = this.pod;

  pod.getNote(sysImports, imports.note_guid, function(err, note) {
  	if (err) {
  		next(err);
  	} else {
      note.note = pod.xml2json(note.content)['en-note'];
      next(false, note);
  	}
  });
}

// -----------------------------------------------------------------------------
module.exports = GetNote;
