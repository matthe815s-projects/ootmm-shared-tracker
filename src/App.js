import { Container, Row } from 'react-bootstrap';
import { useState } from 'react';
import LocationsList from './components/LocationsList';
import UsernameContext from './contexts/UsernameContext';
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
            <span className="logged-in"><button style={{ background: 'none', border: 'none' }} onClick={() => { setShow(true) }}>⚙</button>Logged in as {clientUsername} on {localStorage.socket}</span>
            <LocationsList seed={seed} />
          </Row>
        </Container>
    </UsernameContext.Provider>
  );
}

export default App;
