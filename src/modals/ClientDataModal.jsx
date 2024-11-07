import { Modal, Button } from "react-bootstrap";
import { useState } from "react";
import UsernameContext from "../contexts/UsernameContext";

function ClientDataModal({ show, setShow }) {
    const [socketUrl, setSocketUrl] = useState(localStorage.socket ?? `ws://${/https?:\/\/([\w\d.\-_!@#$%^&*()]*)?/g.exec(window.location.href)[1]}:8080`)

    function onSetUsername(client) {
        localStorage.username = client.clientUsername
        localStorage.seed = client.seed

        if (localStorage.socket !== socketUrl) {
            localStorage.socket = socketUrl
            window.location.reload()
        }

        setShow(false)
    }

    return (
        <UsernameContext.Consumer>
            {(client) => (
            <div className="modal show" style={{ display: "flex", position: "absolute", width: "100vw", height: "100vh", alignItems: "center", backgroundColor: "#333333aa", visibility: show ? "visible" : "hidden" }}>
                <Modal.Dialog style={{ width: "50%" }}>
                    <Modal.Header style={{ display: "block", border: "none", color: "white", backgroundColor: "#36393e" }}>
                        <Modal.Title style={{ textAlign: "center" }}>Tracker Setup</Modal.Title>
                    </Modal.Header>

                    <Modal.Body style={{ backgroundColor: "#36393e", color: "white" }}>
                        <label className="Modal-label">Set your username</label><br />
                        {<input className="Search-bar" type="text" value={client.clientUsername} onChange={(e) => {client.setClientUsername(e.target.value)}} />}<br />
                        <label className="Modal-label">Set the socket URL</label><br />
                        {<input className="Search-bar" type="text" value={socketUrl} onChange={(e) => {setSocketUrl(e.target.value)}} />}<br />
                        <label className="Modal-label">Set the seed</label><br />
                        {<input className="Search-bar" type="text" value={client.seed} onChange={(e) => {client.setSeed(e.target.value)}} />}
                    </Modal.Body>

                    <Modal.Footer style={{ backgroundColor: "#1e2124", border: "none", display: "flex" }}>
                        <Button variant="primary" onClick={() => onSetUsername(client)}>Save Changes</Button>
                    </Modal.Footer>
                </Modal.Dialog>
            </div>
            )}
        </UsernameContext.Consumer>
    )
}

export default ClientDataModal;