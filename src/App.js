import { Button, Col, Container, Row } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { stringifyBlob } from './utils/BlobUtils'
import LocationsList from './components/LocationsList';
import UsernameContext from './contexts/UsernameContext';
import WebsocketContext from './contexts/WebsocketContext';
import ClientDataModal from './modals/ClientDataModal';
import "./App.css"

function App() {
  const [show, setShow] = useState(true);
  const [clientUsername, setClientUsername] = useState(localStorage.username || "Set a username here");
  const [seed, setSeed] = useState(localStorage.seed || 'Set a seed')

  return (
    <UsernameContext.Provider value={{ clientUsername, setClientUsername, seed, setSeed }}>
        <ClientDataModal show={show} setShow={setShow} />
        <Container style={{ height: "100vh" }}>
          <Row style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <h1 style={{ textAlign: "center" }}>OoTMM Shared Tracker</h1>
            <a href="#" onClick={() => { setShow(true) }} style={{ textAlign: "center", color: "#aaa", marginBottom: "10px" }}>Logged in as {clientUsername} on {localStorage.socket}</a>
            <LocationsList seed={seed} />
          </Row>
        </Container>
    </UsernameContext.Provider>
  );
}

export default App;
