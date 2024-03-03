import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';

import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer
} from '@react-google-maps/api'; // Importa google desde @react-google-maps/api
import { useRef, useState } from 'react';

const googleMapsApiKey = import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY;

const center = { lat: -34.6424731, lng: -58.5633046 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyDnOMe78B7RWgVgBXiMblnbaDb7_qIxoC4',
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [destinations, setDestinations] = useState([]);

  const originRef = useRef();
  const destinationRefs = useRef([]);

  if (!isLoaded) {
    return <SkeletonText />;
  }

  const addDestination = () => {
    setDestinations([...destinations, '']);
  };

  const handleDestinationChange = (index, place) => {
    const newDestinations = [...destinations];
    newDestinations[index] = place;
    setDestinations(newDestinations);
  };

  const destinationInputs = destinations.map((destination, index) => (
    <Autocomplete
      key={index}
      onLoad={(autocomplete) => {
        destinationRefs.current[index] = autocomplete;
      }}
      onPlaceChanged={() => {
        if (!destinationRefs.current[index]) return;
        const place = destinationRefs.current[index].getPlace();
        if (!place.geometry) {
          console.log("Returned place contains no geometry");
          return;
        }
        handleDestinationChange(index, place.formatted_address);
      }}
    >
      <Input
        type="text"
        placeholder={`Destination ${index + 1}`}
        value={destination}
        onChange={(e) => handleDestinationChange(index, e.target.value)}
      />
    </Autocomplete>
  ));

  async function calculateRoute() {
    if (!originRef.current.value || destinations.length === 0) {
      return;
    }

    let minDistance = Infinity;
    let bestRoute = [];

    const allDestinations = [originRef.current.value, ...destinations];

    const permutations = generatePermutations(allDestinations);
    
    for (const permutation of permutations) {
      const directionsService = new google.maps.DirectionsService();
      const results = await directionsService.route({
        origin: permutation[0],
        destination: permutation[permutation.length - 1],
        waypoints: permutation.slice(1, -1).map(location => ({ location })),
        travelMode: google.maps.TravelMode.DRIVING,
      });

      const totalDistance = results.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0);
  
      if (totalDistance < minDistance) {
        minDistance = totalDistance;
        bestRoute = permutation;
        setDirectionsResponse(results);
        setDistance((totalDistance / 1000).toFixed(2) + ' km');
        setDuration((results.routes[0].legs.reduce((acc, leg) => acc + leg.duration.value, 0) / 60).toFixed(2) + ' min');
      }
    }
  
    console.log("Best Route:", bestRoute);
  }
  function clearRoute() {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    setDestinations([]);
    originRef.current.value = '';
    destinationRefs.current.forEach(ref => ref.value = '');
  }

  function generatePermutations(array) {
    const result = [];
  
    const permute = (array, m = []) => {
      if (array.length === 0) {
        result.push(m);
      } else {
        for (let i = 0; i < array.length; i++) {
          const curr = array.slice();
          const next = curr.splice(i, 1);
          permute(curr.slice(), m.concat(next));
        }
      }
    };
  
    permute(array);
    return result;
  }

  return (
    <Flex
      position='relative'
      flexDirection='column'
      alignItems='center'
      h='100vh'
      w='100vw'
    >
      <Box position='absolute' left={0} top={0} h='100%' w='100%'>
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            streetViewControl: false,
            mapTypeControl: false
          }}
          onLoad={(map) => setMap(map)}
        >
          <Marker position={center} />
          {directionsResponse && (
            <DirectionsRenderer directions={directionsResponse} />
          )}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius='lg'
        m={4}
        bgColor='white'
        shadow='base'
        minW='container.md'
        zIndex='1'
      >
        <HStack spacing={2} justifyContent='space-between'>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input type='text' placeholder='Origin' ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            {destinationInputs}
          </Box>
          <ButtonGroup>
            <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
              Calculate Route
            </Button>
            <IconButton
              aria-label='center back'
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
          <Button mt={4} onClick={addDestination}>
            Add Destination
          </Button>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent='space-between'>
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label='center back'
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center)
              map.setZoom(15)
            }}
          />
        </HStack>
      </Box>
    </Flex>
  );
}

export default App;
