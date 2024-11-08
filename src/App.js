import { Container, Row } from 'react-bootstrap';
import { useState } from 'react';
import LocationsList from './components/LocationsList';
import UsernameContext from './contexts/UsernameContext';
import ClientDataModal from './modals/ClientDataModal';
import "./App.css"
import WebsocketContext from "./contexts/WebsocketContext";
import useWebSocket from "react-use-websocket";

function App() {
  const [show, setShow] = useState(true);
  const [clientUsername, setClientUsername] = useState(localStorage.username || "Set a username here");
  const [seed, setSeed] = useState(localStorage.seed || 'Set a seed')

  let { sendMessage, lastMessage } = useWebSocket(localStorage.socket || 'ws://localhost:8080', {
    onOpen: () => sendMessage(JSON.stringify({ op: 0, seed }))
  });

  return (
    <UsernameContext.Provider value={{ clientUsername, setClientUsername, seed, setSeed }}>
      <WebsocketContext.Provider value={{ sendMessage }}>
        <ClientDataModal show={show} setShow={setShow} />
        <h1 className="site-header" style={{ textAlign: "center" }}>OoTMM Shared Tracker</h1>
        <Container style={{ height: "100vh" }}>
          <Row style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <span className="logged-in"><button style={{ background: 'none', border: 'none' }} onClick={() => { setShow(true) }}>⚙</button>Logged in as {clientUsername} on {localStorage.socket}</span>
            <LocationsList webSocket={{ sendMessage, lastMessage }} />
          </Row>
        </Container>
      </WebsocketContext.Provider>
    </UsernameContext.Provider>
  );
}

export default App;
