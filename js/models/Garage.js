/**
 * Manages a collection of vehicles and handles persistence via localStorage.
 */
class Garage {
    constructor() {
        /** @type {Array<Vehicle>} */
        this.vehicles = [];
        this.localStorageKey = 'smartGarageVehicles_v2'; // Use a versioned key
    }

    /**
     * Adds a vehicle instance to the garage.
     * @param {Vehicle} vehicle - The vehicle instance (Car, SportsCar, Truck) to add.
     * @returns {boolean} True if the vehicle was added successfully, false otherwise.
     */
    addVehicle(vehicle) {
        if (vehicle instanceof Vehicle) {
            // Check for duplicates by ID
             if (!this.vehicles.some(v => v.id === vehicle.id)) {
                 this.vehicles.push(vehicle);
                 console.log(`${vehicle._type} ${vehicle.make} ${vehicle.model} adicionado à garagem.`);
                 this.saveToLocalStorage();
                 return true;
             } else {
                 console.warn(`Veículo com ID ${vehicle.id} (${vehicle.make} ${vehicle.model}) já existe.`);
                 // showNotification is defined in utils.js
                 if (typeof showNotification === 'function') {
                    showNotification('Este veículo (mesmo ID) já está na garagem.', 'warning');
                 }
                 return false;
             }
        } else {
            console.error("Tentativa de adicionar objeto inválido à garagem:", vehicle);
            return false;
        }
    }

    /**
     * Removes a vehicle from the garage by its ID.
     * @param {string} vehicleId - The ID of the vehicle to remove.
     * @returns {boolean} True if the vehicle was removed successfully, false otherwise.
     */
    removeVehicle(vehicleId) {
        const index = this.vehicles.findIndex(v => v.id === vehicleId);
        if (index !== -1) {
            const removedVehicle = this.vehicles.splice(index, 1)[0];
            console.log(`${removedVehicle._type} ${removedVehicle.make} ${removedVehicle.model} removido da garagem.`);
            this.saveToLocalStorage(); // Save the change
            return true;
        }
        console.warn(`Veículo com ID ${vehicleId} não encontrado para remoção.`);
        return false;
    }

    /**
     * Finds and returns a vehicle instance by its ID.
     * @param {string} vehicleId - The ID of the vehicle to find.
     * @returns {Vehicle|undefined} The vehicle instance if found, otherwise undefined.
     */
    findVehicle(vehicleId) {
        return this.vehicles.find(v => v.id === vehicleId);
    }

    /**
     * Saves the current state of the garage (all vehicles) to localStorage.
     * Converts vehicle instances to plain objects using their toJSON methods.
     */
    saveToLocalStorage() {
        try {
            // Use the toJSON method defined on each vehicle class
            const plainVehicles = this.vehicles.map(vehicle => vehicle.toJSON());
            localStorage.setItem(this.localStorageKey, JSON.stringify(plainVehicles));
            console.log('Garagem salva no LocalStorage.');
        } catch (error) {
            console.error("Erro ao salvar no LocalStorage:", error);
             if (typeof showNotification === 'function') {
                showNotification('Erro ao salvar dados da garagem. O armazenamento pode estar cheio.', 'error');
             }
        }
    }

    /**
     * Loads the garage state from localStorage.
     * Recreates vehicle instances from plain objects using static fromJSON methods based on the '_type' property.
     */
    loadFromLocalStorage() {
        const data = localStorage.getItem(this.localStorageKey);
        if (data) {
            try {
                const plainVehicles = JSON.parse(data);
                if (!Array.isArray(plainVehicles)) {
                    throw new Error("Stored data is not an array");
                }

                this.vehicles = plainVehicles.map(plainVehicle => {
                    // *** The crucial deserialization step ***
                    // Check _type to determine which class's fromJSON to call
                    switch (plainVehicle._type) {
                        case 'Car':       return Car.fromJSON(plainVehicle);
                        case 'SportsCar': return SportsCar.fromJSON(plainVehicle);
                        case 'Truck':     return Truck.fromJSON(plainVehicle);
                        case 'Vehicle':   // Fallback for base Vehicle type if stored explicitly
                                          return Vehicle.fromJSON(plainVehicle);
                        default:
                            console.warn('Tipo de veículo desconhecido ou ausente encontrado no localStorage:', plainVehicle);
                            // Attempt to load as base Vehicle if possible, or skip
                            return Vehicle.fromJSON(plainVehicle); // Might return null if essential base props missing
                    }
                }).filter(vehicle => vehicle instanceof Vehicle); // IMPORTANT: Filter out any nulls from failed deserialization

                console.log(`Garagem carregada do LocalStorage. ${this.vehicles.length} veículos carregados.`);

            } catch (error) {
                console.error("Erro ao carregar ou parsear dados do LocalStorage:", error);
                 if (typeof showNotification === 'function') {
                    showNotification('Erro ao carregar dados salvos. Os dados podem estar corrompidos ou em formato antigo. Resetando garagem.', 'error');
                 }
                this.vehicles = []; // Reset to empty garage if loading fails
                // Optionally clear the corrupted data
                // localStorage.removeItem(this.localStorageKey);
            }
        } else {
            console.log('Nenhum dado de garagem encontrado no LocalStorage.');
            this.vehicles = []; // Ensure garage is empty if no data found
        }
    }

    /**
     * Collects all future maintenance appointments from all vehicles in the garage.
     * @returns {Array<object>} An array of objects, each containing { vehicleInfo: string, maintenance: Maintenance }, sorted by date.
     */
     getAllFutureAppointments() {
        let allAppointments = [];
        this.vehicles.forEach(vehicle => {
            const futureMaint = vehicle.getFutureAppointments(); // Already sorted per vehicle
            if (futureMaint.length > 0) {
                // Add vehicle info to each maintenance object for easier display
                allAppointments = allAppointments.concat(
                    futureMaint.map(maint => ({
                        vehicleInfo: `${vehicle.make} ${vehicle.model} (${vehicle.year})`,
                        vehicleId: vehicle.id, // Add vehicle ID for potential linking
                        maintenance: maint
                    }))
                );
            }
        });
        // Sort all appointments globally by date (soonest first)
        allAppointments.sort((a, b) => new Date(a.maintenance.date) - new Date(b.maintenance.date));
        return allAppointments;
     }
}