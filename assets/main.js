// Initialise the Zendesk JavaScript API client
// https://developer.zendesk.com/apps/docs/apps-v2
var client = ZAFClient.init();
client.invoke('resize', { width: '100%', height: '200px' });

// get ticket information
client.get('ticket.id').then(function(data){
    console.log(data['ticket.id']);
    requestTicketInfo(client, data['ticket.id']);
});

function requestTicketInfo(client, id){
    var settings = {
    url: `/api/v2/tickets/${id}/comments.json`,
    type: 'GET',
    dataType: 'json'
    }
    client.request(settings).then(function(data){
    console.log(data);
    var locations = data.comments.map(index => {
        return {
        lat: index.metadata.system.latitude, 
        lng: index.metadata.system.longitude
        }
    });
    setMapMarkers(locations);
    $('#location').text('location: '+data.comments[0].metadata.system.location);
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