// Initialise the Zendesk JavaScript API client
// https://developer.zendesk.com/apps/docs/apps-v2
var client = ZAFClient.init();
// decide whether to show the map
if (getMapStatus() === "show") {
  showMap();
} else {
  hideMap();
}

const tagsEnabled = true;

//get settings
client.metadata().then(function(metadata) {
  console.log(metadata.settings);
  return tagsEnabled;
});

// get ticket information
client.get("ticket").then(function(data) {
  requestTicketInfo(client, data.ticket.id, data.ticket.requester.id);
});

$("document").ready(function() {
  $(".expander").click(function() {
    if (getMapStatus() === "show") {
      // if it's showing hide the map on click
      hideMap();
    } else {
      showMap();
    }
  });
});

function requestTicketInfo(client, id, requesterID) {
  var settings = {
    url: `/api/v2/tickets/${id}/comments.json`,
    type: "GET",
    dataType: "json"
  };

  client.request(settings).then(function(data) {
    let userComments = data.comments.filter(
      comment => comment.author_id === requesterID
    );
    userComments = userComments.filter(
      comment => typeof comment.metadata.system.latitude !== "undefined"
    );

    if (userComments.length > 0) {
      var locations = userComments.map(index => {
        return [
          index.metadata.system.longitude,
          index.metadata.system.latitude
        ];
      });
      getTime(locations[0]);
      var map = createMap(locations);
      var locationString = userComments[0].metadata.system.location;
      // setMapMarkers(locations);
      $("#location").text(locationString);
      setTag(client, locationString);
    } else {
      $("#location").text("Location: " + "Unknown");
      $("#map").html(`
                <div class="unknown">
                    <p>hrmmmmmmm... Something's not right</p>
                    <h1>¿Unknown?</h1>
                </div>
            `);
    }
  });
}

/**
 * Locater uses Open Layers to generate the map more info found here:
 *   https://openlayers.org/
 */
function createMap(locations) {
  var markers = setMapMarkers(locations);

  var styles = {
    icon: new ol.style.Style({
      image: new ol.style.Icon({
        anchor: [0.5, 1],
        src: "./marker.png"
      })
    })
  };

  var vectorLayer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: markers
    }),
    style: function(feature) {
      return styles[feature.get("type")];
    }
  });

  var map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      vectorLayer
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat(locations[0]),
      zoom: 5
    })
  });
}

function setMapMarkers(locations) {
  let markers = locations.map(function(index) {
    index = ol.proj.transform(index, "EPSG:4326", "EPSG:3857");
    var marker = new ol.Feature({
      type: "icon",
      geometry: new ol.geom.Point(index)
    });

    return marker;
  });
  return markers;
}

/**
 * Locater uses tz-lookup for a lightweight method to get the time at a particular location
 *
 *  https://github.com/darkskyapp/tz-lookup
 */

function getTime(location) {
  let timeZone = tzlookup(location[1], location[0]);

  var options = {
    timeZone: timeZone,
    hour: "numeric",
    minute: "numeric"
  };
  var time = new Date().toLocaleString([], options);
  $("#time").text(time);
  ticker(timeZone, options);
}

function hideMap() {
  localStorage.setItem("mapToggle", "hidden");
  $(".expander>img").css("transform", "rotate(0deg");
  $("#map").css("display", "none");
  client.invoke("resize", { width: "100%", height: "22px" });
}

function showMap() {
  localStorage.setItem("mapToggle", "show");
  $("#map").css("display", "block");
  $(".expander>img").css("transform", "rotate(180deg");
  client.invoke("resize", { width: "100%", height: "220px" });
}

function getMapStatus() {
  // show map on default
  if (localStorage.getItem("mapToggle") === null) {
    localStorage.setItem("mapToggle", "show");
  }

  return localStorage.getItem("mapToggle");
}

function ticker(timeZone, options) {
  var ticker = setInterval(function() {
    var time = new Date().toLocaleString([], options);
    $("#time").text(time);
  }, 60000);
}

function setTag(client, location) {
  /*
   * You must enable the tagging of users and organizations in Zendesk Support for the 
   * API calls to work. Select Manage > Settings > Customers, and enable the option.
   */

  let countryName = "";
  if(location.includes(",")){
  let locationSplit = location.split(", ");
   countryName = locationSplit[locationSplit.length - 1];
  } else {
    countryName = location;
  }
  countryName = countryName.split(" ").join("_");
  client.invoke("ticket.tags.add", countryName);
}
