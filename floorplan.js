
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

var isDragDropPossible = function() {
  var div = document.createElement('div');
  return (('draggable' in div) || ('ondragstart' in div && 'ondrop' in div)) && 'FormData' in window && 'FileReader' in window;
}();

var fileInput = $('#fileInput');
$("#hiddenFileInput").on('change', function() {
  var files = document.getElementById("hiddenFileInput").files;
  $("#fileUploaded").text("(" + files[0].name + ")");
});

if (isDragDropPossible) {
  fileInput.addClass('has-advanced-upload');

  var filesDropped = false;
  fileInput.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
  })
  .on('dragover dragenter', function() {
    fileInput.addClass('is-dragover');
  })
  .on('dragleave dragend drop', function() {
    fileInput.removeClass('is-dragover');
  })
  .on('drop', function(e) {
    filesDropped = e.originalEvent.dataTransfer.files;
    $("#fileUploaded").text("(" + filesDropped[0].name + ")");
  });
}

displayProjectName();
viewFloorPlans(undefined);

function getHtml(template) {
   return template.join('\n');
}

function getUrlParameter(param) {
    var pageUrl = decodeURIComponent(window.location.search.substring(1)),
        urlVariables = pageUrl.split('&'),
        paramName,
        i;

    for (i = 0; i < urlVariables.length; i++) {
        paramName = urlVariables[i].split('=');

        if (paramName[0] === param) {
            return paramName[1] === undefined ? true : paramName[1];
        }
    }
};

function displayProjectName() {
  var project = getUrlParameter("projectName");
  $("#projectTitle").text("Project: " + project);
}

function viewFloorPlans(project) {
  if (project === undefined) {
    project = getUrlParameter("projectName");
  }

  var projectKey = encodeURIComponent(project) + '/';
  s3.listObjects({Delimiter: "/", Prefix: projectKey}, function(err, data) {
    if (err) {
      return alert('There was an error listing your floorplans: ' + err.message);
    } else {
        var floorplans = data.CommonPrefixes.map(function(commonPrefix) {
          var prefix = commonPrefix.Prefix;
          var floorplan = decodeURIComponent(prefix.split('/')[1]);
          return getHtml(['<div class="col-md-4">',
                            '<div class="card mb-4 box-shadow">',
                              '<h4 class="card-title mx-auto">' + floorplan + '</h4>',
                              '<div class="card-body">',
                                '<div class="d-flex justify-content-between align-items-center">',
                                  '<div class="btn-group">',
                                    '<a href="blueprint.html?projectName=' + encodeURIComponent(project) + '&floorplanName=' + encodeURIComponent(floorplan) + '" class="btn btn-sm btn-outline-secondary">View Floorplan</a>',
                                    '<button type="button" class="btn btn-sm bg-danger text-white" onclick="deleteFloorplan(\'' + floorplan + '\')">Delete Floorplan</button>',
                                  '</div>',
                              '</div>',
                            '</div>',
                          '</div>',
                        '</div>']);
      });

      var floorplansHTML = getHtml(floorplans);
      document.getElementById('floorplans').innerHTML = floorplansHTML;
    }
  });
}

function deleteFloorplan(floorplanName) {
  var project = getUrlParameter("projectName");
  var projectKey = encodeURIComponent(project) + '/' + encodeURIComponent(floorplanName) + '/';
  s3.listObjects({Prefix: projectKey}, function(err, data) {
    if (err) {
      return alert('There was an error deleting your floorplan: ', err.message);
    }
    var objects = data.Contents.map(function(object) {
      return {Key: object.Key};
    });
    s3.deleteObjects({
      Delete: {Objects: objects, Quiet: true}
    }, function(err, data) {
      if (err) {
        return alert('There was an error deleting your floorplan: ', err.message);
      }
      alert('Successfully deleted floorplan.');
      viewFloorPlans(project);
    });
  });
}

function createFloorPlan() {
  var floorplan = $('#floorplan-name').val();
  floorplan = floorplan.trim();
  var file = getPhotoName();

  var project = getUrlParameter("projectName");
  if (!floorplan) {
    floorplan = file.name.split('.')[0].trim();
  }

  if (floorplan.indexOf('/') !== -1) {
    return alert('Floorplan names cannot contain slashes.');
  }

  var floorplanKey = encodeURIComponent(project) + '/' + encodeURIComponent(floorplan) + '/';

  s3.headObject({Key: floorplanKey}, function(err, data) {
    if (!err) {
      return alert('Floorplan already exists.');
    }
    if (err.code !== 'NotFound') {
      return alert('There was an error creating your floorplan: ' + err.message);
    }
    s3.putObject({Key: floorplanKey}, function(err, data) {
      if (err) {
        return alert('There was an error creating your floorplan: ' + err.message);
      }
      alert('Successfully created floorplan.');
      addPhoto(floorplanKey, file);
      viewFloorPlans(project);
      $('#floorplan-name').val("");
      $('.modal').modal('hide');
    });
  });
}

function getPhotoName() {
  if (filesDropped) {
    return filesDropped[0];
  }
  var files = document.getElementById("hiddenFileInput").files;
  if (!files.length) {
    return alert('Please choose a file to upload first.');
  }
  var file = files[0];

  return file;
}

function addPhoto(albumName, file) {
  var photoKey = albumName + file.name;
  s3.upload({
    Key: photoKey,
    Body: file,
    ACL: 'public-read'
  }, function(err, data) {
    if (err) {
      return alert('There was an error uploading your photo: ', err.message);
    }
  });
}
