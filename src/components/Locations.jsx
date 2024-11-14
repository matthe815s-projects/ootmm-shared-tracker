import React, {lazy, useCallback, useContext, useEffect, useState} from "react";
import { Col } from "react-bootstrap";
import { stringifyBlob } from "../utils/BlobUtils";
import {useCol} from "react-bootstrap/Col";
import UsernameContext from "../contexts/UsernameContext";

Locations.Category = lazy(() => import('./CategoryList.jsx'));
Locations.Lazy = function lazyLocations() { return <div className="lazy-locations" /> }
Locations.Search = function searchField({ search }) {
  return (
    <input type="text" className="Search-bar" placeholder="Search" value={search.query} onChange={(e) => { search.setSearch(e.target.value) }} />
  )
}

let queue = []
let queueAwait = false

let queuePlayers = []
let queueAwaitPlayers = false

function Locations({ isLoaded, locations, webSocket }) {
    const { clientUsername, isMultiworld } = useContext(UsernameContext)
    const [checkedBoxes, setCheckedBoxes] = useState([{}]);
    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState([]);
    const [filter, setFilter] = useState(0);
    const [players, setPlayers] = useState([])

    useEffect(() => {
        if (webSocket.lastMessage === null) return

        const parseData = (data) => {
          const message = JSON.parse(data);

          let newCheckedBoxes
          let newPlayers
          switch (message.op) {
            case 0:
                queueAwait = true
                break
            case 1:
                if (queueAwait) { queue.push(message); break; }
                newCheckedBoxes = [...checkedBoxes]
                newCheckedBoxes[message.index] = { client: message.client, checked: message.checked };
                setCheckedBoxes(newCheckedBoxes)
                break;
            case 2:
                newCheckedBoxes = []
                while (queue.length > 0) {
                    let message = queue[0]
                    newCheckedBoxes[message.index] = { client: message.client, checked: message.checked };
                    queue.splice(0, 1)
                }
                setCheckedBoxes(newCheckedBoxes);
                queueAwait = false
                return
            case 3:
                queueAwaitPlayers = true
                break;
            case 4:
                if (queueAwaitPlayers) { queuePlayers.push(message); break; }
                newPlayers = [...players]
                newPlayers.push(message.name)
                setPlayers(newPlayers)
                break;
            case 5:
                newPlayers = []
                while (queuePlayers.length > 0) {
                  let message = queuePlayers[0]
                  newPlayers.push(message.name)
                  queuePlayers.splice(0, 1)
                }
                setPlayers([...newPlayers]);
                queueAwaitPlayers = false
                break;
            default:
                console.log("Invalid packet received.")
                break;
          }
        }

        if (webSocket.lastMessage.data instanceof Blob) {
          stringifyBlob(webSocket.lastMessage.data).then((data) => {
            parseData(data)
          });
        } else {
          parseData(webSocket.lastMessage.data)
        }
        // eslint-disable-next-line
    }, [webSocket.lastMessage])

    const setCheckState = useCallback((client, index, checked) => {
        const newCheckedBoxes = [...checkedBoxes];
        newCheckedBoxes[index] = Object.assign({ client: [], checked }, checkedBoxes[index])

        if (checked) newCheckedBoxes[index].client.push(players.indexOf(client))
        else newCheckedBoxes[index].client.splice(newCheckedBoxes[index].client.indexOf(players.indexOf(client)), 1)

        setCheckedBoxes(newCheckedBoxes);
        webSocket.sendMessage(JSON.stringify({ op: 1, client: newCheckedBoxes[index].client, index, checked }));
    }, [checkedBoxes, isMultiworld, players, webSocket])

    const categorizedLocations = React.useMemo(() => {
      const categories = []
      const each = (location, index) => {
        const category = categories.find((category) => category.name === location.area)
        location.index = index
        if (!category) {
          categories.push({ name: location.area, color: location.color, locations: [location] })
          return
        }

        category.locations.push(location)
      }

      locations.forEach(each)
      return categories
    }, [locations]);

    const collapseCategory = React.useCallback((category) => {
        const newCollapsed = [...collapsed]
        if (newCollapsed.includes(category)) newCollapsed.splice(collapsed.indexOf(category), 1)
        else newCollapsed.push(category)
        setCollapsed(newCollapsed)
    }, [collapsed])

    const mapToCategory = React.useCallback((category, index) => <Locations.Category key={index} category={category} search={search.toLowerCase()} onClicked={() => collapseCategory(category.name)} isCollapsed={!collapsed.includes(category.name) && search === ""} filter={filter} players={players} checkedBoxes={checkedBoxes} setCheckState={setCheckState} />, [search, collapsed, filter, players, checkedBoxes, setCheckState, collapseCategory])

    if (!isLoaded) return <Locations.Lazy />
    return (
      <Col style={{ height: "100%", width: "66%", overflowY: "scroll" }}>
          <Locations.Search search={{ query: search, setSearch }} /><br />

          {<select style={{ marginTop: "4px" }} onChange={(e) => setFilter(parseInt(e.target.value))} className="Search-bar">
              <option value={"0"}>No filter</option>
              <option value={"1"}>Only show unchecked</option>
          </select>}

          {categorizedLocations.map(mapToCategory)}
      </Col>
    )
}

export default Locations
