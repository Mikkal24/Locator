// Initialise the Zendesk JavaScript API client
// https://developer.zendesk.com/apps/docs/apps-v2
var client = ZAFClient.init();
client.invoke('resize', { width: '100%', height: '200px' });

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
        let userComments = data.comments.filter(comment => comment.author_id === requesterID)
        userComments = userComments.filter(comment => typeof comment.metadata.latitude !== 'undefined');
        console.log(data);
        var locations = userComments.map(index => {
            return {
                lat: index.metadata.system.latitude, 
                lng: index.metadata.system.longitude
            }
        });
        setMapMarkers(locations);
        $('#location').text('location: '+userComments[0].metadata.system.location);
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