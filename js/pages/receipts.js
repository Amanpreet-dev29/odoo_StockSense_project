document.addEventListener('DOMContentLoaded', async () => {
    loadReceipts();
    populateProductDropdown();

    document.getElementById('create-receipt-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const productId = document.getElementById('rec-product').value;
        const qty = parseInt(document.getElementById('rec-qty').value);
        const supplier = document.getElementById('rec-supplier').value;
        const location = document.getElementById('rec-location').value;

        // Process stock addition and log entry
        await processReceipt(productId, qty, location, supplier);
        closeModal('receipt-modal');
        loadReceipts();
    });
});

async function populateProductDropdown() {
    const { data: products } = await supabase.from('products').select('id, name, sku');
    const select = document.getElementById('rec-product');
    select.innerHTML = '<option value="">Select Target Product</option>';
    products.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name} (${p.sku})</option>`;
    });
}

async function loadReceipts() {
    const { data: receipts } = await supabase
        .from('operations')
        .select('*')
        .eq('type', 'Receipt')
        .order('created_at', { ascending: false });

    const tbody = document.getElementById('receipts-table-body');
    tbody.innerHTML = '';

    receipts.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${r.reference_no}</strong></td>
                <td>${r.supplier_or_customer}</td>
                <td>${r.destination_location}</td>
                <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td><button class="btn-sm" onclick="validateReceipt('${r.id}')">Validate</button></td>
            </tr>
        `;
    });
}