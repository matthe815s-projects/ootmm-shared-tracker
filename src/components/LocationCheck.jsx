import UsernameContext from '../contexts/UsernameContext';
import React, {useContext} from "react";

const LocationCheck = React.memo(({ index, locationName, players, checkData, setCheckState }) => {
  const client = useContext(UsernameContext)
  if (!checkData) checkData = {}
  console.log(checkData)

  function renderPlayerName() {
    if (!checkData.client) return null
    if (Array.isArray(checkData.client)) return checkData.client.map((client) => <b>{players[client]}&nbsp;</b>)
    return checkData.client
  }

  return (
    <div className="Location">
      <span>
        <input type="checkbox" checked={(checkData.checked && client.isMultiworld && checkData.client.includes(players.indexOf(client.clientUsername)))||false} onChange={(e) => { setCheckState(client.clientUsername, index, e.target.checked) }} />
        <label style={{paddingLeft: "5px"}}>{locationName.category} - {locationName.name}</label>
      </span>
      <label>{renderPlayerName()}</label>
    </div>
  );
})

export default LocationCheck;
