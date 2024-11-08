import {lazy, useEffect, useState} from "react";
import { Col } from "react-bootstrap";
import { stringifyBlob } from "../utils/BlobUtils";

Locations.Category = lazy(() => import('./CategoryList.jsx'));

let queue = []
let queueAwait = false

function Locations({ isLoaded, locations, webSocket }) {
    const [checkedBoxes, setCheckedBoxes] = useState([{}]);
    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState([]);
    const [filter, setFilter] = useState(0);

    useEffect(() => {
        if (webSocket.lastMessage === null) return

        const parseData = (data) => {
          const message = JSON.parse(data);
          console.log(message)

          let newCheckedBoxes
          switch (message.op) {
            case 0:
                queueAwait = true
                break
            case 1:
                if (queueAwait) break;
                newCheckedBoxes = [...checkedBoxes]
                newCheckedBoxes[message.index] = { client: message.client, checked: message.checked };
                setCheckedBoxes(newCheckedBoxes)
                break;
            case 2:
                newCheckedBoxes = []
                while (queue.length > 0) {
                    let message = queue[0]
                    console.log(message)
                    newCheckedBoxes[message.index] = { client: message.client, checked: message.checked };
                    queue.splice(0, 1)
                }
                setCheckedBoxes(newCheckedBoxes);
                queueAwait = false
                return
            default:
                console.log("Invalid packet received.")
                break;
          }
          if (queueAwait) queue.push(message)
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

    const setCheckState = (client, index, checked) => {
        const newCheckedBoxes = [...checkedBoxes];
        newCheckedBoxes[index] = { client, checked };

        setCheckedBoxes(newCheckedBoxes);
        webSocket.sendMessage(JSON.stringify({ op: 1, client, index, checked }));
    }

    const categorizeLocations = () => {
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
    }

    const collapseCategory = (category) => {
        const newCollapsed = [...collapsed]
        if (newCollapsed.includes(category)) newCollapsed.splice(collapsed.indexOf(category), 1)
        else newCollapsed.push(category)
        setCollapsed(newCollapsed)
    }

    if (!isLoaded) return <p>Loading</p>

    const mapToCategory = (category) => <Locations.Category category={category} search={search.toLowerCase()} onClicked={() => collapseCategory(category.name)} isCollapsed={!collapsed.includes(category.name) && search === ""} filter={filter} checkedBoxes={checkedBoxes} setCheckState={setCheckState} />
    return (
      <Col style={{ height: "100%", width: "66%", overflowY: "scroll" }}>
          <Locations.Search search={{ query: search, setSearch }} /><br />

          {<select style={{ marginTop: "4px" }} onChange={(e) => setFilter(parseInt(e.target.value))} className="Search-bar">
              <option value={"0"}>No filter</option>
              <option value={"1"}>Only show unchecked</option>
          </select>}

          {categorizeLocations().map(mapToCategory)}
      </Col>
    )
}

Locations.Search = function searchField({ search }) {
    return (
      <input type="text" className="Search-bar" placeholder="Search" value={search.query} onChange={(e) => { search.setSearch(e.target.value) }} />
    )
}

export default Locations
