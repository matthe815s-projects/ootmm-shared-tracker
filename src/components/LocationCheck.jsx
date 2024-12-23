import UsernameContext from '../contexts/UsernameContext';
import React, {useContext} from "react";

const LocationCheck = React.memo(({ index, locationName, players, checkData, setCheckState }) => {
  const client = useContext(UsernameContext)
  if (!checkData) checkData = {}

  return (
    <div className="Location">
      <span>
        <input type="checkbox" checked={((checkData.checked && client.isMultiworld && checkData.client.includes(players.indexOf(client.clientUsername))))||false} onChange={(e) => { setCheckState(client.clientUsername, index, e.target.checked) }} />
        <label style={{paddingLeft: "5px"}}>{locationName.category} - {locationName.name}</label>
      </span>
      <label>{Array.isArray(checkData.client) && checkData.client.map((client) => <LocationCheck.Username players={players} client={client} />)}</label>
    </div>
  );
})

LocationCheck.Username = function Username({ players, client }) {
  return <span><b>{players[client]}</b></span>
}

export default LocationCheck;
