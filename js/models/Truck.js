/**
 * Represents a Truck, inheriting from Vehicle and adding cargo management.
 */
class Truck extends Vehicle {
    /**
     * Creates a Truck instance.
     * @param {string} make - The manufacturer.
     * @param {string} model - The model name.
     * @param {number|string} year - The manufacturing year.
     * @param {number|string} maxLoad - The maximum cargo capacity in kg.
     * @param {string} [id] - Unique identifier.
     * @param {string} [status] - Current status.
     * @param {number} [speed] - Current speed.
     * @param {Array<object>} [maintenanceHistory] - Array of plain maintenance objects.
     * @param {number|string} [currentLoad=0] - The current cargo load in kg.
     */
    constructor(make, model, year, maxLoad, id, status, speed, maintenanceHistory, currentLoad = 0) {
        super(make, model, year, id, status, speed, maintenanceHistory);
        this.maxLoad = parseInt(maxLoad) || 1000; // Default max load if invalid
        this.currentLoad = parseInt(currentLoad) || 0; // Default current load
        this._type = 'Truck'; // Set type for deserialization
    }

    /**
     * Loads cargo onto the truck.
     * @param {number|string} amount - The amount of cargo to load (kg).
     * @returns {boolean} True if cargo was loaded successfully, false otherwise.
     */
    loadCargo(amount) {
         amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0) {
             if (typeof showNotification === 'function') showNotification("Quantidade de carga inválida.", "error");
             return false;
        }
        if (this.currentLoad + amount <= this.maxLoad) {
            this.currentLoad += amount;
            console.log(`${this.make} ${this.model} carregado com ${amount}kg. Carga total: ${this.currentLoad}kg.`);
            if (typeof showNotification === 'function') showNotification(`+${amount}kg carregado. Total: ${this.currentLoad}kg.`, 'success');
            return true;
        } else {
            console.warn(`${this.make} ${this.model} não pode carregar ${amount}kg. Excede a carga máxima de ${this.maxLoad}kg.`);
            if (typeof showNotification === 'function') showNotification(`Carga máxima (${this.maxLoad}kg) excedida!`, 'error');
            return false;
        }
    }

    /**
     * Unloads cargo from the truck.
     * @param {number|string} amount - The amount of cargo to unload (kg).
     * @returns {boolean} True if cargo was unloaded successfully, false otherwise.
     */
    unloadCargo(amount) {
        amount = parseInt(amount);
        if (isNaN(amount) || amount <= 0) {
             if (typeof showNotification === 'function') showNotification("Quantidade de carga inválida.", "error");
             return false;
        }
        if (amount <= this.currentLoad) {
            this.currentLoad -= amount;
            console.log(`${this.make} ${this.model} descarregado ${amount}kg. Carga restante: ${this.currentLoad}kg.`);
             if (typeof showNotification === 'function') showNotification(`-${amount}kg descarregado. Restante: ${this.currentLoad}kg.`, 'success');
            return true;
        } else {
            console.warn(`${this.make} ${this.model} não tem ${amount}kg para descarregar. Carga atual: ${this.currentLoad}kg.`);
            if (typeof showNotification === 'function') showNotification(`Não há ${amount}kg para descarregar.`, 'error');
            return false;
        }
    }

    /**
     * Accelerates the truck, considering the current load.
     * Overrides the base accelerate method.
     * @param {number} [amount=8] - Base acceleration amount (lower default for truck).
     * @returns {boolean} True if acceleration occurred, false otherwise.
     */
    accelerate(amount = 8) { // Truck base acceleration is lower
         // Check if engine allows acceleration
         if (!super.accelerate(0)) return false;

        // Reduce acceleration based on load (example formula)
        const loadFactor = Math.max(0.2, 1 - (this.currentLoad / (this.maxLoad * 1.5))); // Never less than 20% effective acceleration
        const effectiveAmount = amount * loadFactor;
        console.log(`Fator de Carga (Aceleração): ${loadFactor.toFixed(2)}`);
        // Call parent accelerate with the adjusted amount
        return super.accelerate(effectiveAmount);
    }

    /**
     * Brakes the truck, considering the current load.
     * Overrides the base brake method.
     * @param {number} [amount=10] - Base braking amount (weaker default for truck).
     * @returns {boolean} True if braking occurred, false otherwise.
     */
    brake(amount = 10) { // Truck base braking is weaker
        // Use parent brake logic, but modify the amount based on load
        // Check if the vehicle is moving first (handled implicitly by super.brake, but explicit check is fine too)
        if (this.status !== 'moving') {
            console.log(`${this.make} ${this.model} não está em movimento para frear.`);
            return false;
        }

        // Reduce braking power based on load (example formula)
        // Heavier loads make braking harder (less effective)
        const loadFactor = Math.max(0.3, 1 - (this.currentLoad / (this.maxLoad * 2))); // Never less than 30% effective braking
        const effectiveAmount = amount * loadFactor;
        console.log(`Fator de Carga (Frenagem): ${loadFactor.toFixed(2)}`);
        // Call parent brake with the adjusted amount
        return super.brake(effectiveAmount);
    }

    /**
     * Returns a plain JavaScript object representation of the Truck.
     * Includes cargo capacity and current load.
     * @returns {object} Plain object with truck data including _type, maxLoad, currentLoad.
     */
     toJSON() {
        const json = super.toJSON(); // Get base Vehicle JSON
        json.maxLoad = this.maxLoad;
        json.currentLoad = this.currentLoad;
        // _type is already 'Truck' from constructor
        return json;
    }

    /**
     * Creates a Truck instance from a plain JavaScript object.
     * @param {object} json - The plain object containing truck data.
     * @returns {Truck|null} A new Truck instance or null if json is invalid or not a Truck type.
     */
     static fromJSON(json) {
         if (!json || json._type !== 'Truck') return null;
         // maxLoad is required for a truck, provide a default if missing in older data?
         const maxLoad = json.maxLoad !== undefined ? json.maxLoad : 1000; // Or handle as error if needed

         const truck = new Truck(
             json.make,
             json.model,
             json.year,
             maxLoad, // Use validated/defaulted maxLoad
             json.id,
             json.status,
             json.speed,
             json.maintenanceHistory || [],
             json.currentLoad || 0 // Restore current load, default to 0
         );
         return truck;
    }
}