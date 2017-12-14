"use strict";
 /* Pass in a raw JSON object to convert each leaf element 
  * (including those inside arrays) to observables 
  */
function buildModel(data) {
	var model;
	if (typeof data !== 'object') {
		return ko.observable(data);
	} else if (isNaN(data.length)) {
		model = {};
		for (var obj in data) {
			if (typeof data[obj] == 'object') {
				if (isNaN(data[obj].length)) {
					model[obj]=buildModel(data[obj]);
				} else {
					model[obj]=[];
					for(var item in data[obj]) {
						model[obj].push(buildModel(data[obj][item]));
					}
				}
			} else {
				model[obj]=ko.observable(data[obj]);
			}
		}
	} else {
		model=[];
		for(var item in data) {
			model.push(buildModel(data[item]));
		}
	}
	return model;
}

/* Pass in a raw JSON object to convert to a KEY=VALUE post string */
function buildPostString(base, data) {
	var reply="";
	if (typeof data == 'object') {
		for(var key in data) {
			if (typeof data[key] == 'object') {
				if (isNaN(data[key].length)) { // object
					for(var obj in data[key]) {
						reply+=buildPostString(base+key+"_"+obj, data[key][obj]);
					}
				} else {
					for(var index in data[key]) {
						reply+=buildPostString(base+key+"_"+index+"_", data[key][index]);
					}
				}
			} else if (typeof data[key] == 'string') {
				reply+=(base+key+"="+encodeURIComponent(data[key])+"&");
			} else {
				reply+=(base+key+"="+data[key]+"&");
			}
		}
	} else if (typeof data == 'string') {
		reply+=(base+"="+encodeURIComponent(data)+"&");
	} else {
		reply+=(base+"="+data+"&");
	}
	return reply;
}

/* Pass in a knockout object to convert to a raw JSON object */
function extractModel(data) {
	var model;
	if (typeof data !== 'object') {
		return data();
	} else if (isNaN(data.length)) {
		model={};
		for (var obj in data) {
			if (typeof data[obj] == 'object') {
				if (isNaN(data[obj].length)) {
					model[obj]=extractModel(data[obj]);
				} else {
					model[obj]=[];
					for(var item in data[obj]) {
						model[obj].push(extractModel(data[obj][item]));
					}
				}
			} else {
				if (typeof data[obj] == 'function') {
					model[obj]=data[obj]();
				} else {
					model[obj]=data[obj];
				}
			}
		}
	} else {
		model=[];
		for(var item in data) {
			model.push(extractModel(data[item]));
		}
	}
	return model;
}

/* takes a raw JSON object and updates the knockout model as required */
function updateModel(model, data) {
	if (typeof model == 'function') {
		model(data);
	} else {
		for (var obj in model) {
			if (typeof model[obj] == 'object') {
				if (isNaN(model[obj].length)) {
					if (typeof data[obj] != 'undefined') {updateModel(model[obj], data[obj]);}
				} else {
					for(var item in model[obj]) {
						if (typeof data[obj] != 'undefined') {updateModel(model[obj][item], data[obj][item]);}
					}
				}
			} else {
				if ((typeof data[obj] != 'undefined') && (model[obj]()!=data[obj])) {model[obj](data[obj]);}
			}
		}
	}
}

/* Post KEY=VALUE to postFile, call fun() directly after, successCB and errorCB based on
 * response from the POST, update model if requested
 */
function sendSinglePost(postFile, key, val, model, fun, updateKoModel, successCb, errorCb) {
	$.ajax({
		url: postFile,
		dataType: 'json',
		data: key + '=' + val,
		type: 'POST',
		success: function(data, stat, xhr) {
			if(typeof(updateKoModel) === 'boolean' && updateKoModel) {
				updateModel(model, data);				
			}
			if(typeof successCb === 'function') {
				successCb(data);
			}
		},
		error: function() {
			if(typeof errorCb === 'function') {
				errorCb();
			}
		}
	});
	
	if (typeof fun === 'function') { fun(); }
	
	return false;
}

/* post data to postFile and call successCB or errorCB as required */
function sendPost(postFile, data, successCb, errorCb) {
	$.ajax({
		url: postFile,
		dataType: 'json',
		data: data,
		type: 'POST',
		success: function(data, stat, xhr) {
			
			if(typeof successCb === 'function') {
				successCb(data);
			}
		},
		error: function() {
			if(typeof errorCb === 'function') {
				errorCb();
			}
		}
	});
	
	return false;
}
