import { useEffect, useState } from "react";
import { Col } from "react-bootstrap";
import { stringifyBlob } from "../utils/BlobUtils";
import LocationsCategorized from "./CategoryList";

let queue = []
let queueAwait = false

function LocationsList({ webSocket }) {
    const [checkedBoxes, setCheckedBoxes] = useState([{}]);
    const [locationsLoaded, setLocationsLoaded] = useState(false);
    const [locations, setLocations] = useState([]);
    const [search, setSearch] = useState("");
    const [collapsed, setCollapsed] = useState([]);
    const [filter, setFilter] = useState(0);

    useEffect(() => {
        Promise.all([
            fetchLocationFromUrl("/oot_overworld.json"),
            fetchLocationFromUrl("/oot_dungeons.json"),
            fetchLocationFromUrl("/mm_overworld.json"),
            fetchLocationFromUrl("/mm_dungeons.json")
        ])
            .then((data) => {
                setLocations(data.flat())
                setLocationsLoaded(true)
            })
    }, [])

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

    if (!locationsLoaded) return <p>Loading</p>

    return (
        <Col style={{ height: "100%", overflowY: "scroll" }}>
            {<input type="text" className="Search-bar" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value) }} />}<br />

            {<select style={{ marginTop: "4px" }} onChange={(e) => setFilter(parseInt(e.target.value))} className="Search-bar">
                <option value={"0"}>No filter</option>
                <option value={"1"}>Only show unchecked</option>
            </select>}

            {categorizeLocations().map((category) => <LocationsCategorized category={category} search={search.toLowerCase()} onClicked={() => collapseCategory(category.name)} isCollapsed={!collapsed.includes(category.name) && search === ""} filter={filter} checkedBoxes={checkedBoxes} setCheckState={setCheckState} />)}
        </Col>
    )
}

///

function fetchLocationFromUrl(locationsUrl) {
    return fetch(locationsUrl)
        .then((locationJson) => locationJson.json())
        .then((json) => loadLocationsFromFile(json[0].children ? json[0].children : json, locationsUrl))
}

function loadLocationsFromFile(locationJSON, locationsUrl) {
    let sections = []

    const recurseLocation = (location, name, color) => {
        if (location.children && Array.isArray(location.children)) {
            location.children.forEach(child => recurseLocation(child, name, color));
        }

        if (location.sections && Array.isArray(location.sections)) {
            location.sections = location.sections.map(loc => Object.assign(loc, { category: location.name, area: name, file: /\/([A-Z,a-z,0-9,\-,_]*).json/g.exec(locationsUrl)[1], color }));
            sections = sections.concat(location.sections);
        }
    }

    // console.log(locationJSON)
    locationJSON.forEach(location => recurseLocation(location, location.name, location.color));
    return sections;
}

export default LocationsList
