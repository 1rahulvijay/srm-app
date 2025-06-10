const fetchData = async () => {
    try {
        const endpoints = [
            '/api/data',          // Client data
            '/api/productivity_data', // Productivity data
            '/api/fte_data',      // FTE data
            '/api/sankey_data'    // Sankey data
        ];

        const responses = await Promise.all(endpoints.map(endpoint =>
            fetch(endpoint, { cache: 'no-store' })
        ));

        const data = await Promise.all(responses.map(async response => {
            if (!response.ok) throw new Error(`Network response was not ok for ${response.url}: ${response.status}`);
            return response.json();
        }));

        console.log('Fetched data:', data);
        return data; // Return combined data for further processing
    } catch (error) {
        console.error('Error fetching data:', error);
        return null; // Handle error gracefully
    }
};

// Example usage in drawCharts or similar function
const drawCharts = async () => {
    const combinedData = await fetchData();
    if (combinedData) {
        // Process and render each section's data
        const [clientData, productivityData, fteData, sankeyData] = combinedData;
        // Update metrics and charts with respective data
        updateMetrics(clientData, 'metric-count-id', 'metric-count-gf', 'metric-count-gfc');
        updateMetrics(productivityData, 'metric-tasks-completed', 'metric-avg-completion-time', 'metric-efficiency-rate');
        updateMetrics(fteData, 'metric-total-fte', 'metric-utilization', 'metric-overtime-hours');
        drawChart('line-chart', clientData, 'line');
        drawChart('bar-chart', clientData, 'bar');
        // Add more chart updates as needed
    }
};

// Placeholder functions (implement as needed)
const updateMetrics = (data, ...ids) => {
    ids.forEach((id, index) => {
        const element = document.getElementById(id);
        if (element) element.querySelector('p').textContent = data[index] || 'Loading...';
    });
};

const drawChart = (id, data, type) => {
    const element = document.getElementById(id);
    if (element) element.querySelector('div').textContent = 'Data Loaded'; // Replace with actual chart rendering
};