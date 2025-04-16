// --- Smart Garage Pro - Multi-Theme JS v5 (COMPLETO E CORRIGIDO) ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded - Initializing Smart Garage Pro v5");
    // --- Element Cache & Initial State ---
    const garage = new Garage();
    let selectedVehicle = null;
    let currentActiveTab = 'dashboard';
    let engineInterval = null;
    let isPanelAnimating = false;
    const defaultTheme = 'dark';

    // Selectors
    const body = document.body;
    const themeSwitcher = document.querySelector('.theme-switcher');
    const themeButtons = themeSwitcher?.querySelectorAll('.theme-button[data-theme]') ?? [];
    const mainNav = document.querySelector('.main-nav');
    const navLinks = mainNav?.querySelectorAll('.nav-link[data-tab-target]') ?? [];
    const tabContents = document.querySelectorAll('.tab-content[data-tab-content]');
    const garageDisplay = document.getElementById('garage-display');
    const detailsColumn = document.querySelector('.garage-column-details');
    const detailsPlaceholder = document.getElementById('details-placeholder');
    const vehicleDetailsTemplate = document.getElementById('vehicle-details-template');
    const futureAppointmentsList = document.getElementById('future-appointments-list');
    const addVehicleForm = document.getElementById('add-vehicle-form');
    const vehicleTypeSelect = document.getElementById('vehicle-type');
    const truckSpecificFields = document.getElementById('truck-specific-fields');
    const notificationArea = document.getElementById('notification-area');

    // --- Core Initialization ---
    function initializeApp() {
        console.log("Running initializeApp");
        if (!mainNav || !tabContents.length || !garageDisplay || !detailsColumn || !detailsPlaceholder || !vehicleDetailsTemplate) {
            console.error("Essential UI elements missing! Check IDs/Classes in HTML.");
            if (typeof showNotification === 'function') {
                showNotification("Erro crítico: Interface não carregou.", "error", 10000);
            }
            return;
        }
        setupEventListeners();
        loadTheme();
        garage.loadFromLocalStorage();
        const initialTab = getTabFromHash() || 'dashboard';
        setActiveTab(initialTab, true);
        renderGarageList();
        renderFutureAppointmentsList();
        triggerRenderForTab(initialTab, true); // Renderiza e anima a aba inicial
        console.log("App Initialized.");
    }

    // --- Theme Management ---
    function loadTheme() {
        const savedTheme = localStorage.getItem('smartGarageTheme') || defaultTheme;
        setTheme(savedTheme);
    }

    function setTheme(themeName) {
        console.log(`Setting theme: ${themeName}`);
        body.dataset.theme = themeName;
        themeButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.theme === themeName);
        });
        localStorage.setItem('smartGarageTheme', themeName);
        // Update Flatpickr theme dynamically
        updateFlatpickrTheme();
    }

    // --- Tab Management ---
    function setActiveTab(tabId, isInitialLoad = false) {
        if (!tabId) return;
        console.log(`Setting active tab: ${tabId}`);
        currentActiveTab = tabId;

        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tabTarget === tabId);
        });

        tabContents.forEach(content => {
            const contentId = content.id.replace('tab-', '');
            const isActive = contentId === tabId;
            content.style.animation = 'none'; // Reset animation before potential change

            if (isActive) {
                content.style.display = 'block';
                requestAnimationFrame(() => content.classList.add('active-tab'));
                triggerRenderForTab(tabId, isInitialLoad);
            } else {
                if (content.classList.contains('active-tab')) {
                    content.classList.remove('active-tab');
                    content.addEventListener('transitionend', handleTabHideTransition, { once: true });
                    setTimeout(() => handleTabHideTransition({ target: content }), 500); // Fallback
                } else {
                    content.style.display = 'none';
                }
            }
        });

        if (!isInitialLoad) updateUrlHash(tabId);
    }

    function handleTabHideTransition(event) {
        const target = event.target;
        if (target && !target.classList.contains('active-tab')) {
            target.style.display = 'none';
            target.querySelectorAll('.card-section.visible').forEach(el => {
                el.classList.remove('visible');
                el.style.transitionDelay = '';
            });
        }
    }

    function getTabFromHash() { return window.location.hash.substring(1); }
    function updateUrlHash(tabId) { if (window.history.pushState) window.history.pushState(null, '', `#${tabId}`);}

    function triggerRenderForTab(tabId, isInitialLoad) {
        console.log(`Rendering for tab: ${tabId}`);
        const tabElement = document.getElementById(`tab-${tabId}`);
        if (!tabElement) return;

        const sections = tabElement.querySelectorAll('.card-section');
        applyStaggeredAnimation(sections, 'visible', 0.08, isInitialLoad);

        switch (tabId) {
            case 'dashboard': renderDashboard(); break;
            case 'garage': renderFutureAppointmentsList(); break; // Garage list is already rendered
            case 'stats': renderStats(); break;
        }
    }

    function applyStaggeredAnimation(elements, triggerClass, baseDelay = 0.06, skipAnimation = false) {
        if (!elements || elements.length === 0) return;
        elements.forEach((el, index) => {
            el.style.transitionDelay = skipAnimation ? '0s' : `${index * baseDelay}s`;
            requestAnimationFrame(() => el.classList.add(triggerClass));
            el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
            setTimeout(() => { el.style.transitionDelay = ''; }, 1000 + (index * baseDelay * 1000)); // Fallback cleanup
        });
    }

    // --- Dashboard & Stats Rendering ---
    function renderDashboard() {
        console.log("Rendering Dashboard");
        const dashboardTab = document.getElementById('tab-dashboard');
        if (!dashboardTab) return;

        const vehicles = garage.vehicles;
        const totalVehicles = vehicles.length;
        const typeCounts = countVehicleTypes();
        const appointments = garage.getAllFutureAppointments();
        const totalCost = calculateTotalMaintenanceCost();

        updateStatElement("totalVehicles", totalVehicles);
        updateStatElement("vehicleTypes", `${typeCounts.Car || 0}C / ${typeCounts.SportsCar || 0}S / ${typeCounts.Truck || 0}T`);
        updateStatElement("typeDetails", `Carros: ${typeCounts.Car || 0} | Esportivos: ${typeCounts.SportsCar || 0} | Caminhões: ${typeCounts.Truck || 0}`);

        if (appointments.length > 0) {
            const nextApp = appointments[0];
            const dateStr = new Date(nextApp.maintenance.date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
            updateStatElement("nextAppointment", dateStr);
            updateStatElement("appointmentDetails", `${nextApp.vehicleInfo.split('(')[0]} - ${nextApp.maintenance.type}`);
        } else {
            updateStatElement("nextAppointment", 'Nenhum');
            updateStatElement("appointmentDetails", '');
        }
        updateStatElement("totalMaintCostDash", `R$ ${totalCost.toFixed(2)}`);

        // Apply entrance animation ONLY if the tab is currently active
        if (dashboardTab.classList.contains('active-tab')) {
             applyStaggeredAnimation(dashboardTab.querySelectorAll('.stat-card'), 'visible', 0.05);
         }
    }

    function renderStats() {
        console.log("Rendering Stats");
        const statsTab = document.getElementById('tab-stats');
        if (!statsTab) return;

        const vehicles = garage.vehicles;
        const numVehicles = vehicles.length;
        const totalCost = calculateTotalMaintenanceCost();
        const vehicleCosts = calculateMaintenanceCostPerVehicle();
        const typeCounts = countVehicleTypes();
        const { mostExpensiveId, maxCost } = findMostExpensiveVehicle(vehicleCosts);

        updateStatElement("totalCost", `R$ ${totalCost.toFixed(2)}`);
        updateStatElement("avgCost", `R$ ${(numVehicles > 0 ? totalCost / numVehicles : 0).toFixed(2)}`);

        if (mostExpensiveId) {
            updateStatElement("mostExpensiveVehicle", vehicleCosts[mostExpensiveId].name);
            updateStatElement("mostExpensiveCost", `(R$ ${maxCost.toFixed(2)})`);
        } else {
            updateStatElement("mostExpensiveVehicle", 'N/A');
            updateStatElement("mostExpensiveCost", '');
        }
        updateTypeDistributionChart(typeCounts);

        if (statsTab.classList.contains('active-tab')) {
             applyStaggeredAnimation(statsTab.querySelectorAll('.stat-card'), 'visible', 0.05);
         }
    }

    function updateStatElement(statName, value) {
        const element = document.querySelector(`[data-stat="${statName}"]`);
        if (element) {
            const currentValueText = element.textContent;
            const currentValue = parseFloat(currentValueText.replace(/[^0-9.,-]+/g, "").replace(',', '.')) || 0;
            const newValue = typeof value === 'number' ? value : (parseFloat(value.toString().replace(/[^0-9.,-]+/g, "").replace(',', '.')) || null);
            const newValueText = (value ?? '-').toString(); // Convert null/undefined to '-'

            if (element.dataset.counting === 'true') { // If already counting, just update the target
                element.dataset.targetValue = newValueText;
                return;
            }

            if (newValue !== null && typeof newValue === 'number' && !isNaN(currentValue) && newValue !== currentValue) {
                const prefix = typeof value === 'string' && value.startsWith('R$') ? 'R$ ' : '';
                animateCounter(element, currentValue, newValue, prefix);
            } else if (currentValueText !== newValueText) {
                element.textContent = newValueText;
            }
        } else {
            // console.warn(`Stat element not found: ${statName}`);
        }
    }

    function animateCounter(element, start, end, prefix = '', duration = 700) {
        element.dataset.counting = 'true';
        element.dataset.targetValue = (prefix === 'R$ ' ? end.toFixed(2) : end).toString(); // Store target
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
            const currentVal = start + (end - start) * easedProgress;

            let formattedValue;
            if (prefix === 'R$ ') {
                formattedValue = `${prefix}${currentVal.toFixed(2).replace('.', ',')}`;
            } else {
                const hasDecimal = end % 1 !== 0 || start % 1 !== 0;
                formattedValue = `${prefix}${hasDecimal ? currentVal.toFixed(1).replace('.', ',') : Math.round(currentVal)}`;
            }
            element.textContent = formattedValue;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                // Ensure final value is exactly the target stored
                let finalFormattedValue;
                 const targetEnd = parseFloat(element.dataset.targetValue.replace(/[^0-9.,-]+/g,"").replace(',', '.')) || end; // Use stored target
                 if (prefix === 'R$ ') {
                     finalFormattedValue = `${prefix}${targetEnd.toFixed(2).replace('.', ',')}`;
                 } else {
                     const endHasDecimal = targetEnd % 1 !== 0;
                     finalFormattedValue = `${prefix}${endHasDecimal ? targetEnd.toFixed(1).replace('.', ',') : Math.round(targetEnd)}`;
                 }
                 element.textContent = finalFormattedValue;
                delete element.dataset.counting;
                delete element.dataset.targetValue;
            }
        };
        requestAnimationFrame(step);
    }

    // --- Calculation Helpers (Completos e Corrigidos) ---
    function calculateTotalMaintenanceCost() {
        return garage.vehicles.reduce((sum, vehicle) => {
            return sum + (vehicle.maintenanceHistory || []).reduce((maintSum, maint) => maintSum + (maint.cost && !isNaN(maint.cost) ? maint.cost : 0), 0);
        }, 0);
    }
    function calculateMaintenanceCostPerVehicle() {
        let costs = {};
        garage.vehicles.forEach(vehicle => {
            costs[vehicle.id] = {
                name: `${vehicle.make} ${vehicle.model}`,
                cost: (vehicle.maintenanceHistory || []).reduce((maintSum, maint) => maintSum + (maint.cost && !isNaN(maint.cost) ? maint.cost : 0), 0)
            };
        });
        return costs;
    }
    function countVehicleTypes() {
         return garage.vehicles.reduce((acc, vehicle) => {
             acc[vehicle._type] = (acc[vehicle._type] || 0) + 1;
             return acc;
         }, { Car: 0, SportsCar: 0, Truck: 0 });
    }
    function findMostExpensiveVehicle(vehicleCosts) {
        let mostExpensiveId = null;
        let maxCost = -1;
        for (const id in vehicleCosts) {
            if (vehicleCosts[id].cost > maxCost) {
                maxCost = vehicleCosts[id].cost;
                mostExpensiveId = id;
            }
        }
        return { mostExpensiveId, maxCost };
    }
    function updateTypeDistributionChart(typeCounts) {
        const chartContainer = document.querySelector('[data-stat="typeDistribution"] .type-bar-chart');
        if (!chartContainer) return;
        const maxCount = Math.max(...Object.values(typeCounts), 1);
        Object.keys(typeCounts).forEach(type => {
            const barItem = chartContainer.querySelector(`.bar-item[data-type="${type}"]`);
            if (barItem) {
                const bar = barItem.querySelector('.bar');
                const countSpan = barItem.querySelector('.bar-count');
                const count = typeCounts[type] || 0;
                const percentageHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;
                requestAnimationFrame(() => { bar.style.height = `${percentageHeight}%`; });
                countSpan.textContent = count;
            }
        });
    }

    // --- Garage Rendering & Logic ---
    function renderGarageList() {
        console.log("Rendering Garage List");
        if (!garageDisplay) return;
        const fragment = document.createDocumentFragment();
        let hasVehicles = false;
        const sortedVehicles = [...garage.vehicles].sort((a, b) => a.make.localeCompare(b.make) || a.model.localeCompare(b.model));

        sortedVehicles.forEach((vehicle) => {
            hasVehicles = true;
            const card = createVehicleCard(vehicle);
            fragment.appendChild(card);
        });
        garageDisplay.innerHTML = '';
        if (hasVehicles) {
            garageDisplay.appendChild(fragment);
            applyStaggeredAnimation(garageDisplay.querySelectorAll('.vehicle-card'), 'animate-in', 0.05);
        } else {
            garageDisplay.innerHTML = '<p class="placeholder-text">A garagem está vazia.</p>';
        }
    }

    function createVehicleCard(vehicle) {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.dataset.id = vehicle.id;
        const statusIcon = document.createElement('span'); statusIcon.className = 'status-icon';
        card.innerHTML = `
            <h4>${vehicle.make} ${vehicle.model}</h4>
            <p>${vehicle.year} - ${vehicle._type}</p>
            <div class="card-footer"></div>
        `;
        card.querySelector('.card-footer').appendChild(statusIcon);

        let specificInfo = '';
        if (vehicle instanceof SportsCar) specificInfo = `<p class="info-turbo">Turbo: ${vehicle.turboOn ? 'ON' : 'OFF'}</p>`;
        else if (vehicle instanceof Truck) specificInfo = `<p class="info-load">Carga: ${vehicle.currentLoad}/${vehicle.maxLoad} kg</p>`;
        if (specificInfo) card.querySelector('p').insertAdjacentHTML('afterend', specificInfo);

        updateVehicleCardStatus(card, vehicle);
        card.addEventListener('click', () => selectVehicle(vehicle.id));
        return card;
    }

    function updateVehicleCardStatus(cardElement, vehicle) {
        if (!cardElement || !vehicle) return;
        const statusIcon = cardElement.querySelector('.status-icon');
        if (!statusIcon) return;
        cardElement.classList.remove('pulse-turbo', 'pulse-load');
        statusIcon.classList.remove('on', 'off', 'moving');
        statusIcon.style.animation = ''; // Reset animation overrides

        let pulseRgbVar = ''; // CSS variable name suffix
        switch (vehicle.status) {
            case 'on': statusIcon.classList.add('on'); pulseRgbVar = '--warning-rgb'; break;
            case 'moving': statusIcon.classList.add('moving'); pulseRgbVar = '--success-rgb'; break;
            default: statusIcon.classList.add('off'); pulseRgbVar = '--danger-rgb'; break;
        }
        // Define the color variable for the pulse animation
        statusIcon.style.setProperty('--rgb-color', `var(${pulseRgbVar})`);


        const turboP = cardElement.querySelector('.info-turbo');
        const loadP = cardElement.querySelector('.info-load');
        if (vehicle instanceof SportsCar) {
            if (turboP) turboP.textContent = `Turbo: ${vehicle.turboOn ? 'ON' : 'OFF'}`;
            if (vehicle.turboOn) {
                cardElement.classList.add('pulse-turbo'); // Class for border pulse
                 // Override icon pulse only if engine is on/moving
                 if (vehicle.status !== 'off') {
                    statusIcon.style.setProperty('--rgb-color', `var(--accent-3-rgb)`); // Orange RGB for turbo
                    statusIcon.style.animation = 'pulse 1s infinite alternate';
                 }
            }
            if (loadP) loadP.remove();
        } else if (vehicle instanceof Truck) {
            if (loadP) loadP.textContent = `Carga: ${vehicle.currentLoad}/${vehicle.maxLoad} kg`;
            if (vehicle.currentLoad > 0) cardElement.classList.add('pulse-load'); // Class for border pulse
            if (turboP) turboP.remove();
        } else {
            if (turboP) turboP.remove();
            if (loadP) loadP.remove();
        }
    }

    function triggerVehicleCardAnimation(vehicleId, animationClass) {
        const card = garageDisplay?.querySelector(`.vehicle-card[data-id="${vehicleId}"]`);
        if (card) {
            const actionClasses = ['shake', 'tilt-forward', 'tilt-backward', 'bounce'];
            card.classList.remove(...actionClasses);
            requestAnimationFrame(() => {
                card.classList.add(animationClass);
                card.addEventListener('animationend', () => card.classList.remove(animationClass), { once: true });
            });
        }
    }

    // --- Vehicle Selection & Details Panel (Using Template) ---
    function selectVehicle(vehicleId) {
        if (isPanelAnimating) return;
        console.log(`Selecting vehicle: ID = ${vehicleId}`);
        const previouslySelectedId = selectedVehicle ? selectedVehicle.id : null;
        const isDeselecting = (vehicleId === null || vehicleId === previouslySelectedId);

        garageDisplay?.querySelector('.vehicle-card.selected')?.classList.remove('selected');
        if (!isDeselecting) {
            garageDisplay?.querySelector(`.vehicle-card[data-id="${vehicleId}"]`)?.classList.add('selected');
        }

        if (isDeselecting) {
            selectedVehicle = null;
            removeDetailsPanel();
            stopEngineSound();
        } else {
            selectedVehicle = garage.findVehicle(vehicleId);
            if (selectedVehicle) {
                createOrUpdateDetailsPanel();
                updateEngineSound();
            } else {
                console.error(`Vehicle with ID ${vehicleId} not found!`);
                selectVehicle(null);
            }
        }
    }

    function createOrUpdateDetailsPanel() {
        if (!selectedVehicle || !detailsColumn || !vehicleDetailsTemplate) return;
        removeDetailsPlaceholder(); // Hide placeholder

        let panel = detailsColumn.querySelector('.details-section');
        const needsCreation = !panel;

        if (needsCreation) {
            if (!vehicleDetailsTemplate.content?.firstElementChild) {
                 console.error("Template error!"); showNotification("Erro ao carregar detalhes.", "error"); showDetailsPlaceholder(); return;
            }
            panel = vehicleDetailsTemplate.content.firstElementChild.cloneNode(true);
            detailsColumn.appendChild(panel);
            setupDetailsPanelEventListeners(panel);
        }

        populateDetailsPanelContent(panel, selectedVehicle); // Populate data

        if (needsCreation || !panel.classList.contains('visible')) {
            isPanelAnimating = true;
             if (needsCreation) { panel.style.opacity = '0'; panel.style.transform = 'scale(0.97)'; } // Initial state
             requestAnimationFrame(() => {
                panel.classList.add('visible'); // Trigger CSS transition
                panel.addEventListener('transitionend', () => { isPanelAnimating = false; }, { once: true });
                 setTimeout(() => { isPanelAnimating = false; }, 600); // Fallback
             });
        }
    }

    function removeDetailsPanel() {
        const panel = detailsColumn?.querySelector('.details-section:not(#details-placeholder)');
        if (panel && !isPanelAnimating) {
            isPanelAnimating = true;
            panel.classList.remove('visible'); // Trigger CSS transition
            panel.addEventListener('transitionend', () => {
                if (panel.parentNode) panel.remove();
                isPanelAnimating = false; showDetailsPlaceholder();
            }, { once: true });
            setTimeout(() => { if (panel.parentNode) panel.remove(); isPanelAnimating = false; showDetailsPlaceholder(); }, 600);
        } else if (!panel) {
             showDetailsPlaceholder();
        }
    }

    function showDetailsPlaceholder() {
         if (detailsPlaceholder) {
            detailsPlaceholder.style.display = 'block';
             requestAnimationFrame(()=> detailsPlaceholder.classList.add('visible'));
         }
    }
    function removeDetailsPlaceholder() {
         if (detailsPlaceholder) {
             detailsPlaceholder.classList.remove('visible');
             setTimeout(() => { if (!detailsPlaceholder.classList.contains('visible')) detailsPlaceholder.style.display = 'none'; }, 500);
         }
    }

    function setupDetailsPanelEventListeners(panelElement) {
        console.log("Setting up listeners for panel");
        if (!panelElement) return;
        const find = (selector) => panelElement.querySelector(selector);
        const addListener = (selector, event, handler) => {
            const el = find(selector);
            if (el) {
                 // **Importante: Limpar listeners antigos para evitar duplicação**
                 // Uma forma é clonar o elemento sem listeners, mas é mais complexo.
                 // Ou usar um objeto para guardar referências se precisar remover depois.
                 // Por simplicidade, adicionamos diretamente, mas CUIDADO com múltiplos selects.
                 el.removeEventListener(event, handler); // Tenta remover antes de adicionar
                 el.addEventListener(event, handler);
            } else console.warn(`Element not found: ${selector}`);
        };

        addListener('.close-button', 'click', () => selectVehicle(null));
        addListener('.btn-start', 'click', handleStartVehicle);
        addListener('.btn-stop', 'click', handleStopVehicle);
        addListener('.btn-accelerate', 'click', handleAccelerateVehicle);
        addListener('.btn-brake', 'click', handleBrakeVehicle);
        addListener('.btn-toggle-turbo', 'click', handleToggleTurbo);
        addListener('.btn-load-cargo', 'click', handleLoadCargo);
        addListener('.btn-unload-cargo', 'click', handleUnloadCargo);
        addListener('.btn-remove-vehicle', 'click', handleRemoveVehicle);
        addListener('.schedule-maintenance-form', 'submit', handleScheduleMaintenance);

        // Flatpickr - SEMPRE destruir e recriar aqui
        const dateInput = find('.maint-date');
        if (dateInput && typeof flatpickr !== 'undefined') {
            if (dateInput._flatpickr) dateInput._flatpickr.destroy();
            flatpickr(dateInput, {
                enableTime: true, dateFormat: "Y-m-d H:i", locale: "pt",
                theme: body.dataset.theme === 'light' ? "light" : "dark"
            });
        }
    }

    function populateDetailsPanelContent(panelElement, vehicle) {
        // ... (Implementação completa como na v4, usando os helpers find, updateText, etc.) ...
        if (!panelElement || !vehicle) return;
        console.log(`Populating panel for: ${vehicle.make}`);
        const find = (selector) => panelElement.querySelector(selector);
        const updateText = (sel, txt) => { const el = find(sel); if (el) el.textContent = txt ?? ''; };
        const updateHTML = (sel, html) => { const el = find(sel); if (el) el.innerHTML = html ?? ''; };
        const setDisplay = (sel, dsp) => { const el = find(sel); if(el) el.style.display = dsp; };
        const setDisabled = (sel, dis) => { const el = find(sel); if(el) el.disabled = dis; };
        const toggleClass = (sel, cls, cond) => { const el = find(sel); if(el) el.classList.toggle(cls, cond); };

        updateText('.details-title', `${vehicle.make} ${vehicle.model}`);
        updateHTML('.vehicle-info', `<strong>Ano:</strong> ${vehicle.year}<br><strong>Tipo:</strong> ${vehicle._type}<br><strong title="${vehicle.id}">ID:</strong> <span class="code">...${vehicle.id.slice(-6)}</span>`);
        updateText('.status-indicator', `Status: ${vehicle.status}`);
        updateText('.speed-indicator', `Veloc: ${vehicle.speed.toFixed(0)} km/h`);

        const isSports = vehicle instanceof SportsCar;
        const isTruck = vehicle instanceof Truck;

        setDisplay('.turbo-indicator', isSports ? 'inline-flex' : 'none');
        setDisplay('.btn-toggle-turbo', isSports ? 'inline-flex' : 'none');
        if (isSports) {
            updateText('.turbo-indicator', `Turbo: ${vehicle.turboOn ? 'ON' : 'OFF'}`);
            updateText('.btn-toggle-turbo span:last-child', vehicle.turboOn ? 'Turbo OFF' : 'Turbo ON');
            toggleClass('.btn-toggle-turbo', 'active', vehicle.turboOn);
            setDisabled('.btn-toggle-turbo', vehicle.status === 'off');
        }

        setDisplay('.load-indicator', isTruck ? 'inline-flex' : 'none');
        setDisplay('.truck-load-controls', isTruck ? 'flex' : 'none');
        if (isTruck) {
            updateText('.load-indicator', `Carga: ${vehicle.currentLoad}/${vehicle.maxLoad} kg`);
        }

        setDisabled('.btn-start', vehicle.status !== 'off');
        setDisabled('.btn-stop', vehicle.status === 'off' || vehicle.speed > 0);
        setDisabled('.btn-accelerate', vehicle.status === 'off');
        setDisabled('.btn-brake', vehicle.status !== 'moving');

        const hiddenIdInput = find('.selected-vehicle-id');
        if (hiddenIdInput) hiddenIdInput.value = vehicle.id;

        renderMaintenanceHistory(find('.maintenance-list'), vehicle);
    }

    // --- Engine Sound/Visualizer ---
    function updateEngineSound() {
        const currentPanel = getCurrentDetailsPanel(); // Pega o painel visível
        const visualizer = currentPanel?.querySelector('.engine-visualizer');
        const bars = visualizer?.querySelectorAll('.bar');
        if (!selectedVehicle || !visualizer || !bars) { stopEngineSound(); return; }

        if (selectedVehicle.status === 'on' || selectedVehicle.status === 'moving') {
            visualizer.style.display = 'flex';
            const baseInterval = 160;
            const speedFactor = selectedVehicle.speed > 0 ? Math.max(0.15, 1 - (selectedVehicle.speed / 160)) : 1.3;
            const turboFactor = (selectedVehicle instanceof SportsCar && selectedVehicle.turboOn) ? 0.5 : 1;
            const intervalTime = Math.max(50, baseInterval * speedFactor * turboFactor);

            if (engineInterval) clearInterval(engineInterval);
            engineInterval = setInterval(() => {
                bars.forEach((bar, index) => {
                    const timeOffset = Date.now() * 0.005 + index * 0.5;
                    const heightScale = (Math.sin(timeOffset) + 1) / 2 * 0.8 + 0.2;
                    bar.style.transform = `scaleY(${heightScale})`;
                    // Opcional: variar a cor levemente com base na altura/velocidade?
                    // bar.style.opacity = heightScale;
                });
            }, intervalTime);
        } else {
            stopEngineSound();
        }
    }
    function stopEngineSound() {
        if (engineInterval) clearInterval(engineInterval); engineInterval = null;
        const visualizer = getCurrentDetailsPanel()?.querySelector('.engine-visualizer'); // Procura no painel atual
        if (visualizer) {
            visualizer.style.display = 'none';
            visualizer.querySelectorAll('.bar').forEach(bar => bar.style.transform = 'scaleY(0.1)');
        }
    }

    // --- Maintenance & Appointments ---
    function renderMaintenanceHistory(listElement, vehicle) {
        if (!listElement) return;
        listElement.innerHTML = '';
        if (!vehicle) { listElement.innerHTML = '<li class="placeholder-text">Selecione veículo.</li>'; return; }
        const history = vehicle.getFormattedMaintenanceHistory();
        if (history.length === 0 || history[0].startsWith("Nenhum")) {
            listElement.innerHTML = '<li class="placeholder-text">Nenhum histórico.</li>';
        } else {
            const fragment = document.createDocumentFragment();
            history.forEach(item => {
                 const li = document.createElement('li');
                 li.textContent = item;
                 fragment.appendChild(li);
            });
            listElement.appendChild(fragment);
        }
    }
    function renderFutureAppointmentsList() {
        if (!futureAppointmentsList) return;
        futureAppointmentsList.innerHTML = '';
        const appointments = garage.getAllFutureAppointments();
        if (appointments.length === 0) { futureAppointmentsList.innerHTML = '<li class="placeholder-text">Sem agendamentos.</li>'; return; }
        const fragment = document.createDocumentFragment();
        appointments.forEach(app => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${app.vehicleInfo.split('(')[0]}:</strong> ${app.maintenance.format()}`;
            li.dataset.vehicleId = app.vehicleId;
            li.title = `Ver ${app.vehicleInfo}`;
            li.addEventListener('click', handleAppointmentClick);
            fragment.appendChild(li);
        });
        futureAppointmentsList.appendChild(fragment);
    }
    function handleAppointmentClick(e) {
        const targetId = e.currentTarget.dataset.vehicleId;
        if (currentActiveTab !== 'garage') {
            setActiveTab('garage');
            setTimeout(() => selectVehicle(targetId), 400); // Delay para animação da aba
        } else {
            selectVehicle(targetId);
        }
    }

    // --- Event Listener Setup ---
    function setupEventListeners() {
        mainNav?.addEventListener('click', (e) => {
            const link = e.target.closest('.nav-link[data-tab-target]');
            if (link) { e.preventDefault(); setActiveTab(link.dataset.tabTarget); }
        });
        themeSwitcher?.addEventListener('click', (e) => {
            const button = e.target.closest('.theme-button[data-theme]');
            if (button) { setTheme(button.dataset.theme); }
        });
        vehicleTypeSelect?.addEventListener('change', (e) => {
            truckSpecificFields?.classList.toggle('visible', e.target.value === 'Truck');
        });
        addVehicleForm?.addEventListener('submit', handleAddVehicle);
        window.addEventListener('hashchange', () => {
            const tabId = getTabFromHash();
            if (tabId && ['dashboard', 'garage', 'stats'].includes(tabId) && tabId !== currentActiveTab) {
                setActiveTab(tabId);
            } else if (!tabId && currentActiveTab !== 'dashboard') {
                setActiveTab('dashboard');
            }
        });
        // Listeners do painel de detalhes são dinâmicos
    }

    // --- Event Handlers ---
    function handleAddVehicle(e) {
        e.preventDefault();
        const type = vehicleTypeSelect.value;
        const makeInput = document.getElementById('vehicle-make');
        const modelInput = document.getElementById('vehicle-model');
        const yearInput = document.getElementById('vehicle-year');
        const maxLoadInput = document.getElementById('truck-max-load');
        const make = makeInput?.value.trim();
        const model = modelInput?.value.trim();
        const year = yearInput?.value;
        const maxLoad = maxLoadInput?.value;

        if (!type || !make || !model || !year) { return showNotification('Preencha tipo, marca, modelo e ano.', 'warning'); }

        let newVehicle;
        const id = generateUniqueId();

        try {
             switch (type) {
                 case 'Car': newVehicle = new Car(make, model, year, id); break;
                 case 'SportsCar': newVehicle = new SportsCar(make, model, year, id); break;
                 case 'Truck':
                     if (!maxLoad || parseInt(maxLoad) <= 0) { return showNotification('Carga Máxima inválida.', 'warning'); }
                     newVehicle = new Truck(make, model, year, maxLoad, id);
                     break;
                 default: throw new Error('Tipo inválido');
             }
             if (garage.addVehicle(newVehicle)) {
                 renderGarageList(); // Re-render with animation
                 addVehicleForm.reset(); vehicleTypeSelect.value = "";
                 truckSpecificFields?.classList.remove('visible');
                 showNotification(`${type} ${make} adicionado!`, 'success');
                 updateAllRelevantData();
             } // garage.addVehicle handles duplicate notification
        } catch (error) { console.error(error); showNotification(`Erro: ${error.message}`, 'error'); }
    }

    function handleRemoveVehicle() {
        if (!selectedVehicle) return;
        const panel = getCurrentDetailsPanel(); // Verifica se o painel está visível
        if (!panel) return;

        showConfirmation(`Remover ${selectedVehicle.make} ${selectedVehicle.model}?`, () => {
            const vehicleIdToRemove = selectedVehicle.id;
            const vehicleMakeModel = `${selectedVehicle.make} ${selectedVehicle.model}`;
            const card = garageDisplay?.querySelector(`.vehicle-card[data-id="${vehicleIdToRemove}"]`);

            selectVehicle(null); // Deselect and remove panel first

            const finishRemoval = () => {
                 if (garage.removeVehicle(vehicleIdToRemove)) {
                    showNotification(`${vehicleMakeModel} removido.`, 'info');
                    updateAllRelevantData();
                     if (garage.vehicles.length === 0 && garageDisplay) {
                         garageDisplay.innerHTML = '<p class="placeholder-text">A garagem está vazia.</p>';
                     }
                 } else {
                    showNotification(`Erro ao remover ${vehicleMakeModel}.`, 'error');
                     // Restore card animation class if needed
                     if(card) card.classList.remove('animate-out');
                 }
            };

            if (card) {
                card.classList.add('animate-out'); // Trigger exit animation
                card.addEventListener('transitionend', () => {
                    if (card.parentNode) card.remove(); // Remove from DOM after animation
                    finishRemoval(); // Process data removal after visual removal
                }, { once: true });
                setTimeout(() => { if (card.parentNode) card.remove(); finishRemoval(); }, 400); // Fallback
            } else {
                 finishRemoval(); // Remove data even if card wasn't found
            }
        });
    }

    function handleScheduleMaintenance(e) {
        e.preventDefault();
        if (!selectedVehicle) return;
        const form = e.target;
        const panel = form.closest('.details-section');
        if (!panel) return;

        const dateInput = form.querySelector('.maint-date');
        const typeInput = form.querySelector('.maint-type');
        const costInput = form.querySelector('.maint-cost');
        const descInput = form.querySelector('.maint-desc');
        const historyList = panel.querySelector('.maintenance-list');

        const date = dateInput?.value;
        const type = typeInput?.value.trim();
        const cost = costInput?.value;
        const desc = descInput?.value.trim();

        if (!date || !type || cost === '' || isNaN(parseFloat(cost)) || parseFloat(cost) < 0) {
            return showNotification('Data, Tipo e Custo válido (>= 0) são obrigatórios.', 'warning');
        }
        try {
            const newMaintenance = new Maintenance(date, type, cost, desc);
            if (newMaintenance.isValid() && selectedVehicle.addMaintenance(newMaintenance)) {
                 renderMaintenanceHistory(historyList, selectedVehicle);
                 form.reset();
                 if (dateInput?._flatpickr) dateInput._flatpickr.clear();
                 garage.saveToLocalStorage();
                 showNotification(`Manutenção registrada.`, 'success');
                 updateAllRelevantData();
             } else {
                 showNotification('Falha ao adicionar manutenção.', 'error');
             }
        } catch (error) { console.error(error); showNotification('Erro ao processar.', 'error'); }
    }

    // Vehicle action handlers
    function getCurrentDetailsPanel() { return detailsColumn?.querySelector('.details-section.visible'); }
    function handleStartVehicle() { if (selectedVehicle?.start()) { triggerVehicleCardAnimation(selectedVehicle.id, 'shake'); populateDetailsPanelContent(getCurrentDetailsPanel(), selectedVehicle); updateEngineSound(); garage.saveToLocalStorage(); } }
    function handleStopVehicle() { if (selectedVehicle?.stop()) { stopEngineSound(); populateDetailsPanelContent(getCurrentDetailsPanel(), selectedVehicle); garage.saveToLocalStorage(); } }
    function handleAccelerateVehicle() { if (selectedVehicle?.accelerate()) { triggerVehicleCardAnimation(selectedVehicle.id, 'tilt-forward'); populateDetailsPanelContent(getCurrentDetailsPanel(), selectedVehicle); updateEngineSound(); garage.saveToLocalStorage(); } }
    function handleBrakeVehicle() { if (selectedVehicle?.brake()) { triggerVehicleCardAnimation(selectedVehicle.id, 'tilt-backward'); populateDetailsPanelContent(getCurrentDetailsPanel(), selectedVehicle); updateEngineSound(); garage.saveToLocalStorage(); } }
    function handleToggleTurbo() { if (selectedVehicle instanceof SportsCar && selectedVehicle.toggleTurbo()) { populateDetailsPanelContent(getCurrentDetailsPanel(), selectedVehicle); updateEngineSound(); garage.saveToLocalStorage(); } }
    function handleLoadCargo() { const panel = getCurrentDetailsPanel(); const amountInput = panel?.querySelector('.cargo-amount'); if(!panel || !amountInput) return; const amount = amountInput.value; if (selectedVehicle instanceof Truck && selectedVehicle.loadCargo(amount)) { triggerVehicleCardAnimation(selectedVehicle.id, 'bounce'); populateDetailsPanelContent(panel, selectedVehicle); amountInput.value = ''; garage.saveToLocalStorage(); } }
    function handleUnloadCargo() { const panel = getCurrentDetailsPanel(); const amountInput = panel?.querySelector('.cargo-amount'); if(!panel || !amountInput) return; const amount = amountInput.value; if (selectedVehicle instanceof Truck && selectedVehicle.unloadCargo(amount)) { triggerVehicleCardAnimation(selectedVehicle.id, 'bounce'); populateDetailsPanelContent(panel, selectedVehicle); amountInput.value = ''; garage.saveToLocalStorage(); } }

    // Update relevant data displays
    function updateAllRelevantData() {
        console.log("Updating relevant data displays...");
        // Update data for all tabs, even if not visible
        renderDashboard();
        renderStats();
        renderFutureAppointmentsList();
    }

    // --- Run ---
    initializeApp();

}); // End DOMContentLoaded


// === Utility Functions (utils.js) ===
// Assume estas funções estão definidas corretamente em utils.js
// function generateUniqueId() { /* ... */ }
// function showNotification(message, type = 'info', duration = 4000) { /* ... (com .animate-in/out) ... */ }
// function showConfirmation(message, onConfirm, onCancel) { /* ... (com .visible) ... */ }