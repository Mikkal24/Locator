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
    console.log(data);
    requestTicketInfo(client, data.ticket.id, data.ticket.requester.id);
});

function requestTicketInfo(client, id, requesterID){
    var settings = {
        url: `/api/v2/tickets/${id}/comments.json`,
        type: 'GET',
        dataType: 'json'
    }
    client.request(settings).then(function(data){
        // Filter agent location
        let userComments = data.comments.filter(comment => comment.author_id === requesterID)
        // Make sure the requester has a location
        userComments = userComments.filter(comment => typeof comment.metadata.system.latitude !== 'undefined');
        console.log(userComments);
        if (userComments.length > 0){
            var locations = userComments.map(index => {
                return {
                    lat: index.metadata.system.latitude, 
                    lng: index.metadata.system.longitude
                }
            });
            setMapMarkers(locations);
            getTime(locations[0]);
            $('#location').text(userComments[0].metadata.system.location);
        } else {
            // no location found
            console.log("no location found");
            $('#location').text('Location: '+'Unknown')
            $('#map').css({
                "background-image":"url('unknown.jpg')",
                "background-size": "cover"
            })
        }
    }, function(response){
        console.log(response.responseText);
    })
}

function setMapMarkers(locations){
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 3,
        center: locations[0]
    });
    locations.forEach(function(index){
        var marker = new google.maps.Marker({
        position: index,
        map: map
        });
    })
}

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

function getTime(location){
    let params = $.param({
        location: location.lat+','+ location.lng,
        timestamp: 1331161200,
        key: 'AIzaSyAgrrHozPPxeZN52QYTXlLdkpnaWOPNLhw'
    })
    let url = 'https://maps.googleapis.com/maps/api/timezone/json?'+params;
    // $.get('https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810,-119.6822510&timestamp=1331161200&key=AIzaSyAgrrHozPPxeZN52QYTXlLdkpnaWOPNLhw')
    $.get(url)
    .then(function(response){
        
        var options = {
            timeZone: response.timeZoneId,
            hour: 'numeric', minute: 'numeric',
        }
        var time = new Date().toLocaleString([], options);
        $("#time").text(time);
        ticker(response.timeZoneId, options);
    })
}

function ticker(timeZone, options){
    var ticker = setInterval(function(){
        var time = new Date().toLocaleString([], options);
        $("#time").text(time);
    }, 60000)
}