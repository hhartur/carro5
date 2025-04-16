/**
 * Represents a generic Vehicle, serving as a base class.
 */
class Vehicle {
    /**
     * Creates a Vehicle instance.
     * @param {string} make - The manufacturer of the vehicle.
     * @param {string} model - The model name of the vehicle.
     * @param {number|string} year - The manufacturing year.
     * @param {string} [id=generateUniqueId()] - A unique identifier.
     * @param {string} [status='off'] - The current status ('off', 'on', 'moving').
     * @param {number} [speed=0] - The current speed in km/h.
     * @param {Array<object>} [maintenanceHistory=[]] - An array of *plain* maintenance objects (will be converted).
     */
    constructor(make, model, year, id = generateUniqueId(), status = 'off', speed = 0, maintenanceHistory = []) {
        this.id = id;
        this.make = make;
        this.model = model;
        this.year = parseInt(year);
        this.status = status; // 'off', 'on', 'moving'
        this.speed = parseFloat(speed); // Current speed
        // Ensure maintenanceHistory contains Maintenance instances
        this.maintenanceHistory = maintenanceHistory
                                    .map(m => m instanceof Maintenance ? m : Maintenance.fromJSON(m))
                                    .filter(m => m !== null) // Filter out invalid entries
                                    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort on load
        this._type = 'Vehicle'; // For deserialization identification
    }

    /**
     * Starts the vehicle's engine.
     * @returns {boolean} True if the vehicle was started, false otherwise.
     */
    start() {
        if (this.status === 'off') {
            this.status = 'on';
            console.log(`${this.make} ${this.model} ligado.`);
            return true;
        }
        console.log(`${this.make} ${this.model} já está ligado.`);
        return false;
    }

    /**
     * Stops the vehicle's engine. Cannot stop if moving.
     * @returns {boolean} True if the vehicle was stopped, false otherwise.
     */
    stop() {
        if (this.status !== 'off') {
            if (this.speed > 0) {
                console.warn(`Não pode desligar ${this.make} ${this.model} em movimento! Freie primeiro.`);
                // showNotification is defined in utils.js, ensure it's loaded globally or passed/imported
                if (typeof showNotification === 'function') {
                    showNotification(`Freie o ${this.model} antes de desligar!`, 'error');
                }
                return false;
            }
            this.status = 'off';
            this.speed = 0; // Ensure speed is 0 when stopped
            console.log(`${this.make} ${this.model} desligado.`);
            return true;
        }
        console.log(`${this.make} ${this.model} já está desligado.`);
        return false;
    }

    /**
     * Accelerates the vehicle.
     * @param {number} [amount=10] - The amount to increase the speed by (km/h).
     * @returns {boolean} True if acceleration occurred, false otherwise (e.g., engine off).
     */
    accelerate(amount = 10) {
        if (this.status === 'on' || this.status === 'moving') {
            // If amount is 0, just check status without changing speed (used by subclasses)
            if (amount === 0) return true;
            this.status = 'moving';
            this.speed += amount;
            if (this.speed < 0) this.speed = 0; // Speed cannot be negative
            console.log(`${this.make} ${this.model} acelerando para ${this.speed.toFixed(1)} km/h.`);
            return true;
        } else {
            console.warn(`Ligue o ${this.make} ${this.model} antes de acelerar.`);
             if (typeof showNotification === 'function') {
                showNotification(`Ligue o ${this.model} para acelerar.`, 'warning');
             }
            return false;
        }
    }

    /**
     * Brakes the vehicle.
     * @param {number} [amount=15] - The amount to decrease the speed by (km/h).
     * @returns {boolean} True if braking occurred, false otherwise (e.g., not moving).
     */
    brake(amount = 15) {
        if (this.status === 'moving') {
            this.speed -= amount;
            if (this.speed <= 0) {
                this.speed = 0;
                this.status = 'on'; // Stopped but engine potentially still on
                console.log(`${this.make} ${this.model} parou.`);
            } else {
                console.log(`${this.make} ${this.model} freando para ${this.speed.toFixed(1)} km/h.`);
            }
             return true;
        }
         console.log(`${this.make} ${this.model} não está em movimento para frear.`);
         return false;
    }

    /**
     * Adds a maintenance record to the vehicle's history.
     * @param {Maintenance} maintenanceRecord - The Maintenance instance to add.
     * @returns {boolean} True if the record was added successfully, false otherwise.
     */
    addMaintenance(maintenanceRecord) {
        if (maintenanceRecord instanceof Maintenance && maintenanceRecord.isValid()) {
            this.maintenanceHistory.push(maintenanceRecord);
            // Sort history by date (most recent first)
            this.maintenanceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log(`Manutenção adicionada para ${this.make} ${this.model}.`);
            return true;
        } else {
            console.error('Registro de manutenção inválido:', maintenanceRecord);
            if (typeof showNotification === 'function') {
                showNotification('Dados de manutenção inválidos.', 'error');
            }
            return false;
        }
    }

    /**
     * Gets the maintenance history formatted as an array of strings.
     * @returns {Array<string>} Array of formatted maintenance strings, or a message if empty.
     */
    getFormattedMaintenanceHistory() {
        if (!this.maintenanceHistory || this.maintenanceHistory.length === 0) {
            return ["Nenhum histórico de manutenção registrado."];
        }
        return this.maintenanceHistory.map(maint => maint.format());
    }

     /**
     * Gets maintenance records scheduled for the future, sorted soonest first.
     * @returns {Array<Maintenance>} Array of future Maintenance instances.
     */
    getFutureAppointments() {
        const now = new Date();
        return this.maintenanceHistory
            .filter(maint => {
                 try { return new Date(maint.date) > now; }
                 catch (e) { return false; } // Handle invalid dates during filtering
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort upcoming soonest first
    }

    /**
     * Returns a plain JavaScript object representation of the Vehicle.
     * Includes `_type` for identification during deserialization.
     * @returns {object} Plain object with vehicle data.
     */
    toJSON() {
        return {
            _type: this._type, // CRUCIAL for knowing which class to recreate
            id: this.id,
            make: this.make,
            model: this.model,
            year: this.year,
            status: this.status,
            speed: this.speed,
            // Convert Maintenance objects back to plain objects for JSON
            maintenanceHistory: this.maintenanceHistory.map(m => m.toJSON())
        };
    }

    /**
     * Creates a Vehicle instance from a plain JavaScript object.
     * This base method is usually called by subclass `fromJSON` or as a fallback.
     * @param {object} json - The plain object containing vehicle data.
     * @returns {Vehicle|null} A new Vehicle instance or null if json is invalid.
     */
    static fromJSON(json) {
         if (!json || !json.make || !json.model || !json.year) return null;
        // Basic Vehicle - subclasses will override this
        const vehicle = new Vehicle(
            json.make,
            json.model,
            json.year,
            json.id,
            json.status,
            json.speed,
            json.maintenanceHistory || [] // Pass plain history objects
        );
        return vehicle;
    }
}