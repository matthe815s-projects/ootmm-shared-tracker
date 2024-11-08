import { Container, Row } from 'react-bootstrap';
import {useEffect, useState} from 'react';
import Locations from './components/Locations';
import UsernameContext from './contexts/UsernameContext';
import ClientDataModal from './modals/ClientDataModal';
import "./App.css"
import WebsocketContext from "./contexts/WebsocketContext";
import useWebSocket, {ReadyState} from "react-use-websocket";
import LocationsUtils from "./utils/LocationsUtils";

function App() {
  const [show, setShow] = useState(localStorage.initialSetup === undefined || false);
  const [clientUsername, setClientUsername] = useState(localStorage.username || "");
  const [seed, setSeed] = useState(localStorage.seed || "")
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [locations, setLocations] = useState([]);

  let { sendMessage, lastMessage, readyState } = useWebSocket(localStorage.socket || 'ws://localhost:8080', {
    onOpen: () => sendMessage(JSON.stringify({ op: 0, seed }))
  });

  useEffect(() => {
    Promise.all([
      LocationsUtils.fetchLocationFromUrl("/oot_overworld.json"),
      LocationsUtils.fetchLocationFromUrl("/oot_dungeons.json"),
      LocationsUtils.fetchLocationFromUrl("/mm_overworld.json"),
      LocationsUtils.fetchLocationFromUrl("/mm_dungeons.json")
    ])
      .then((data) => {
        setLocations(data.flat())
        setLocationsLoaded(true)
      })
  }, [])

  return (
    <UsernameContext.Provider value={{ clientUsername, setClientUsername, seed, setSeed }}>
      <WebsocketContext.Provider value={{ sendMessage }}>
        <ClientDataModal show={show} setShow={setShow} />
        <Container fluid={true} style={{ height: "100vh" }}>
          <Row style={{ height: "100%", display: "flex", alignItems: "center", flexDirection: "column" }}>
            <h1 className="site-header" style={{ textAlign: "center" }}>OoTMM Shared Tracker</h1>
            <span className="logged-in"><button style={{ background: 'none', border: 'none' }} onClick={() => { setShow(true) }}>⚙</button>{readyState === ReadyState.CLOSED ? "Not connected" : `Logged in as ${clientUsername} on ${localStorage.socket} (${localStorage.seed})`}</span>
            <Locations locations={locations} isLoaded={locationsLoaded} webSocket={{ sendMessage, lastMessage }} />
          </Row>
        </Container>
      </WebsocketContext.Provider>
    </UsernameContext.Provider>
  );
}

export default App;
