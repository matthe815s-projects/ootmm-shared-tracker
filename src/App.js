import { Container, Row } from 'react-bootstrap';
import {memo, Suspense, useEffect, useState} from 'react';
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
    onOpen: () => sendMessage(JSON.stringify({ op: 0, client: clientUsername, version: 3, seed }))
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

  const LoggedInMemo = memo(function loggedIn({ username, seed, socket }) {
    return (
      <span className="logged-in">
        <button style={{ background: 'none', border: 'none' }} onClick={() => { setShow(true) }}>⚙</button>
        {readyState === ReadyState.CLOSED ? "Not connected" : `Logged in as ${username} on ${socket} (${seed})`}
      </span>
    )
  })

  const LazyLocations = () => { return <div className="lazy-locations" /> }

  return (
    <UsernameContext.Provider value={{ clientUsername, setClientUsername, seed, setSeed }}>
      <WebsocketContext.Provider value={{ sendMessage }}>
        <ClientDataModal show={show} setShow={setShow} />
        <Container fluid={true} style={{ height: "100vh" }}>
          <Row style={{ height: "100%", display: "flex", alignItems: "center", flexDirection: "column" }}>
            <h1 className="site-header" style={{ textAlign: "center" }}>OoTMM Shared Tracker</h1>
            <LoggedInMemo username={localStorage.username} socket={localStorage.socket} seed={localStorage.seed} />
            <Suspense fallback={<LazyLocations />}>
              <Locations locations={locations} isLoaded={locationsLoaded} webSocket={{ sendMessage, lastMessage }} />
            </Suspense>
          </Row>
        </Container>
      </WebsocketContext.Provider>
    </UsernameContext.Provider>
  );
}

export default App;
