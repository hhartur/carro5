/**
 * Represents a Sports Car, inheriting from Car and adding Turbo functionality.
 */
class SportsCar extends Car {
    /**
     * Creates a SportsCar instance.
     * @param {string} make - The manufacturer.
     * @param {string} model - The model name.
     * @param {number|string} year - The manufacturing year.
     * @param {string} [id] - Unique identifier.
     * @param {string} [status] - Current status.
     * @param {number} [speed] - Current speed.
     * @param {Array<object>} [maintenanceHistory] - Array of plain maintenance objects.
     * @param {boolean} [turboOn=false] - Whether the turbo is currently active.
     */
    constructor(make, model, year, id, status, speed, maintenanceHistory, turboOn = false) {
        super(make, model, year, id, status, speed, maintenanceHistory);
        this.turboOn = turboOn;
        this._type = 'SportsCar'; // Set type for deserialization
    }

    /**
     * Toggles the turbo state on or off.
     * @returns {boolean} True if the turbo state was toggled, false otherwise (e.g., engine off).
     */
    toggleTurbo() {
        if (this.status === 'off') {
             // showNotification is defined in utils.js
             if (typeof showNotification === 'function') {
                 showNotification(`Ligue o ${this.model} antes de usar o turbo.`, 'warning');
             }
             return false;
        }
        this.turboOn = !this.turboOn;
        console.log(`${this.make} ${this.model} Turbo: ${this.turboOn ? 'ATIVADO' : 'DESATIVADO'}`);
        if (typeof showNotification === 'function') {
            showNotification(`Turbo ${this.turboOn ? 'ATIVADO!' : 'DESATIVADO'}.`, 'info');
        }
        return true;
    }

    /**
     * Accelerates the sports car, applying a turbo boost if active.
     * Overrides the base accelerate method.
     * @param {number} [amount=15] - Base acceleration amount (higher default for sports car).
     * @returns {boolean} True if acceleration occurred, false otherwise.
     */
    accelerate(amount = 15) { // Sports car base acceleration is higher
        // First, check if the engine allows acceleration using the parent method with amount=0
        if (!super.accelerate(0)) return false;

        let effectiveAmount = amount;
        if (this.turboOn) {
            effectiveAmount *= 1.8; // Turbo boost multiplier!
            console.log("TURBO BOOST!");
        }
        // Now call the parent's accelerate method with the potentially modified amount
        // We call super.accelerate(effectiveAmount) instead of directly modifying speed here
        // to maintain the status logic ('moving') handled by the parent method.
        return super.accelerate(effectiveAmount);
    }

    /**
     * Returns a plain JavaScript object representation of the SportsCar.
     * Includes turbo state.
     * @returns {object} Plain object with sports car data including _type and turboOn.
     */
     toJSON() {
        const json = super.toJSON(); // Get base Car JSON (which includes Vehicle properties)
        json.turboOn = this.turboOn; // Add turbo state
        // _type is already 'SportsCar' from constructor
        return json;
    }

    /**
     * Creates a SportsCar instance from a plain JavaScript object.
     * @param {object} json - The plain object containing sports car data.
     * @returns {SportsCar|null} A new SportsCar instance or null if json is invalid or not a SportsCar type.
     */
     static fromJSON(json) {
         if (!json || json._type !== 'SportsCar') return null;
         const sportsCar = new SportsCar(
             json.make,
             json.model,
             json.year,
             json.id,
             json.status,
             json.speed,
             json.maintenanceHistory || [],
             json.turboOn || false // Restore turbo state, default to false if missing
         );
         return sportsCar;
    }
}