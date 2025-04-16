/**
 * Represents a Car, inheriting basic functionality from Vehicle.
 */
class Car extends Vehicle {
    /**
     * Creates a Car instance.
     * @param {string} make - The manufacturer.
     * @param {string} model - The model name.
     * @param {number|string} year - The manufacturing year.
     * @param {string} [id] - Unique identifier.
     * @param {string} [status] - Current status.
     * @param {number} [speed] - Current speed.
     * @param {Array<object>} [maintenanceHistory] - Array of plain maintenance objects.
     */
    constructor(make, model, year, id, status, speed, maintenanceHistory) {
        super(make, model, year, id, status, speed, maintenanceHistory);
        this._type = 'Car'; // Set type for deserialization
    }

    /**
     * Returns a plain JavaScript object representation of the Car.
     * @returns {object} Plain object with car data including _type.
     */
    toJSON() {
        // Start with the base class's JSON representation
        const json = super.toJSON();
        // Add Car-specific properties if any in the future
        // json.numDoors = this.numDoors;
        return json; // _type is already correctly set by constructor/super.toJSON()
    }

    /**
     * Creates a Car instance from a plain JavaScript object.
     * @param {object} json - The plain object containing car data.
     * @returns {Car|null} A new Car instance or null if json is invalid or not a Car type.
     */
     static fromJSON(json) {
         if (!json || json._type !== 'Car') return null;
         // Create instance using constructor, passing properties from json
         const car = new Car(
             json.make,
             json.model,
             json.year,
             json.id,
             json.status,
             json.speed,
             json.maintenanceHistory || []
         );
         // Restore Car-specific properties if any were added
         // car.numDoors = json.numDoors;
         return car;
    }
}