import UsernameContext from '../contexts/UsernameContext';
import React, {useContext} from "react";

const LocationCheck = React.memo(({ index, locationName, checkData, setCheckState }) => {
  const client = useContext(UsernameContext)
  if (!checkData) checkData = {}

  return (
    <div className="Location">
      <span>
        <input type="checkbox" checked={checkData.checked||false} onChange={(e) => { setCheckState(client.clientUsername, index, e.target.checked) }} />
        <label style={{paddingLeft: "5px"}}>{locationName.category} - {locationName.name}</label>
      </span>
      <label><b>{checkData.checked ? `${checkData.client}` : ""}</b></label>
    </div>
  );
})

export default LocationCheck;
