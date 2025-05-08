// Track current theme
let currentTheme = 'light-theme';

// Utility to get responsive dimensions
function getResponsiveDimensions(containerId, defaultWidth = 350, defaultHeight = 250) {
    const container = document.querySelector(containerId);
    const width = container ? container.clientWidth : defaultWidth;
    const height = window.innerWidth <= 768 ? 180 : (window.innerWidth >= 1920 ? 300 : 250);
    return { width, height };
}

// Fetch data from Flask API
async function fetchData() {
    console.log('Fetching data from /api/data...');
    try {
        const response = await fetch('/api/data');
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();
        console.log('Data fetched successfully:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return {};
    }
}

// Theme cycling and chart redraw
function cycleTheme() {
    console.log('Cycling theme...');
    const themes = ['light-theme', 'dark-theme', 'high-contrast-theme', 'pastel-theme', 'solarized-theme'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    currentTheme = themes[nextIndex];
    document.body.className = currentTheme;
    console.log('New theme:', currentTheme);

    // Clear existing charts and redraw
    document.querySelectorAll('.card svg').forEach(svg => svg.remove());
    drawCharts();
}

// Export table to Excel
function exportToExcel() {
    console.log('Exporting data table to Excel...');
    try {
        const table = document.getElementById("data-table-content");
        const wb = XLSX.utils.table_to_book(table, { sheet: "Data Table" });
        XLSX.writeFile(wb, "data_table.xlsx");
        console.log('Excel file exported successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export to Excel. Please ensure the table has data and try again.');
    }
}

// Details panel
function showDetails(data, chartType, overviewText) {
    console.log('Showing details for:', chartType, 'with data:', data);
    const container = document.getElementById("details");
    const overview = document.getElementById("overview-text");
    const tableBody = document.getElementById("data-table-content").querySelector("tbody");
    const altChart = document.getElementById("alt-chart-content");

    // Toggle open state
    if (container.classList.contains("open")) {
        container.classList.remove("open");
        return;
    }

    // Add drag handle if not present
    if (!container.querySelector('.details-drag-handle')) {
        const dragHandle = document.createElement('div');
        dragHandle.className = 'details-drag-handle';
        container.appendChild(dragHandle);

        let startY, initialHeight;
        dragHandle.addEventListener('mousedown', (e) => {
            startY = e.clientY;
            initialHeight = container.offsetHeight;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        });

        function onDrag(e) {
            const deltaY = startY - e.clientY;
            let newHeight = initialHeight + deltaY;
            newHeight = Math.max(20 * 16, Math.min(80 * 16, newHeight)); // Constrain between 20vh and 80vh in pixels
            container.style.height = `${newHeight}px`;
        }

        function stopDrag() {
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
        }
    }

    // Set overview text
    overview.textContent = overviewText;

    // Populate data table
    tableBody.innerHTML = "";
    data.forEach(d => {
        const row = document.createElement("tr");
        const value = typeof d.value === 'string' ? d.value : d.value.toFixed(2);
        row.innerHTML = `<td>${d.label}</td><td>${value}${d.unit ? d.unit : ''}</td>`;
        tableBody.appendChild(row);
    });

    // Draw alternate chart
    altChart.innerHTML = "";
    const svg = d3.select("#alt-chart-content").append("svg").attr("width", "100%").attr("height", 300);
    if (chartType === "line") {
        drawBarChartAlt(svg, data);
    } else if (chartType === "bar") {
        drawLineChartAlt(svg, data);
    } else if (chartType === "pie") {
        drawDonutChartAlt(svg, data);
    } else if (chartType === "area") {
        drawLineChartAlt(svg, data);
    } else if (chartType === "scatter") {
        drawBarChartAlt(svg, data);
    } else if (chartType === "radial") {
        drawGaugeChartAlt(svg, data);
    } else if (chartType === "funnel") {
        drawBarChartAlt(svg, data);
    } else if (chartType === "gauge") {
        drawRadialChartAlt(svg, data);
    } else if (chartType === "donut") {
        drawPieChartAlt(svg, data);
    }

    container.classList.add("open");
}

function closeDetails() {
    console.log('Closing details panel');
    document.getElementById("details").classList.remove("open");
}

function switchTab(tabId) {
    console.log('Switching to tab:', tabId);
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
    document.querySelector(`[onclick="switchTab('${tabId}')"]`).classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

// Tooltip setup
const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

// Draw all charts
async function drawCharts() {
    console.log('Initializing chart rendering...');
    const data = await fetchData();

    // Fallback data if API fails
    const sampleData = data.sampleData || [
        { label: 'Jan', value: 30, unit: 'K' },
        { label: 'Feb', value: 70, unit: 'K' },
        { label: 'Mar', value: 45, unit: 'K' },
        { label: 'Apr', value: 85, unit: 'K' },
        { label: 'May', value: 60, unit: 'K' }
    ];
    const scatterData = data.scatterData || [
        { label: 'Product A', value: 50, secondary: 20 },
        { label: 'Product B', value: 70, secondary: 30 },
        { label: 'Product C', value: 40, secondary: 25 },
        { label: 'Product D', value: 90, secondary: 15 },
        { label: 'Product E', value: 60, secondary: 35 }
    ];
    const funnelData = data.funnelData || [
        { width: 100, label: "Leads", value: 1000 },
        { width: 80, label: "Qualified", value: 800 },
        { width: 60, label: "Proposals", value: 600 },
        { width: 40, label: "Closed", value: 400 }
    ];
    const donutData = data.donutData || [
        { label: 'North', value: 25, unit: '%' },
        { label: 'South', value: 35, unit: '%' },
        { label: 'East', value: 20, unit: '%' },
        { label: 'West', value: 20, unit: '%' }
    ];
    const radialData = data.radialData || [{ label: "Progress", value: "70%", unit: "" }];
    const gaugeData = data.gaugeData || [{ label: "KPI Score", value: "85%", unit: "" }];

    // Validate data
    if (!sampleData.length || !scatterData.length || !funnelData.length || !donutData.length || !radialData.length || !gaugeData.length) {
        console.error('Invalid or empty data, using fallback data');
    }

    // Line Chart
    function drawLineChart() {
        console.log('Drawing line chart with data:', sampleData);
        try {
            const { width, height } = getResponsiveDimensions("#line-chart");
            const svg = d3.select("#line-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

            const x = d3.scalePoint().domain(sampleData.map(d => d.label)).range([40, width - 40]);
            const y = d3.scaleLinear().domain([0, Math.max(...sampleData.map(d => d.value))]).range([height - 40, 40]);

            svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));
            svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y));

            const line = d3.line().x(d => x(d.label)).y(d => y(d.value)).curve(d3.curveMonotoneX);

            svg.append("path")
                .datum(sampleData)
                .attr("fill", "none")
                .attr("stroke", "var(--accent)")
                .attr("stroke-width", 3)
                .attr("d", line)
                .attr("stroke-dasharray", function () { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
                .transition()
                .duration(1500)
                .attr("stroke-dashoffset", 0)
                .on("end", () => {
                    svg.selectAll("circle")
                        .data(sampleData)
                        .enter()
                        .append("circle")
                        .attr("cx", d => x(d.label))
                        .attr("cy", d => y(d.value))
                        .attr("r", 5)
                        .attr("fill", "var(--accent)")
                        .on("mouseover", (event, d) => {
                            tooltip.transition().duration(200).style("opacity", 0.9);
                            tooltip.html(`Month: ${d.label}<br>Revenue: ${d.value}${d.unit}`)
                                .style("left", (event.pageX + 10) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));
                });

            svg.on("click", () => showDetails(sampleData, "line", "Revenue trend over the first five months, measured in thousands."));
        } catch (error) {
            console.error('Error drawing line chart:', error);
        }
    }
    drawLineChart();

    // Bar Chart
    function drawBarChart() {
        console.log('Drawing bar chart with data:', sampleData);
        try {
            const { width, height } = getResponsiveDimensions("#bar-chart");
            const svg = d3.select("#bar-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

            const x = d3.scaleBand().domain(sampleData.map(d => d.label)).range([40, width - 40]).padding(0.2);
            const y = d3.scaleLinear().domain([0, Math.max(...sampleData.map(d => d.value))]).range([height - 40, 40]);

            svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));
            svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y));

            svg.selectAll("rect")
                .data(sampleData)
                .enter()
                .append("rect")
                .attr("x", d => x(d.label))
                .attr("y", d => y(0))
                .attr("width", x.bandwidth())
                .attr("height", 0)
                .attr("fill", "var(--accent)")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Category: ${d.label}<br>Sales: ${d.value}${d.unit}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
                .transition()
                .duration(1200)
                .delay((d, i) => i * 150)
                .attr("y", d => y(d.value))
                .attr("height", d => height - 40 - y(d.value));

            svg.on("click", () => showDetails(sampleData, "bar", "Sales performance across different product categories, measured in thousands."));
        } catch (error) {
            console.error('Error drawing bar chart:', error);
        }
    }
    drawBarChart();

    // Pie Chart
    function drawPieChart() {
        console.log('Drawing pie chart with data:', sampleData);
        try {
            const { width, height } = getResponsiveDimensions("#pie-chart", 300, 250);
            const svg = d3.select("#pie-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);
            const radius = Math.min(width, height) / 2 - 50;
            const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

            const pie = d3.pie().value(d => d.value);
            const arc = d3.arc().innerRadius(0).outerRadius(radius);
            const color = d3.scaleOrdinal(d3.schemeTableau10);

            g.selectAll("path")
                .data(pie(sampleData))
                .enter()
                .append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data.label))
                .attr("opacity", 0)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Segment: ${d.data.label}<br>Share: ${d.data.value}%`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
                .transition()
                .duration(1200)
                .delay((d, i) => i * 150)
                .attr("opacity", 1);

            svg.on("click", () => showDetails(sampleData, "pie", "Market share distribution among key competitors, in percentage."));
        } catch (error) {
            console.error('Error drawing pie chart:', error);
        }
    }
    drawPieChart();

    // Radial Chart
    function drawRadialChart() {
        console.log('Drawing radial chart with data:', radialData);
        try {
            const { width, height } = getResponsiveDimensions("#radial-chart", 300, 250);
            const svg = d3.select("#radial-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);
            const radius = Math.min(width, height) / 2 - 50;
            const arc = d3.arc().innerRadius(radius - 20).outerRadius(radius).startAngle(0);
            const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

            const value = (parseFloat(radialData[0].value) / 100) * Math.PI * 2;

            g.append("path")
                .attr("d", arc({ endAngle: 0 }))
                .attr("fill", "var(--accent)")
                .transition()
                .duration(1500)
                .attrTween("d", () => {
                    return t => arc({ endAngle: t * value });
                });

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .attr("fill", "var(--fg)")
                .text(radialData[0].value);

            svg.on("click", () => showDetails(radialData, "radial", "Completion rate for the current project phase."));
        } catch (error) {
            console.error('Error drawing radial chart:', error);
        }
    }
    drawRadialChart();

    // Funnel Chart
    function drawFunnelChart() {
        console.log('Drawing funnel chart with data:', funnelData);
        try {
            const { width, height } = getResponsiveDimensions("#funnel-chart", 300, 250);
            const svg = d3.select("#funnel-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);
            funnelData.forEach((step, i) => {
                const topW = step.width * (width / 300), bottomW = (funnelData[i + 1]?.width || 20) * (width / 300);
                const y = i * 50;

                const path = `M${(width - topW) / 2},${y} 
                              L${(width + topW) / 2},${y} 
                              L${(width + bottomW) / 2},${y + 40} 
                              L${(width - bottomW) / 2},${y + 40} Z`;

                svg.append("path")
                    .attr("d", path)
                    .attr("fill", `hsl(${i * 45}, 70%, 60%)`)
                    .attr("opacity", 0)
                    .on("mouseover", (event) => {
                        tooltip.transition().duration(200).style("opacity", 0.9);
                        tooltip.html(`Stage: ${step.label}<br>Count: ${step.value}`)
                            .style("left", (event.pageX + 10) + "px")
                            .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
                    .transition()
                    .duration(1200)
                    .delay(i * 150)
                    .attr("opacity", 1);
            });

            svg.on("click", () => showDetails(funnelData, "funnel", "Sales funnel progression from leads to closed deals."));
        } catch (error) {
            console.error('Error drawing funnel chart:', error);
        }
    }
    drawFunnelChart();

    // Area Chart
    function drawAreaChart() {
        console.log('Drawing area chart with data:', sampleData);
        try {
            const { width, height } = getResponsiveDimensions("#area-chart");
            const svg = d3.select("#area-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

            const x = d3.scalePoint().domain(sampleData.map(d => d.label)).range([40, width - 40]);
            const y = d3.scaleLinear().domain([0, Math.max(...sampleData.map(d => d.value))]).range([height - 40, 40]);

            svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));
            svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y));

            const area = d3.area()
                .x(d => x(d.label))
                .y0(height - 40)
                .y1(d => y(d.value))
                .curve(d3.curveMonotoneX);

            svg.append("path")
                .datum(sampleData)
                .attr("fill", "var(--accent)")
                .attr("opacity", 0.5)
                .attr("d", area)
                .attr("stroke", "var(--accent)")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", function () { return this.getTotalLength(); })
                .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
                .transition()
                .duration(1500)
                .attr("stroke-dashoffset", 0);

            svg.selectAll("circle")
                .data(sampleData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.label))
                .attr("cy", d => y(d.value))
                .attr("r", 5)
                .attr("fill", "var(--accent)")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Month: ${d.label}<br>Users: ${d.value}${d.unit}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0));

            svg.on("click", () => showDetails(sampleData, "area", "User growth trend over the first five months, measured in thousands."));
        } catch (error) {
            console.error('Error drawing area chart:', error);
        }
    }
    drawAreaChart();

    // Scatter Chart
    function drawScatterChart() {
        console.log('Drawing scatter chart with data:', scatterData);
        try {
            const { width, height } = getResponsiveDimensions("#scatter-chart");
            const svg = d3.select("#scatter-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);

            const x = d3.scaleLinear().domain([0, Math.max(...scatterData.map(d => d.value))]).range([40, width - 40]);
            const y = d3.scaleLinear().domain([0, Math.max(...scatterData.map(d => d.secondary))]).range([height - 40, 40]);

            svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x).ticks(5));
            svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y).ticks(5));

            svg.selectAll("circle")
                .data(scatterData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.value))
                .attr("cy", d => y(d.secondary))
                .attr("r", 0)
                .attr("fill", "var(--accent)")
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Product: ${d.label}<br>Primary: ${d.value}<br>Secondary: ${d.secondary}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
                .transition()
                .duration(1200)
                .delay((d, i) => i * 150)
                .attr("r", 8);

            svg.on("click", () => showDetails(scatterData, "scatter", "Performance metrics comparing primary and secondary KPIs."));
        } catch (error) {
            console.error('Error drawing scatter chart:', error);
        }
    }
    drawScatterChart();

    // Gauge Chart
    function drawGaugeChart() {
        console.log('Drawing gauge chart with data:', gaugeData);
        try {
            const { width, height } = getResponsiveDimensions("#gauge-chart", 300, 250);
            const svg = d3.select("#gauge-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);
            const radius = Math.min(width, height) / 2 - 50;
            const arc = d3.arc().innerRadius(radius - 20).outerRadius(radius).startAngle(-Math.PI / 2);
            const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

            const value = (parseFloat(gaugeData[0].value) / 100) * Math.PI;

            g.append("path")
                .attr("d", arc({ endAngle: Math.PI / 2 }))
                .attr("fill", "var(--hover)");

            g.append("path")
                .attr("d", arc({ endAngle: -Math.PI / 2 }))
                .attr("fill", "var(--accent)")
                .transition()
                .duration(1500)
                .attrTween("d", () => {
                    return t => arc({ endAngle: -Math.PI / 2 + t * value });
                });

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .attr("fill", "var(--fg)")
                .text(gaugeData[0].value);

            svg.on("click", () => showDetails(gaugeData, "gauge", "Overall KPI achievement score."));
        } catch (error) {
            console.error('Error drawing gauge chart:', error);
        }
    }
    drawGaugeChart();

    // Donut Chart
    function drawDonutChart() {
        console.log('Drawing donut chart with data:', donutData);
        try {
            const { width, height } = getResponsiveDimensions("#donut-chart", 300, 250);
            const svg = d3.select("#donut-chart").append("svg").attr("viewBox", `0 0 ${width} ${height}`);
            const radius = Math.min(width, height) / 2 - 50;
            const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

            const pie = d3.pie().value(d => d.value);
            const arc = d3.arc().innerRadius(radius / 2).outerRadius(radius);
            const color = d3.scaleOrdinal(d3.schemeTableau10);

            g.selectAll("path")
                .data(pie(donutData))
                .enter()
                .append("path")
                .attr("d", arc)
                .attr("fill", d => color(d.data.label))
                .attr("opacity", 0)
                .on("mouseover", (event, d) => {
                    tooltip.transition().duration(200).style("opacity", 0.9);
                    tooltip.html(`Region: ${d.data.label}<br>Sales: ${d.data.value}${d.data.unit}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
                .transition()
                .duration(1200)
                .delay((d, i) => i * 150)
                .attr("opacity", 1);

            svg.on("click", () => showDetails(donutData, "donut", "Sales distribution across regions, in percentage."));
        } catch (error) {
            console.error('Error drawing donut chart:', error);
        }
    }
    drawDonutChart();
}

