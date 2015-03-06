var express = require('express');
var router = express.Router();
var session = require('client-sessions');
var mongoose = require('mongoose');
var User = require('../models/user');
var Project = require('../models/project');
var fs = require('fs');

var db = mongoose.connection;

/* GET */
router.get('/homepage', function(req, res, next) {

	// Check if session exists
	if (req.session && req.session.user) {
	    
	    // lookup the user in the DB by pulling their email from the session
	    User.findOne({ email: req.session.user.email }, function (err, user) {

	    	if(err) {
	    		res.send(err);
	    		return;
	    	}

			// if the user isn't found in the DB, reset the session info and
	        // redirect the user to the login page
			if (!user) {

	        	req.session.reset();
	        	res.redirect('/');
	    	} else {
	        
	        	// expose the user to the template
	        	res.locals.user = user;

	    		Project.find({}).sort({'createdAt' : 'desc'}).exec(function(err, projects) {
					
					if(err) {
						res.send(err);
						return;
					}

					var pMap = {};
					pMap["projects"] = [];
					pMap["user"] = [];

					projects.forEach(function(element, index, array) {

						// make sure interested button is only shown to those who do not own the project
						var notowned = element.createdByID != req.session.user._id;
						var border;

						if(notowned) {
							border = "post-border-not-owned";
						} else {
							border = "post-border-owned";
						}

						var elementString = {
							"_id": element._id,
							"createdAt": element.createdAt.toString().substring(4,15),
							"title": element.title,
							"type": element.type,
							"description": element.description,
							"createdBy": element.createdBy,
							"createdByID": element.createdByID,
							"roles": element.roles.join(', '),
							"notowned": notowned,
							"post-border": border
						};
						pMap["projects"].push(elementString);

					});

					/* check if new user to see if welcome modal should pop up */
					var newUser = req.session.user.newUser;

					if(newUser) {
						User.findById(req.session.user._id, function(err, the_user) {
							if(err) {
								console.log(err);
							}

							req.session.user.newUser = false;
							the_user.newUser = false;
							the_user.save(function(err) {
								if(err) {
									console.log(err);
								}
							});
						});
					}

					var userString = {
						"email": req.session.user.email,
						"name": req.session.user.fname + " " + req.session.user.lname,
						"new": newUser
					};
					pMap["user"].push(userString);

					res.render('homepage', pMap);
	    		});
	    	}
	    });
		
	} else {
	    res.redirect('/');
	}
});

/* POST */
router.post('/homepage', function(req, res, next) {

	// set the created by property to be current user
	req.body.createdBy = req.session.user.fname + " " + req.session.user.lname;
	req.body.createdByID = req.session.user._id;
	
	if( !(req.files.images === undefined)) {
		console.log("should not get here");
		// get the temporary location of the file
	    var tmp_path = req.files.images.path;
	    // set where the file should actually exists - in this case it is in the "images" directory
	    var target_path = './public/images/' + req.files.images.name;
	    // move the file from the temporary location to the intended location
	    fs.rename(tmp_path, target_path, function(err) {
	        if (err) throw err;
	        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
	        fs.unlink(tmp_path, function() {
	            if (err) throw err;
	        });
	    });

	    console.log('File uploaded to: ' + target_path + ' - ' + req.files.images.size + ' bytes');
	}
	

	if (typeof req.body.roles === "string") {
		req.body.roles = [req.body.roles];
	}
	else {
		req.body.roles = cleanArray(req.body.roles);
	}

	var newProject = new Project(req.body);

	newProject.save(function(err) {

		if(err) {
			return res.send(err);
		}
		else {
			res.redirect("/homepage");
		}
	});
});


/* Gets rid of all false values (0, null, underfined, false) in array */
function cleanArray(actual){
  var newArray = new Array();
  for(var i = 0; i<actual.length; i++){
      if (actual[i]){
        newArray.push(actual[i]);
    }
  }
  return newArray;
}

module.exports = router;
