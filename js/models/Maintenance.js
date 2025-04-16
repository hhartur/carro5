/**
 * Represents a single maintenance record for a vehicle.
 */
class Maintenance {
    /**
     * Creates a Maintenance instance.
     * @param {string|Date} date - The date and time of the maintenance (ISO string or Date object).
     * @param {string} type - The type of maintenance performed (e.g., "Oil Change").
     * @param {number|string} cost - The cost of the maintenance.
     * @param {string} [description=''] - An optional description.
     */
    constructor(date, type, cost, description = '') {
        this.id = generateUniqueId(); // Unique ID for each record
        this.date = date; // Should be a Date object or ISO string/timestamp
        this.type = type;
        this.cost = parseFloat(cost);
        this.description = description;
    }

    /**
     * Formats the maintenance record into a readable string.
     * @returns {string} Formatted maintenance details.
     */
    format() {
        const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        let formattedDate = 'Data Inválida';
        try {
             formattedDate = new Date(this.date).toLocaleString('pt-BR', dateOptions);
             if (formattedDate === 'Invalid Date') throw new Error(); // Handle invalid date string results
        } catch (e) {
            console.warn("Could not format date:", this.date);
        }

        let formattedString = `${this.type} em ${formattedDate}`;
        if (!isNaN(this.cost) && this.cost > 0) {
            formattedString += ` - R$${this.cost.toFixed(2)}`;
        }
        if (this.description) {
             formattedString += ` (${this.description})`;
        }
        return formattedString;
    }

    /**
     * Validates the essential properties of the maintenance record.
     * @returns {boolean} True if the record is valid, false otherwise.
     */
    isValid() {
        const dateObj = new Date(this.date);
        const isValidDate = dateObj instanceof Date && !isNaN(dateObj);
        const isValidCost = !isNaN(this.cost) && this.cost >= 0;
        const isValidType = typeof this.type === 'string' && this.type.trim() !== '';
        return isValidDate && isValidCost && isValidType;
    }

    /**
     * Returns a plain JavaScript object representation of the maintenance record.
     * Essential for saving to localStorage.
     * @returns {object} Plain object with maintenance data.
     */
    toJSON() {
        return {
            id: this.id,
            date: this.date instanceof Date ? this.date.toISOString() : this.date, // Store date as ISO string for consistency
            type: this.type,
            cost: this.cost,
            description: this.description
        };
    }

    /**
     * Creates a Maintenance instance from a plain JavaScript object.
     * Essential for restoring data from localStorage.
     * @param {object} json - The plain object containing maintenance data.
     * @returns {Maintenance|null} A new Maintenance instance or null if json is invalid.
     */
    static fromJSON(json) {
        if (!json || !json.date || !json.type || json.cost === undefined) return null;
        const maint = new Maintenance(json.date, json.type, json.cost, json.description);
        maint.id = json.id || generateUniqueId(); // Assign existing or new ID
        return maint;
    }
}