// Alternate charts (used in details panel)
function drawLineChartAlt(svg, data) {
    console.log('Drawing alternate line chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const x = d3.scalePoint().domain(data.map(d => d.label)).range([40, width - 40]);
        const y = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.value))]).range([height - 40, 40]);

        svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));
        svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y));

        const line = d3.line().x(d => x(d.label)).y(d => y(d.value)).curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "var(--accent)")
            .attr("stroke-width", 3)
            .attr("d", line);
    } catch (error) {
        console.error('Error drawing alternate line chart:', error);
    }
}

function drawBarChartAlt(svg, data) {
    console.log('Drawing alternate bar chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);

        const x = d3.scaleBand().domain(data.map(d => d.label)).range([40, width - 40]).padding(0.2);
        const y = d3.scaleLinear().domain([0, Math.max(...data.map(d => d.value))]).range([height - 40, 40]);

        svg.append("g").attr("transform", `translate(0, ${height - 40})`).call(d3.axisBottom(x));
        svg.append("g").attr("transform", `translate(40, 0)`).call(d3.axisLeft(y));

        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", d => x(d.label))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => height - 40 - y(d.value))
            .attr("fill", "var(--accent)");
    } catch (error) {
        console.error('Error drawing alternate bar chart:', error);
    }
}

