import { useState, useEffect } from "react";
import UsernameContext from '../contexts/UsernameContext';

function LocationCheck({ index, locationName, checkData, setCheckState }) {
  const [checkedBy, setCheckedBy] = useState(null);
  if (!checkData) checkData = {}

  return (
    <UsernameContext.Consumer>
      {(client) => (
        <div className="Location" style={{ display: "flex", justifyContent: "space-between" }}>
          {/* Checkbox then text showing name of check */}
          <span>
            <input type="checkbox" checked={checkData.checked||false} onChange={(e) => { setCheckState(client.clientUsername, index, e.target.checked) }} />
            <label style={{paddingLeft: "5px"}}>{locationName.category} - {locationName.name}</label>
          </span>
          <label><b>{checkData.checked ? `${checkData.client}` : ""}</b></label>
        </div>
      )}
    </UsernameContext.Consumer>
  );
}

export default LocationCheck;