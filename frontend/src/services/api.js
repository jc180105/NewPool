const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

export async function fetchClients() {
    const res = await fetch(`${API_URL}/clients`);
    if (!res.ok) throw new Error('Failed to fetch clients');
    return res.json();
}

export async function createClient(data) {
    const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create client');
    return res.json();
}

export async function updateClient(id, data) {
    const res = await fetch(`${API_URL}/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update client');
    return res.json();
}

export async function deleteClient(id) {
    const res = await fetch(`${API_URL}/clients/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete client');
    return res.json();
}

// Templates
export async function fetchTemplates(clientId) {
    const url = clientId ? `${API_URL}/templates?client_id=${clientId}` : `${API_URL}/templates`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch templates');
    return res.json();
}

export async function createTemplate(data) {
    const res = await fetch(`${API_URL}/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create template');
    return res.json();
}

export async function updateTemplate(id, data) {
    const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update template');
    return res.json();
}

export async function deleteTemplate(id) {
    const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete template');
    return res.json();
}

// Instances
export async function fetchInstances(startDate, endDate) {
    const res = await fetch(`${API_URL}/instances?start_date=${startDate}&end_date=${endDate}`);
    if (!res.ok) throw new Error('Failed to fetch instances');
    return res.json();
}

export async function createInstance(data) {
    const res = await fetch(`${API_URL}/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create instance');
    }
    return res.json();
}

export async function updateInstance(id, data) {
    const res = await fetch(`${API_URL}/instances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update instance');
    }
    return res.json();
}

export async function deleteInstance(id) {
    const res = await fetch(`${API_URL}/instances/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete instance');
    return res.json();
}

export async function generateWeek(startDate) {
    const res = await fetch(`${API_URL}/instances/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate }),
    });
    if (!res.ok) throw new Error('Failed to generate week');
    return res.json();
}

// Expenses
export async function fetchExpenses() {
    const res = await fetch(`${API_URL}/expenses`);
    if (!res.ok) throw new Error('Failed to fetch expenses');
    return res.json();
}

export async function createExpense(data) {
    const res = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create expense');
    return res.json();
}

export async function updateExpense(id, data) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update expense');
    return res.json();
}

export async function deleteExpense(id) {
    const res = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete expense');
    return res.json();
}