function drawPieChartAlt(svg, data) {
    console.log('Drawing alternate pie chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        const radius = Math.min(width, height) / 2 - 50;
        const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(0).outerRadius(radius);
        const color = d3.scaleOrdinal(d3.schemeTableau10);

        g.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label));
    } catch (error) {
        console.error('Error drawing alternate pie chart:', error);
    }
}

function drawDonutChartAlt(svg, data) {
    console.log('Drawing alternate donut chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        const radius = Math.min(width, height) / 2 - 50;
        const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

        const pie = d3.pie().value(d => d.value);
        const arc = d3.arc().innerRadius(radius / 2).outerRadius(radius);
        const color = d3.scaleOrdinal(d3.schemeTableau10);

        g.selectAll("path")
            .data(pie(data))
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.label));
    } catch (error) {
        console.error('Error drawing alternate donut chart:', error);
    }
}

function drawGaugeChartAlt(svg, data) {
    console.log('Drawing alternate gauge chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        const radius = Math.min(width, height) / 2 - 50;
        const arc = d3.arc().innerRadius(radius - 20).outerRadius(radius).startAngle(-Math.PI / 2);
        const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

        const value = (parseFloat(data[0].value) / 100) * Math.PI;

        g.append("path")
            .attr("d", arc({ endAngle: Math.PI / 2 }))
            .attr("fill", "var(--hover)");

        g.append("path")
            .attr("d", arc({ endAngle: -Math.PI / 2 }))
            .attr("fill", "var(--accent)")
            .transition()
            .duration(1000)
            .attrTween("d", () => {
                return t => arc({ endAngle: -Math.PI / 2 + t * value });
            });

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("fill", "var(--fg)")
            .text(data[0].value);
    } catch (error) {
        console.error('Error drawing alternate gauge chart:', error);
    }
}

function drawRadialChartAlt(svg, data) {
    console.log('Drawing alternate radial chart with data:', data);
    try {
        const width = window.innerWidth <= 768 ? 300 : 400;
        const height = window.innerWidth <= 768 ? 200 : 300;
        svg.attr("viewBox", `0 0 ${width} ${height}`);
        const radius = Math.min(width, height) / 2 - 50;
        const g = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

        const value = (parseFloat(data[0].value) / 100) * Math.PI * 2;

        g.append("path")
            .attr("d", arc({ endAngle: value }))
            .attr("fill", "var(--accent)");

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("fill", "var(--fg)")
            .text(data[0].value);
    } catch (error) {
        console.error('Error drawing alternate radial chart:', error);
    }
}

// Initialize charts on page load and on window resize
function initializeCharts() {
    document.querySelectorAll('.card svg').forEach(svg => svg.remove());
    drawCharts();
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Add event listeners
document.addEventListener('DOMContentLoaded', initializeCharts);
window.addEventListener('resize', debounce(initializeCharts, 200));