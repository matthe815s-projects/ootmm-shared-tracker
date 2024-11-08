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

export default {
  fetchLocationFromUrl
}
