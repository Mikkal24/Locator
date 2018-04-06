// Initialise the Zendesk JavaScript API client
// https://developer.zendesk.com/apps/docs/apps-v2
var client = ZAFClient.init();
// decide whether to show the map
if (getMapStatus() === 'show'){
    showMap();
} else {
    hideMap();
}

// get ticket information
client.get('ticket').then(function(data){
    requestTicketInfo(client, data.ticket.id, data.ticket.requester.id);
});

$('document').ready(function(){
    $('.expander').click(function(){
        if (getMapStatus() === 'show'){
            // if it's showing hide the map on click
            hideMap();
        } else {
            showMap();
        }
    })
})



function requestTicketInfo(client, id, requesterID){
    var settings = {
        url: `/api/v2/tickets/${id}/comments.json`,
        type: 'GET',
        dataType: 'json'
    }

    client.request(settings).then(function(data){

        let userComments = data.comments.filter(comment => comment.author_id === requesterID)
        userComments = userComments.filter(comment => typeof comment.metadata.system.latitude !== 'undefined');

        if(userComments.length > 0 ){

            var locations = userComments.map(index => {
                return [
                    index.metadata.system.longitude,
                    index.metadata.system.latitude
                ]
            });
            getTime(locations[0]);
            var map = createMap(locations);
            // setMapMarkers(locations);
            $('#location').text(userComments[0].metadata.system.location);
        } else {
            $('#location').text('Location: '+'Unknown')
            $('#map').css({
                "background-image":"url('unknown.jpg')",
                "background-size": "cover"
            })
        }
    });
}

function createMap(locations){
    var markers = setMapMarkers(locations);

    var styles = {
        'icon': new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5, 1],
            src: './marker.png'
          })
        }),
      };

    
    var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: markers
        }),
        style: function(feature) {
            return styles[feature.get('type')];
        }
    });

    var map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
             source: new ol.source.OSM()
            }),
            vectorLayer
        ],
        view: new ol.View({
            center: ol.proj.fromLonLat(locations[0]),
            zoom: 5
        }),
    });
}

function setMapMarkers(locations){
    let markers = locations.map(function(index){
        index = ol.proj.transform(index, 'EPSG:4326','EPSG:3857')
        var marker = new ol.Feature({
            type: 'icon',
            geometry: new ol.geom.Point(index)
          });

        return marker
    })
    return markers;
}

function getTime(location){
    let timeZone = tzlookup(location[1], location[0])

        
    var options = {
        timeZone: timeZone,
        hour: 'numeric', minute: 'numeric',
    }
    var time = new Date().toLocaleString([], options);
    $("#time").text(time);
    ticker(timeZone, options);
}



function hideMap(){
    localStorage.setItem('mapToggle','hidden');
    $('#map').css('display','none');
    client.invoke('resize', { width: '100%', height: '20px' });
}

function showMap(){
    localStorage.setItem('mapToggle','show');
    $('#map').css('display','block');
    client.invoke('resize', { width: '100%', height: '220px' });
}

function getMapStatus(){
    // show map on default
    if(localStorage.getItem('mapToggle') === null){
        localStorage.setItem('mapToggle', 'show');
    }

    return localStorage.getItem('mapToggle')
}

function ticker(timeZone, options){
    var ticker = setInterval(function(){
        var time = new Date().toLocaleString([], options);
        $("#time").text(time);
    }, 60000)
}