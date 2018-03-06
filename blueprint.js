
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

displayFloorplanName();
setProjectButton();
viewBlueprints();

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

function setProjectButton() {
  $("#projectButton").attr("href", "floorplan.html?projectName=" + encodeURIComponent(getUrlParameter("projectName")));
}

function displayFloorplanName() {
  var floorplan = getUrlParameter("floorplanName");
  $("#floorplanTitle").text("Floorplan: " + floorplan);
}

function viewBlueprints() {
  var projectName = getUrlParameter("projectName"), floorplanName = getUrlParameter("floorplanName");
  var projectKey = encodeURIComponent(projectName) + '/' + encodeURIComponent(floorplanName) + '/';


  s3.listObjects({Delimiter: "/", Prefix: projectKey}, function(err, data) {
    if (err) {
      return alert('There was an error listing your blueprints: ' + err.message);
    } else {
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName;

        var blueprints = data.Contents.map(function(photo) {
          var photoKey = photo.Key;

          if(photoKey == data.Prefix || photoKey.includes("pdf")) {
            return "";
          }

          var secFromNow = Math.floor((new Date() - photo.LastModified)/1000);
          var timeModified = "";

          var years = Math.floor(secFromNow/31536000);
          var months = Math.floor(secFromNow/2592000);
          var days = Math.floor(secFromNow/86400);
          var hours = Math.floor(secFromNow/3600);
          var mins = Math.floor(secFromNow/60);
          if(years > 1) {
            timeModified = years + " years";
          } else if(months > 1) {
            timeModified = months + " months";
          } else if (days > 1) {
            timeModified = days + " days";
          } else if (hours > 1) {
            timeModified = hours + " hours";
          } else if (mins > 1) {
            timeModified = mins + " mins";
          } else {
            timeModified = secFromNow + " secs";
          }

          var photoUrl = bucketUrl + '/' + encodeURIComponent(photoKey);
          var cardLine, timeMod, fontSizeDownload, columnSize;

          if (photoKey.includes("lambda_thumbnail_small")) {
            timeMod = '<small class="text-muted">Thumbnail</small>';
            fontSizeDownload = '1em';
            columnSize = 'col-md-1.5';
          }
          else if (photoKey.includes("lambda_thumbnail_large")) {
            timeMod = '<small class="text-muted">Large PNG (2000px * 2000px)</small>';
            fontSizeDownload = '2em';
            columnSize = 'col-md-5';
          }
          else {
            timeMod = '<small class="text-muted">Original - Uploaded ' + timeModified + ' ago</small>';
            fontSizeDownload = '2em';
            columnSize = 'col-md-4';
          }

          cardLine = '<div class="card mb-4 box-shadow">';

          return getHtml(['<div class="' + columnSize + '">',
                            cardLine,
                              '<img class="card-img-top" src="' + photoUrl + '" alt="Blueprint Thumbnail" style="">',
                              '<div class="card-body">',
                                '<div class="d-flex justify-content-between align-items-center">',
                                  '<a href="' + photoUrl + '" download="' + photoKey + '" class="btn btn-sm" style="font-size:' + fontSizeDownload + '; color:lightskyblue" onMouseOver="this.style.color=\'purple\'" onMouseOut="this.style.color=\'lightskyblue\'">',
                                    '<i class="fas fa-cloud-download-alt"></i>',
                                  '</a>',
                                  timeMod,
                                '</div>',
                            '</div>',
                          '</div>',
                        '</div>']);
      });

      var blueprintsHTML = getHtml(blueprints);
      document.getElementById('blueprints').innerHTML = blueprintsHTML;
    }
  });
}
