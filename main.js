document.addEventListener("DOMContentLoaded", function () {
    // Set today's date automatically
    document.getElementById("date").valueAsDate = new Date();
    
    // Initialize the application
    initApp();
});

function initApp() {
    // Add event listeners
    document.getElementById('addRow').addEventListener('click', addNewRow);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    document.getElementById('resetForm').addEventListener('click', resetForm);
    
    // Calculate initial total
    updateRowListeners();
    calculateFinalTotal();
    
    // Initialize PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
    
    // Show install prompt for PWA
    let deferredPrompt;
    const installContainer = document.createElement('div');
    installContainer.id = 'installContainer';
    installContainer.innerHTML = `
        <p>Install this app for easier access</p>
        <button id="installButton">Install</button>
        <button id="closeInstall">Close</button>
    `;
    document.body.appendChild(installContainer);
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installContainer.style.display = 'block';
    });
    
    document.getElementById('installButton').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                installContainer.style.display = 'none';
            }
            deferredPrompt = null;
        }
    });
    
    document.getElementById('closeInstall').addEventListener('click', () => {
        installContainer.style.display = 'none';
    });
}

// Function to update event listeners
function updateRowListeners() {
    document.querySelectorAll(".qty, .mrp").forEach(input => {
        input.addEventListener("input", function () {
            calculateRowTotal(this.closest("tr"));
            calculateFinalTotal();
        });
    });

    document.querySelectorAll(".removeRow").forEach(button => {
        button.addEventListener("click", function() {
            if (document.querySelectorAll('.item-row').length > 1) {
                this.closest("tr").remove();
                updateSerialNumbers();
                calculateFinalTotal();
            } else {
                alert("You need at least one item in the invoice.");
            }
        });
    });
}

// Calculate total for a single row
function calculateRowTotal(row) {
    const qty = parseFloat(row.querySelector(".qty").value) || 0;
    const mrp = parseFloat(row.querySelector(".mrp").value) || 0;
    const total = (qty * mrp).toFixed(2);
    row.querySelector(".total").value = total;
}

// Add new item row
function addNewRow() {
    const table = document.getElementById("itemsTable");
    const tbody = table.querySelector('tbody');
    const rowCount = document.querySelectorAll('.item-row').length;
    
    const newRow = document.createElement("tr");
    newRow.classList.add("item-row");
    newRow.innerHTML = `
        <td><input type="number" class="slno" value="${rowCount + 1}" min="1" required></td>
        <td><input type="text" class="desc" value="Cockroach Pest" required></td>
        <td><input type="number" class="qty" min="1" value="1" required></td>
        <td><input type="number" class="mrp" min="1" value="135" step="0.01" required></td>
        <td><input type="text" class="total" readonly></td>
        <td class="no-print"><button type="button" class="removeRow">Remove</button></td>
    `;
    
    tbody.appendChild(newRow);
    updateRowListeners();
    calculateRowTotal(newRow);
    calculateFinalTotal();
}

// Update serial numbers
function updateSerialNumbers() {
    document.querySelectorAll('.item-row').forEach((row, index) => {
        row.querySelector('.slno').value = index + 1;
    });
}

// Calculate the final total
function calculateFinalTotal() {
    let totalAmount = 0;
    document.querySelectorAll(".total").forEach(input => {
        totalAmount += parseFloat(input.value) || 0;
    });
    document.getElementById("finalTotal").textContent = totalAmount.toFixed(2);
}

// Generate PDF/Print function
function generatePDF() {
    window.print();
}

// Reset form function
function resetForm() {
    if (confirm("Are you sure you want to reset the form? All data will be lost.")) {
        document.getElementById("invoiceForm").reset();
        document.getElementById("date").valueAsDate = new Date();
        
        // Remove all but first item row
        const rows = document.querySelectorAll('.item-row');
        for (let i = 1; i < rows.length; i++) {
            rows[i].remove();
        }
        
        // Reset first row
        const firstRow = document.querySelector('.item-row');
        firstRow.querySelector('.qty').value = 1;
        firstRow.querySelector('.mrp').value = 135;
        calculateRowTotal(firstRow);
        calculateFinalTotal();
    }
}
