import LocationCheck from "./LocationCheck"
import React, {useCallback, useMemo} from "react";

const LocationsCategorized = React.memo(({ category, search, setCheckState, filter, onClicked, isCollapsed, players, checkedBoxes }) => {
    const searchFoundLocation = useMemo(() => category.locations.some((location) => (location.name.toLowerCase().includes(search) || location.category.toLowerCase().includes(search))), [category.locations, search])
    const isCompletelyCleared = useMemo(() => category.locations.every((location) => filter === 1 && (checkedBoxes[location.index] && checkedBoxes[location.index].checked)), [category.locations, filter, checkedBoxes])

    const mapLocationsToNodes = useCallback((location, index, array) => {
        const matchesNameOrCategory = (location.name.toLowerCase().includes(search) || location.category.toLowerCase().includes(search))
        const isChecked = filter === 1 && (checkedBoxes[location.index] && checkedBoxes[location.index].checked)
        if (isChecked) return null

        const isSearching = search !== ""
        const notSearchOrMatchesSearch = !isSearching || matchesNameOrCategory
        if (!notSearchOrMatchesSearch) return null;

        const showCategoryLabel = !isCollapsed && (index === 0 || location.category !== array[index - 1].category);
        return (
            <React.Fragment key={index}>
                  {showCategoryLabel && <label className="NodeName"><b>{location.category}</b></label>}
                  {!isCollapsed && <LocationCheck key={index} index={location.index} locationName={location} players={players} checkData={checkedBoxes[location.index]} setCheckState={setCheckState} />}
            </React.Fragment>
        )
    }, [search, filter, checkedBoxes, isCollapsed, players, setCheckState])


    if (isCompletelyCleared || !searchFoundLocation) return

    return (
        <div className="category">
            <label className="MapAreaName" onClick={onClicked} style={{color: category.color}}>
                {category.name}
                <LocationsCategorized.TotalCount category={category} checkedBoxes={checkedBoxes} />
            </label><br/>
            {category.locations.map(mapLocationsToNodes)}
        </div>
    )
})

LocationsCategorized.TotalCount = function TotalCount({ category, checkedBoxes }) {
    const isLocationChecked = useCallback((location) => checkedBoxes[location.index]?.checked, [checkedBoxes])
    const totalCompleted = useMemo(() => category.locations.filter(isLocationChecked).length, [category.locations, isLocationChecked])

    if (category.locations.length === totalCompleted) {
        return <span>Fully Cleared</span>
    }

    return <span>{totalCompleted} / {category.locations.length} complete</span>
}

export default LocationsCategorized
