/*
	@autor: Robin Giles Ribera
	* Module: TrackNetwork
	* Used on trackevent.js
*/

define( [ "dialog/dialog" ], function( Dialog ) {

	function TrackNetwork(app) {
		var stage, layer, dialog, $wrapper, lineMouse, lineBack, $instStart, instStart, $scrollHandle,
			GREEN = "MediumSeaGreen",
			GREY = "silver",
			BLUE = "royalblue",
			RED = "red",
			_trackHeigh,
			_scrollLeft = 0,
			_scrollTop = 0,
			drawing = false,
			firstRun = true,
			setMediaDragging,
			setMediaResizing,
			trackNetwork = this;

		this.getTrackEvent = function(id) {
			return app.getTrackEvents("id", id)[0];
		}

		this.clearLayer = function() {
			layer.children.splice(0);
			layer.draw();
		}

		this.redrawLayer = function() {
			layer.draw();
		}

		Object.defineProperties( this, {
			stageReady: {
				enumerable: true,
				configurable: false,
				get: function(){
					return !!stage;
				}
			},
			isDragging: {
				enumerable: true,
				configurable: false,
				get: function(){
					return !!setMediaDragging;
				}
			},
			isDrawing: {
				enumerable: true,
				configurable: false,
				get: function(){
					return drawing;
				}
			}
		});

		// Create Layer Canvas
		this.createCanvas = function() {
			if (!stage) {
				try {
					$wrapper = $("#tracks-container-wrapper");
					$scrollHandle = $wrapper.find("#tracks-container");
					_trackHeigh = app.tracks[0].view.element.offsetHeight;
					stage = new Kinetic.Stage({
						container: 'tracks-container-canvas'
					});
					layer = new Kinetic.Layer();
					stage.add(layer);
					stage.$content = $(stage.content);
				} catch(err) {
					stage = undefined;
					return false
				}
				layer.lines = {}; // Object to save lines by ID
				layer.linesTo = {};
				this.listenEvents(stage, layer);
			}
			_scrollLeft = $wrapper[0].scrollLeft;
			_scrollTop  = $scrollHandle.position().top;
			stage.setWidth($wrapper.width());
			stage.setHeight($wrapper.height());
			return true;
		}

		// List all tracks and then calculate coords for lines.
		this.calculateLines = function(evType, evTrack) {
			if (!this.createCanvas()) return;
			var tracks = app.orderedTrackEventsSet,
				tempTracksIDs,
				updateEndID,
				drawn,
				setMedia,
				fromSetMedia;

			// Remove all lines when is trackeventremoved
			if (evType === "trackeventremoved" && !!evTrack) { //evTrack are selectedTrackevents
				for (var i in evTrack) {
					this.cleanOldLines(evTrack[i], {});
					this.removeLinesToEnd(evTrack[i].id);
				}
				fromSetMedia = evTrack[evTrack.length-1].popcornOptions.setMedia;
				setMedia = evTrack[0].popcornOptions.setMedia;
				if (fromSetMedia > 0) {
					--fromSetMedia;
				}
			}

			// If automatic lines is true just redraw manual lines
			if (app.project.automaticLines !== "true" && !firstRun) {
				this.updateLinesOfLayer();
				if (tracks.length > 0) {
					layer.draw();
				}
				if (firstRun) firstRun = false;
				return;
			}

			// Update just the evTrack's set
			if (evType === "trackeventupdated" && !!evTrack) {
				updateEndID = evTrack.id // this.updateLinesToEnd(evTrack.id);
				setMedia = evTrack.popcornOptions.setMedia;
				fromSetMedia = setMedia;
				if (setMediaResizing < fromSetMedia) {
					fromSetMedia = setMediaResizing;
				}
				else if (setMediaResizing > setMedia) {
					setMedia = setMediaResizing;
				}
				if (setMediaResizing) {
					setMediaResizing = undefined;
				}
				if (fromSetMedia > 0) {
					--fromSetMedia;
				}
			}
			else if (evType === "pasteTrackEvents" && app.selectedEvents.length > 0) {
				// Update until the last selected
				setMedia = app.sortedSelectedEvents[0].popcornOptions.setMedia;
				// Update from first selected TE
				fromSetMedia = app.sortedSelectedEvents[app.sortedSelectedEvents.length-1].popcornOptions.setMedia;
				if (fromSetMedia > 0) {
					--fromSetMedia;
				}
			}
			else if (evType === "dropfinished" && !!app.sortedSelectedEvents.length > 0) { // Only selected Events might be dropped
				var selected = app.sortedSelectedEvents;
				updateEndID = selected[selected.length-1].id //this.updateLinesToEnd(selected[selected.length-1].id);

				fromSetMedia = selected[selected.length-1].popcornOptions.setMedia;
				setMedia = selected[0].popcornOptions.setMedia;
				if (typeof setMediaDragging === "object") {
					// Update from the Dragging trackEvent
					if (setMediaDragging[0] < fromSetMedia) {
						fromSetMedia = setMediaDragging[0];
					}
					// Update until the Dragging trackEvent
					else if (setMediaDragging[1] > setMedia) {
						setMedia = setMediaDragging[1];
					}
				}

				if (fromSetMedia > 0) {
					--fromSetMedia;
				}
				setMediaDragging = undefined;
			}
			else if (evType === "trackeventdragstarted" && !!evTrack) { // evTrack is dragging
				if (setMediaDragging) return;
				if (app.sortedSelectedEvents.length > 0) {
					setMediaDragging = [
						app.sortedSelectedEvents[app.sortedSelectedEvents.length-1].popcornOptions.setMedia,
						app.sortedSelectedEvents[0].popcornOptions.setMedia
					]
				}
				return;
			}
			else if (evType !== "trackeventremoved") {
				setMedia = tracks.length;
				fromSetMedia = 0;
			}

			// Drawing loop fromSetMedia to setMedia
			for(var i = fromSetMedia; i <= setMedia; i++) {
				var j = Number(i) + 1;
				tempTracksIDs = {} // We save the keys Id of the trackevents

				if( !tracks[j] ) { // there's not next track media
					for (var k in tracks[i]) { // so we clean all lines for every media
						this.drawManualLines(tracks[i][k], tempTracksIDs);
						this.cleanOldLines(tracks[i][k], tempTracksIDs);
					}
					break;
				}; // tracks[j] == Next track media

				// Draw lines
				if (tracks[i].length === 1) {
					if (tracks[i][0].type === "quizme") { // Then draw lines (1-M)
						for (var l in tracks[j]) { // draw lines for the nextSet
							this.drawLine(tracks[i][0], tracks[j][l]);
							tempTracksIDs[tracks[j][l].id] = true; // This means is not a old lines
						}
						this.drawManualLines(tracks[i][0], tempTracksIDs); // Draw manual Lines
						this.cleanOldLines(tracks[i][0], tempTracksIDs); // Clean the old ones
						continue;
					}
				}
				if (tracks[j].length === 1) { // Draw lines (M-1)
					for (var k in tracks[i]) {
						tempTracksIDs = {};
						drawn = this.drawManualLines(tracks[i][k], tempTracksIDs); // Draw manual Lines
						if (!drawn || (!tempTracksIDs[tracks[j][0].id] && tracks[i][k].type === "quizme")) {
							if (this.drawLine(tracks[i][k], tracks[j][0])) {
								tempTracksIDs[tracks[j][0].id] = true; // This means is not a old lines
							}
							this.cleanOldLines(tracks[i][k], tempTracksIDs); // Clean the old ones
						}
					}
				}
				else { // Draw lines with media in the same Track
					for (var k in tracks[i]) {
						tempTracksIDs = {};
						if ( this.drawManualLines(tracks[i][k], tempTracksIDs) ) { // Draw Manual Lines
							continue;
						}
						drawn = false;
						for (var l in tracks[j]) {
							// Then draw line between tracks in the same layer
							if (tracks[i][k].track && tracks[i][k].track) {
								if (tracks[i][k].track.id === tracks[j][l].track.id) {
									if (this.drawLine(tracks[i][k], tracks[j][l])) {
										drawn = true;
									}
									tempTracksIDs[tracks[j][l].id] = true; // This means is not a old lines
									break; // Just one line
								}
							}
						}
						if (!drawn || tracks[i][k].type === "quizme") {
							this.cleanOldLines(tracks[i][k], tempTracksIDs); // Clean the old ones
						}
					}
				}
			}

			if (tracks.length > 0) {
				if (evType === "pasteTrackEvents" || evType === "dropfinished") {
					this.updateLinesOfLayer();
				} else if (evType === "trackeventupdated") {
					this.updateLinesToEnd(updateEndID);
				}
				layer.draw();
			}
			if (firstRun) firstRun = false;
		}

		// calculate and redraw all lines of the layer
		this.updateLinesOfLayer = function(evType) {
			var scrollTop_Old = _scrollTop;
			if (!stage) {
				this.calculateLines();
				return;
			} else {
				this.createCanvas();
			}

			// When evType is "scroll" just update when the scrollbar is "vertical"
			if (evType === "scroll" && scrollTop_Old === _scrollTop) {
				return; // scrollTop_Old == _scrollTop => scroll is horizontal
			}

			var points;
			Object.keys(layer.lines).forEach(function(id) {
				points = trackNetwork.calculatePoints(
					layer.lines[id].startTrackEvent,
					layer.lines[id].endTrackEvent,
					layer.lines[id].backward
				);
				if (!points) return;
				// update points of every line
				layer.lines[id].setPoints(points);
			});
			layer.draw();
		}

		this.updateLinesToEnd = function(endID) {
			if (typeof layer.linesTo[endID] === "object") {
				Object.keys(layer.linesTo[endID]).forEach(function(startID) {
					points = trackNetwork.calculatePoints(
						layer.linesTo[endID][startID].startTrackEvent,
						layer.linesTo[endID][startID].endTrackEvent,
						layer.linesTo[endID][startID].backward
					);
					if (!points) return;
					// update points of every line
					layer.linesTo[endID][startID].setPoints(points);
				});
			}
		}

		this.removeLinesToEnd = function(endID) {
			if (typeof layer.linesTo[endID] === "object") {
				Object.keys(layer.linesTo[endID]).forEach(function(startID) {
					trackNetwork.removeLine(layer.linesTo[endID][startID].startTrackEvent, endID);
				});
			}
		}

		this.calculatePoints = function(start, end, backward) {
			var aux, track, trackOrder, trackTop,
				$start = start.$element;
				$end = end.$element;
			try { // Points (Start , End)
				var start_x = $start.position().left + $start.width() - _scrollLeft;
				var start_y = $start.parent().position().top + $start.height()/2 + _scrollTop;
				var end_x   = $end.position().left - _scrollLeft;
				var end_y   = $end.parent().position().top + $end.height()/2 + _scrollTop;
			} catch(ex) {
				return false;
			}
			aux = [start_x, start_y];

			// calculate the points for a backward line
			if (backward) {

				track = start.track._media.findNextAvailableTrackFromTimes(
					end.popcornOptions.start,
					start.popcornOptions.end);
				if (!track) {
					track = start.track._media.orderedTracks[start.track._media.tracks.length-1]; // last Track
					trackOrder = track.order + 1;
				} else {
					trackOrder = track.order;
				}
				// Width of the backwardline
				var widthOffsetEnd, widthOffsetStart;
				if ($end.width() <= 20) {
					widthOffsetEnd = 2;
				} else {
					widthOffsetEnd = 10;
				}
				if ($start.width() <= 20) {
					widthOffsetStart = 2;
				} else {
					widthOffsetStart = 10;
				}

				// trackTop for 'start' trackEvent
				trackTop = (trackOrder - start.track.order) * _trackHeigh;
				// point 2
				aux.push( start_x + widthOffsetStart );
				aux.push( start_y + (trackOrder - start.track.order)*_trackHeigh/2 );
				// point 3
				aux.push( start_x + widthOffsetStart );
				aux.push( start_y + trackTop );
				// trackTop for 'end' trackEvent
				trackTop = (trackOrder - end.track.order) * _trackHeigh;
				// point 4
				aux.push( end_x - widthOffsetEnd );
				aux.push( aux[5] ); // same as point3
				// point 5
				aux.push( end_x - widthOffsetEnd );
				aux.push( end_y + (trackOrder - end.track.order)*_trackHeigh/2 );
			}

			aux.push(end_x);
			aux.push(end_y);
			return aux;
		}

		// Draw Lines between two points
		this.drawLine = function(start, end, options) {
			if ( options === undefined ) options = {};
			if (!options.manual) {
				if ( start.lines.isDeletedLine(end.id) ) {
					return false; // Line was removed
				}
				else if (start.type !== "quizme") {
					return false;
				}
			}
			
			var points = this.calculatePoints(start, end, options.backward);
			if (!points) {
				return false;
			}

			if ( start.lines.isLine(end.id) ) { // if there is a kinetic line
				var lineEvt = start.lines.allLines[end.id];
					line = start.lines.allLines[end.id].line,
					update = false;
				line.setPoints(points);
				if (lineEvt.manual || options.manual) {
					line.attrs.stroke = GREEN; // change color
				}
				if (options.manual && options.manual !== lineEvt.manual) {
					lineEvt.rule.manual = options.manual;
					lineEvt.manual = options.manual;
					line.manual = options.manual;
					update = true;
				}
				if (options.backward && options.backward !== lineEvt.backward) {
					lineEvt.rule.backward = options.backward;
					lineEvt.backward = options.backward;
					line.backward = options.backward;
					update = true;
				}
				// Remove others lines and sync options to popcorn
				if ( this.removeOthersLines(start, end.id) || update ) {
					start.lines.update();
				}
			}
			else if ( start.lines.isRefLine(end.id) ) {
				var lineEvt = start.lines.allLines[end.id];
				// We need to create the line
				var line = new Kinetic.Line({ // Create Kinetic Line
					points: points,
					stroke: lineEvt.manual? GREEN:GREY,
					strokeWidth: 5,
					lineCap: 'round',
					lineJoin: 'round',

				});
				// Create event popup dialog for line
				line.on('click', function (ev) {
					var position = {};
					if (ev.offsetX) {
						position.left = ev.offsetX;
						position.top  = ev.pageY;
					} else { // Firefox
						position.left = ev.pageX - stage.$content.offset().left;
						position.top  = ev.pageY;
					}
					dialog = Dialog.spawn( "dinamic", {
						data: {
							position: position,
							trackEventStart: start,
							endID: end.id
						},
						events: {
							delete: function(e) {
								trackNetwork.removeLine(e.data.instance, e.data.endID);
								dialog.close();
							}
						}
					});
					dialog.open( "empty" );
					trackNetwork.calculateLines("trackeventupdated", start);
				});
				layer.add(line);

				line.manual = lineEvt.manual;
				line.backward = lineEvt.backward;
				// Save references to the tracks events
				line.startTrackEvent = start;
				line.endTrackEvent = end;
				this.saveLineInLayer(line);
				start.lines.setLine( end.id, {
					line: line,
					endInstance: end
				});

				return true;
			}
			else { // New line
				var line = new Kinetic.Line({ // Create Kinetic Line
					points: points,
					stroke: options.manual? GREEN:GREY,
					strokeWidth: 5,
					lineCap: 'round',
					lineJoin: 'round'
				});

				// Create event popup dialog for line
				line.on('click', function (ev) {
					var position = {};
					if (ev.offsetX) {
						position.left = ev.offsetX;
						position.top  = ev.pageY;
					} else { // Firefox
						position.left = ev.pageX - stage.$content.offset().left;
						position.top  = ev.pageY;
					}
					dialog = Dialog.spawn( "dinamic", {
						data: {
							position: position,
							trackEventStart: start,
							endID: end.id
						},
						events: {
							delete: function(e) {
								trackNetwork.removeLine(e.data.instance, e.data.endID);
								dialog.close();
							}
						}
					});
					dialog.open( "empty" );
					trackNetwork.calculateLines("trackeventupdated", start);
				});

				layer.add(line);

				// Save references to the tracks events
				line.startTrackEvent = start;
				line.endTrackEvent = end;
				this.saveLineInLayer(line);
				if (options.manual) line.manual = true;
				if (options.backward) line.backward = true;
				// Save "line" and "popup rule" into the object
				start.lines.addLine(end, {
					backward: options.backward,
					manual: options.manual,
					line: line,
				});
				return true;
			}
			return true;
		}

		this.drawManualLines = function(trackA, tempKeys) {
			if (!tempKeys) tempKeys = {};
			var options = {manual: true},
				drawn = false,
				trackB,
				allLines = trackA.lines.allLines;

			Object.keys(allLines).forEach(function(id) {
				if (!tempKeys[id] && !!allLines[id] && allLines[id].manual) {
					trackB = trackNetwork.getTrackEvent( id );
					if (!!trackB) {
						// if the drawing is backwards then draw a backwards-line with options backward = true
						if (trackA.popcornOptions.setMedia !== trackB.popcornOptions.setMedia) {
							if (trackA.popcornOptions.start >= trackB.popcornOptions.start) { // Draw Backward Line
								options.backward = true;
							}
						}
						else { // Draw Backward Line in Same Set
							options.backward = true;
						}

						if ( trackNetwork.drawLine(trackA, trackB, options) ) {
							tempKeys[id] = true;
							drawn = true;
						}
					}
				}
			});
			return drawn;
		}

		// Draw line from mouse event
		this.drawLineFromEvent = function($objA, $objB, options) {
			if ( !$objA.jquery || !$objB.jquery ) return;
			var trackA = this.getTrackEvent( $objA.attr('data-butter-trackevent-id') );
			var trackB = this.getTrackEvent( $objB.attr('data-butter-trackevent-id') );
			if (!trackA || !trackB) return;
			// if some trackEvent is a SubTrackEvent look for the parent
			if (trackA.superTrackEvent.isSubTrackEvent) {
				trackA = trackA.superTrackEvent.parent;
			}
			if (trackB.superTrackEvent.isSubTrackEvent) {
				trackB = trackB.superTrackEvent.parent;
			}

			// if the drawing is backwards then draw a backwards-line with options backward = true
			if (trackA.popcornOptions.setMedia !== trackB.popcornOptions.setMedia) {
				if (trackA.popcornOptions.start >= trackB.popcornOptions.start) { // Draw Backward Line
					options.backward = true;
				}
			}
			else { // Draw Backward Line in Same Set
				options.backward = true;
			}
			this.drawLine(trackA, trackB, options);
		}

		// calculate and redraw all lines of the layer
		this.removeAutomaticLines = function() {
			Object.keys(layer.lines).forEach(function(id) {
				// if it's an automatic line then remove it
				if (!layer.lines[id].manual) {
					trackNetwork.removeAutomaticLine(
						layer.lines[id].startTrackEvent, layer.lines[id].endTrackEvent.id
					);
				}
			});
			layer.draw();
		}
		this.removeAutomaticLine = function(instance, endId) {
			var lineEvt = instance.lines.allLines[endId];
			if (!lineEvt.backward) {
				this.enableAll(this, lineEvt.endInstance); // active trackEvents of this branch
			}
			instance.lines.removeLine(endId);

			lineEvt.line.remove();
			trackNetwork.removeLineInLayer(lineEvt.line); // remove reference in the layer
			// layer.draw();
		}

		this.removeOthersLines = function(obj, id) {
			var update = false;

			// if it's not a trackEvent quizme then remove all lines before
			if (obj.type !== "quizme") {
				var lineID,
					allLines = obj.lines.allLines;
				Object.keys(allLines).forEach(function(trackID) {
					if (obj.lines.isLine(trackID) && id !== trackID) {
						lineID = allLines[trackID].line._id;
						obj.lines.removeLine(trackID, true); // Remove line from TrackEvent
						layer.lines[lineID].remove(); // Remove line from layer children
						if (allLines[trackID] && allLines[trackID].line) {
							trackNetwork.removeLineInLayer(allLines[trackID].line); // Delete from layer
						}
						update = true;
					}
				});
			}
			return update;
		}

		this.saveLineInLayer = function(line) {
			layer.lines[line._id] = line;
			if (typeof(layer.linesTo[line.endTrackEvent.id]) === "object") {
				layer.linesTo[line.endTrackEvent.id][line.startTrackEvent.id] = line;
			}
			else {
				layer.linesTo[line.endTrackEvent.id] = {}
				layer.linesTo[line.endTrackEvent.id][line.startTrackEvent.id] = line;
			}
		}
		this.removeLineInLayer = function(line) {
			delete layer.lines[line._id];
			if (line.endTrackEvent && layer.linesTo[line.endTrackEvent.id]) {
				if (line.startTrackEvent && layer.linesTo[line.endTrackEvent.id][line.startTrackEvent.id]) {
					delete layer.linesTo[line.endTrackEvent.id][line.startTrackEvent.id];
				}
			}
		}

		// Remove old lines references
		this.cleanOldLines = function(obj, tempKeys) {
			var allLines = obj.lines.allLines,
				update = false, lineID;

			Object.keys(allLines).forEach(function(trackID) {
				if (!tempKeys[trackID] && obj.lines.isLine(trackID)) { // It's an old line
					lineID = allLines[trackID].line._id;
					obj.lines.removeLine(trackID, true); // Remove line from TrackEvent
					layer.lines[lineID].remove(); // Remove line from layer children
					trackNetwork.removeLineInLayer(layer.lines[lineID]); // Delete from layer
					update = true;
				}
			});
			if (update) {
				obj.lines.update();
			}
		}

		// Active all instance of this branch
		this.enableAll = function(that, instance) {
			if (typeof instance !== "object") return; // removed instance
			if (instance.superTrackEvent.isSuperTrackEvent) { // Enable all SubTrackEvents
				instance.superTrackEvent.subTrackEvents.forEach(function(id) {
					instance.superTrackEvent.subTrackEvents[id].update({disable: false});
				});
			}
			if ( instance.lines.isLeafNode() ) { // Leaf node
				instance.update({disable: false});
			} else {
				var lineEvt = instance.lines;
				Object.keys(lineEvt.allLines).forEach(function(id) {
					if (lineEvt.allLines[id] && !lineEvt.allLines[id].deleted && !lineEvt.allLines[id].backward) {
						that.enableAll(that, lineEvt.allLines[id].endInstance);
					}
				});
				instance.popcornOptions.disable = false;
				//instance.update({disable: false});
			}
		}

		this.removeLine = function(instance, id) {
			var lineEvt = instance.lines.allLines[id];
			// False means It's a deleted line
			if (!lineEvt.backward) {
				this.enableAll(this, lineEvt.endInstance); // active trackEvents of this branch
			}
			instance.lines.setDeletedLine(id);

			lineEvt.line.remove();
			this.removeLineInLayer(lineEvt.line); // remove reference in the layer
			layer.draw();
		}

		this.calculatePointsEvent = function(start, points) {
			var aux, track, trackOrder, trackTop;
			aux = [points[0], points[1]];
			// calculate the points for a backward line
			track = start.track._media.findNextAvailableTrackFromTimes(
				start.popcornOptions.start,
				start.popcornOptions.end);
			if (!track) {
				track = start.track._media.orderedTracks[start.track._media.tracks.length-1]; // last Track
				trackOrder = track.order + 1;
			} else {
				trackOrder = track.order;
			}
			// trackTop for 'start' trackEvent
			trackTop = (trackOrder - start.track.order) * _trackHeigh;
			// point 2
			aux.push( points[0] + 15 );
			aux.push( points[1] + (trackOrder - start.track.order)*_trackHeigh/2 );
			// point 3
			aux.push( points[0] + 15 );
			aux.push( points[1] + trackTop );
			// point 4
			aux.push( points[2] );
			aux.push( points[1] + trackTop );
			// point 5
			aux.push( points[2] /*- _scrollLeft*/);
			aux.push( points[3] /*+ _scrollTop*/);

			return aux;
		}

		// Reset all events and then bind the events again (cause live events seem dont works)
		this.onHandlePointMousedown = function(trackEventStart) {
			if (drawing) {
				drawing = false;
				layer.draw();
			}
			else {
				instStart = trackEventStart;
				$instStart = trackEventStart.$element;
				var $that = $instStart.find(".handle-point"),
					$wrap = $instStart.parent();

				lineMouse = new Kinetic.Line({
					points: [0, 0, 50, 50],
					strokeWidth: 3,
					stroke: RED,
					lineCap: 'round',
					lineJoin: 'round',
					shadowColor: GREY,
					shadowBlur: 6,
					shadowOffset: 4,
					shadowOpacity: 0.4
				});
				lineBack = new Kinetic.Line({
					points: [0, 0, 50, 50],
					strokeWidth: 3,
					stroke: BLUE,
					lineCap: 'round',
					lineJoin: 'round',
					shadowColor: GREY,
					shadowBlur: 6,
					shadowOffset: 4,
					shadowOpacity: 0.2
				});
				layer.add(lineMouse);
				layer.add(lineBack);
				//start point and end point are the same
				var points = [
					$that.parent().position().left + $that.position().left - _scrollLeft,
					$wrap.position().top + $that.outerHeight()/2 + $that.position().top +1.5 + _scrollTop
				];
				points.push(points[0]);
				points.push(points[1]);
				lineMouse.setPoints(points);

				drawing = true;
				layer.draw();
			}

		}

		// Drawing lines along the cursor path
		this.listenEvents = function(stage, layer) {
			var points, pointOrig, pointDest, $src, $parent;

			// Try to close dialog when blur
			$("#butter-tray").on("mousedown", function(e) {
				try { dialog.close() } catch(err) {};
				app.deselectAllTrackEvents();
			});

			$wrapper.on("mousemove", function(e) {
				if (!drawing) return true;
				e.stopPropagation();
				e.preventDefault();
				if (!e.srcElement) {
					$src = $(e.originalEvent.originalTarget);
				} else {
					$src = $(e.srcElement);
				}
				// If track-event is hovered then calculate 'end-point-line'
				if ($src.parents(".butter-track-event").length > 0 || $src.hasClass("butter-track-event")) {
					$parent = $src.parents(".butter-track-event");
					if ($src.hasClass("butter-track-event")) $parent = $src;
					lineMouse.getPoints()[1].x = $parent.position().left - _scrollLeft;
					lineMouse.getPoints()[1].y = $parent.height()/2 + $parent.parent().position().top  + _scrollTop;
				} else {
					if (e.offsetX) {
						lineMouse.getPoints()[1].x = e.offsetX;
						lineMouse.getPoints()[1].y = e.offsetY;
					} else { // Firefox
						lineMouse.getPoints()[1].x = e.pageX - stage.$content.offset().left;
						lineMouse.getPoints()[1].y = e.pageY - stage.$content.offset().top;
					}
				}
				pointOrig = lineMouse.getPoints()[0];
				pointDest = lineMouse.getPoints()[1];
				if (pointDest.x - pointOrig.x < 0) {
					points = trackNetwork.calculatePointsEvent(instStart,
						[pointOrig.x, pointOrig.y, pointDest.x, pointDest.y]
					);
					lineBack.setPoints(points);
					lineBack.show();
				} else {
					lineBack.hide();
				}			
				layer.draw();
			});

			$wrapper.on("mouseup", function(e) {
				if (!drawing) return true;
				e.stopPropagation();
				e.preventDefault();
				drawing = false;

				if (!e.srcElement) {
					$src = $(e.originalEvent.originalTarget);
				} else { // Firefox
					$src = $(e.srcElement);
				}
				lineMouse.remove();
				lineBack.remove();

				if ($src.parents(".butter-track-event").length > 0 || $src.hasClass("butter-track-event")) {
					$parent = $src.parents(".butter-track-event");
					$src.hasClass("butter-track-event") && !!($parent = $src);
					trackNetwork.drawLineFromEvent($instStart, $parent, {manual: true});
				}
				layer.draw();
			});


			app.listen("handlepointmousedown", function(e) {
				trackNetwork.onHandlePointMousedown(e.data);
			});

			app.listen("plugindroppedstopped", function(e) {
				trackNetwork.calculateLines("trackeventupdated", e.data);
			});
			app.listen("trackeventupdatedbounds", function(e) {
				if (setMediaDragging) return;
				app.sortTrackEvents2(app.orderedTrackEvents);
				app.sortTrackEventsBySet( app.orderedTrackEvents );
				trackNetwork.calculateLines("trackeventupdated", e.data);
			});
			app.listen("mediaready", function() {
				trackNetwork.updateLinesOfLayer();
			});
			app.listen("trackeventresizestartedbounds", function(e) {
				setMediaResizing = e.data.popcornOptions.setMedia;
			});
			app.listen("sortended", function(e) {
				trackNetwork.updateLinesOfLayer();
			});
			app.listen("trackadded", function() {
				trackNetwork.updateLinesOfLayer();
			});
			app.editor.listen( "editortoggled", function() {
				trackNetwork.updateLinesOfLayer();
			});
			window.addEventListener( "resize", function() {
				trackNetwork.updateLinesOfLayer();
			});

			// When mouse drawing highlight track-event box
			app.listen("trackeventhover", function(e) {
				if (drawing) e.data.classList.add("highlight");
			});
			app.listen("trackeventunhover", function(e) {
				e.data.classList.remove("highlight");
			});
		}
	}

	return TrackNetwork;
});