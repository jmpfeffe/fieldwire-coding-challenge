
var albumBucketName = 'field-wire-coding-challenge';
var bucketRegion = 'us-west-1';
var accessKeyId = '';
var secretAccessKey = '';

AWS.config.update({
  region: bucketRegion,
   accessKeyId: accessKeyId,
   secretAccessKey: secretAccessKey,
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

viewProjects();

function getHtml(template) {
   return template.join('\n');
}


function createProject() {
  var projectName = $('#project-name').val();

  projectName = projectName.trim();
  if (!projectName) {
    return alert('Project names must contain at least one non-space character.');
  }
  if (projectName.indexOf('/') !== -1) {
    return alert('Project name cannot contain slashes.');
  }
  var projectKey = encodeURIComponent(projectName) + '/';
  s3.headObject({Key: projectKey}, function(err, data) {
    if (!err) {
      return alert('Project already exists.');
    }
    if (err.code !== 'NotFound') {
      return alert('There was an error creating your project: ' + err.message);
    }
    s3.putObject({Key: projectKey}, function(err, data) {
      if (err) {
        return alert('There was an error creating your project: ' + err.message);
      }
      alert('Successfully created project.');
      $('#project-name').val("");
      $('.modal').modal('hide');
      viewProjects();
    });
  });
}

function viewProjects() {
  s3.listObjects({Delimiter: '/'}, function(err, data) {
    if (err) {
      return alert('There was an error listing your projects: ' + err.message);
    } else {
      var projects = data.CommonPrefixes.map(function(commonPrefix) {
        var prefix = commonPrefix.Prefix;
        var projectName = decodeURIComponent(prefix.replace('/', ''));
        return getHtml(['<div class="col-md-4">',
                          '<div class="card mb-4 box-shadow">',
                            '<h4 class="card-title mx-auto">' + projectName + '</h4>',
                            '<div class="card-body">',
                              '<div class="d-flex justify-content-between align-items-center">',
                                '<div class="btn-group">',
                                  '<a href="floorplan.html?projectName=' + encodeURIComponent(projectName) + '" class="btn btn-sm btn-outline-secondary">View Project</a>',
                                  '<button type="button" class="btn btn-sm bg-danger text-white" onclick="deleteProject(\'' + projectName + '\')">Delete Project</button>',
                              '</div>',
                            '</div>',
                          '</div>',
                        '</div>',
                      '</div>']);
      });

      var projectsHtml = getHtml(projects);
      document.getElementById('projects').innerHTML = projectsHtml;
    }
  });
}

function deleteProject(projectName) {
  var projectKey = encodeURIComponent(projectName) + '/';
  s3.listObjects({Prefix: projectKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your project: ', err.message);
    }
    var objects = data.Contents.map(function(object) {
      return {Key: object.Key};
    });
    s3.deleteObjects({
      Delete: {Objects: objects, Quiet: true}
    }, function(err, data) {
      if (err) {
        return alert('There was an error deleting your project: ', err.message);
      }
      alert('Successfully deleted project.');
      viewProjects();
    });
  });
}
