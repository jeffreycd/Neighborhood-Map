//GLOBA VARIABLES
//The Google Map object
var map;

//The latitude and longitude for New Orleans, LA
var latitude = 29.9510658;
var longitude = -90.0715323;

//The Venue model object to hold details for a single venue
var Venue = function (data, id, marker) {
  this.name = data.name;
  this.location = data.location;
  this.url = data.url ? data.url : '';
  this.category = data.categories[0].name;
  this.checkins = data.stats.checkinsCount;
  this.checkinsText = this.checkins + " Total Checkins";
  this.id = id;
  this.marker = marker;
  this.formattedAddress = this.location.formattedAddress ? this.location.formattedAddress.toString().replace(/,/g, '<br>') : '';
};

//The ViewModel
var ViewModel = function() {
  var self = this;
  var selectedMarker;
  self.filter = ko.observable("");
  self.filterVenues = ko.observable();
  self.venueList = ko.observableArray([]);
  self.venueListDetail = ko.observable("");

  if (typeof google === 'object' && typeof google.maps === 'object') {
    var infoWindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();
    getListings();
  }

  //Get restaunt info from Foursquare using ajax call
  function getListings() {
    var data;
    var foursquareurl = 'https://api.foursquare.com/v2/venues/search?ll='+
      latitude+','+longitude+
      '&client_id=YKKS3NFKA0OCCARQ5C1IQWRI0SKVZTDBUYWZ1PCXE2BDHBAN&client_secret=OM5VEDKNL5KMDWI4HN0KOPQ3PT5DJTHCQJORP3OQH2BJY3AP&v=20180314&query=Restaurant';
    $.ajax({
            url: foursquareurl,
            dataType: 'json',
            async: true,
        }).done(function (data) {
          venues = data.response.venues;
          for (var i = 0; i < venues.length; i++) {
            var venueItem = venues[i];
            // console.log(venueItem);
            var venue = new Venue(venues[i], i, createMapMarker(venueItem, i));
            google.maps.event.addListener(venue.marker, 'click', function(v) {
              return function() {
                self.selectMarker(v);
              };
            }(venue));
            self.venueList.push(venue);
            bounds.extend(venue.marker.position);
          }
          map.fitBounds(bounds);
        }).fail(function () {
            self.venueListDetail('Failed to Load Restaurants! Foursquare API unavailable');
        });
  }

  self.filterVenues = function filterVenues(){
    //Don't need to do anything here just stop default behaviour of form submit
  };

  self.filteredVenueList = ko.computed(function() {
    var filter = self.filter().toLowerCase();
    if (!filter) {
        //No filter show all venues
        self.venueList().forEach(function (venue) {
            venue.marker.setMap(map);
        });
        return self.venueList();
    } else {
        //Clear markers and update with venues that fit filter
        self.venueList().forEach(function (venue) {
            venue.marker.setMap(null);
        });
        return ko.utils.arrayFilter(self.venueList(), function(venue) {
            if (venue.name.toLowerCase().indexOf(filter) === 0) {
              venue.marker.setMap(map);
              return venue;
            }
        });
    }
  }, self);

  self.selectMarker = function(venue) {
    var marker = venue.marker;
    if (self.selectedMarker) {
      self.selectedMarker.setIcon(makeMarkerIcon('0091ff'));
    }
    marker.setIcon(makeMarkerIcon('FFEE00'));

    infoWindow.setContent("<p><h5>" + venue.name + "</h5><p>" + venue.category +
                          "<br></p><hr />" + venue.formattedAddress +
                          "<br><a target='_blank' href='" + venue.url + "'>" +
                           venue.url + "</a></p><small><span></span>" + venue.checkinsText + " on Foursquare</small>");
    infoWindow.open(map, marker);
    map.setCenter(marker.getPosition());
    self.selectedMarker = marker;
  };
};

//Create a new map marker based on the provided data
function createMapMarker(data, id) {
  var lat = data.location.lat;
  var lng = data.location.lng;
  var title = data.name;

  var marker = new google.maps.Marker({
    map: map,
    position: {lat, lng},
    title: data.name,
    icon: makeMarkerIcon('0091ff'),
    animation: google.maps.Animation.DROP,
    id: id
  });

  return marker;
}

//This function takes in a COLOR, and then creates a new marker
//icon of that color. The icon will be 21 px wide by 34 high, have an origin
//of 0, 0 and be anchored at 10, 34)
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}

/* Initialize the google map */
function initMap() {
  //Create a styles array to use with the map
  //Style from https://snazzymaps.com/
  var styles = [
      {
          "featureType": "administrative",
          "elementType": "all",
          "stylers": [
              {
                  "visibility": "on"
              },
              {
                  "lightness": 33
              }
          ]
      },
      {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [
              {
                  "color": "#f2e5d4"
              }
          ]
      },
      {
          "featureType": "poi.park",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#c5dac6"
              }
          ]
      },
      {
          "featureType": "poi.park",
          "elementType": "labels",
          "stylers": [
              {
                  "visibility": "on"
              },
              {
                  "lightness": 20
              }
          ]
      },
      {
          "featureType": "road",
          "elementType": "all",
          "stylers": [
              {
                  "lightness": 20
              }
          ]
      },
      {
          "featureType": "road.highway",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#c5c6c6"
              }
          ]
      },
      {
          "featureType": "road.arterial",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#e4d7c6"
              }
          ]
      },
      {
          "featureType": "road.local",
          "elementType": "geometry",
          "stylers": [
              {
                  "color": "#fbfaf7"
              }
          ]
      },
      {
          "featureType": "water",
          "elementType": "all",
          "stylers": [
              {
                  "visibility": "on"
              },
              {
                  "color": "#acbcc9"
              }
          ]
      }
  ];
  //Constructor creates a new map - only center and zoom are required
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: latitude, lng: longitude},
    zoom: 16,
    styles: styles,
    mapTypeControl: true
  });
  //Create the view model after google map has loaded
  ko.applyBindings(new ViewModel());
}

//This function is called if there is an error loading google maps
function gMapsError() {
  $("#map").html('<div class="alert alert-danger" role="alert"><strong>Failed to Load Map!</strong> Google Maps API unavailable</div>');
}

//Create slideout menu object
var slideout = new Slideout({
    'panel': document.getElementById('panel'),
    'menu': document.getElementById('menu'),
    'padding': 300,
    'tolerance': 70
  });

document.querySelector('.menu-icon').addEventListener('click', function() {
  slideout.toggle();
});
//Show slideout when page loads
slideout.toggle();
