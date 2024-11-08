import { Modal, Button } from "react-bootstrap";
import {useContext, useState} from "react";
import UsernameContext from "../contexts/UsernameContext";

function ClientDataModal({ show, setShow }) {
    const { clientUsername, seed, setSeed, setClientUsername } = useContext(UsernameContext)
    const [socketUrl, setSocketUrl] = useState(localStorage.socket ?? `ws://${/https?:\/\/([\w\d.\-_!@#$%^&*()]*)?/g.exec(window.location.href)[1]}:8080`)

    function onModalSubmit() {
        localStorage.username = clientUsername
        localStorage.seed = seed
        localStorage.socket = socketUrl
        localStorage.initialSetup = true

        window.location.reload()
        setShow(false)
    }

    return (
      <div className="modal show" style={{ display: "flex", position: "absolute", width: "100vw", height: "100vh", alignItems: "center", backgroundColor: "#333333aa", visibility: show ? "visible" : "hidden" }}>
          <Modal.Dialog style={{ width: "50%" }}>
              <Modal.Header style={{ display: "block", border: "none", color: "white", backgroundColor: "#36393e" }}>
                  <Modal.Title style={{ textAlign: "center" }}>Tracker Setup</Modal.Title>
              </Modal.Header>

              <Modal.Body style={{ backgroundColor: "#36393e", color: "white" }}>
                  <label htmlFor="username"  className="Modal-label">Username</label><br />
                  {<input id="username" className="Search-bar" type="text" placeholder="Set your display name" value={clientUsername} onChange={(e) => {setClientUsername(e.target.value)}} />}<br />
                  <label htmlFor="seed" className="Modal-label">Seed</label><br />
                  {<input id="seed" className="Search-bar" type="text" placeholder="Set your seed" value={seed} onChange={(e) => {setSeed(e.target.value)}} />}
                  <label htmlFor="socket" className="Modal-label">Socket URL</label><br />
                  {<input id="socket" className="Search-bar" type="text" value={socketUrl} onChange={(e) => {setSocketUrl(e.target.value)}} />}<br />
              </Modal.Body>

              <Modal.Footer style={{ backgroundColor: "#1e2124", border: "none", display: "flex" }}>
                  <Button variant="primary" onClick={onModalSubmit}>Save Changes</Button>
              </Modal.Footer>
          </Modal.Dialog>
      </div>
    )
}

export default ClientDataModal;
