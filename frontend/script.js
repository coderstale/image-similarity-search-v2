document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('searchButton');
    const imageIdInput = document.getElementById('imageIdInput');
    const resultsDiv = document.getElementById('results');
    const classNames = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];

    let all3dData = null; 
    let layout = null; 

    const handleSearch = async () => {
        const imageId = imageIdInput.value;
        const maxId = 4999; 
        if (imageId === "" || imageId < 0 || imageId > maxId) {
            resultsDiv.innerHTML = `<div class="text-center col-span-2 text-yellow-500">Please enter a valid ID between 0 and ${maxId}.</div>`;
            return;
        }
        resultsDiv.innerHTML = `<div class="col-span-2 flex justify-center"><div class="loader"></div></div>`;
        try {
            const response = await fetch(`/api/search?id=${imageId}`);
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
            const data = await response.json();
            displayResults(data);
            update3dPlot(data.queryId, data.matchId);
        } catch (error) {
            console.error("Fetch error:", error);
            resultsDiv.innerHTML = `<div class="text-center col-span-2 text-red-500">Error: Could not connect to the C server. Is it running?</div>`;
        }
    };

    searchButton.addEventListener('click', handleSearch);
    imageIdInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handleSearch();
    });

    function displayResults(data) {
        const getImageUrl = (id) => `/images/${id}.png`;
        resultsDiv.innerHTML = `
            <div class="card text-center fade-in">
                <h3 class="text-xl font-bold mb-2">Query Image</h3>
                <img src="${getImageUrl(data.queryId)}" class="rounded-lg shadow-lg mx-auto w-48 h-48 object-cover" alt="Query Image ${data.queryId}">
                <p class="mt-2 text-gray-400">ID: ${data.queryId}</p>
                <p class="text-gray-300">Category: ${classNames[data.queryLabel]}</p>
            </div>
            <div class="card text-center fade-in" style="animation-delay: 100ms;">
                <h3 class="text-xl font-bold mb-2">Most Similar Image Found</h3>
                <img src="${getImageUrl(data.matchId)}" class="rounded-lg shadow-lg mx-auto w-48 h-48 object-cover" alt="Match Image ${data.matchId}">
                <p class="mt-2 text-gray-400">ID: ${data.matchId}</p>
                <p class="text-gray-300">Category: ${classNames[data.matchLabel]}</p>
                <p class="mt-1 text-blue-400 font-bold">Distance: ${data.distance}</p>
            </div>
        `;
    }

    async function drawKdTree() {
        try {
            const response = await fetch('/api/tree-data');
            const treeData = await response.json();
            const width = 600, height = 400, margin = { top: 20, right: 20, bottom: 20, left: 20 };
            const svg = d3.select("#tree-vis").append("svg").attr("viewBox", `0 0 ${width} ${height}`).style("background-color", "#1f2937").style("border-radius", "8px");
            const g = svg.append("g");
            const xScale = d3.scaleLinear().domain([0, 100]).range([margin.left, width - margin.right]);
            const yScale = d3.scaleLinear().domain([100, 0]).range([margin.top, height - margin.bottom]);
            function drawNode(node, xMin, xMax, yMin, yMax) {
                if (!node) return;
                const [px, py] = node.point;
                const axis = node.axis;
                g.append("line").style("stroke-width", 1.5).attr("stroke", axis === 0 ? "#f43f5e" : "#3b82f6").attr("x1", axis === 0 ? xScale(px) : xScale(xMin)).attr("y1", axis === 0 ? yScale(yMin) : yScale(py)).attr("x2", axis === 0 ? xScale(px) : xScale(xMax)).attr("y2", axis === 0 ? yScale(yMax) : yScale(py));
                g.append("circle").attr("cx", xScale(px)).attr("cy", yScale(py)).attr("r", 5).attr("fill", "white");
                if (axis === 0) {
                    drawNode(node.left, xMin, px, yMin, yMax);
                    drawNode(node.right, px, xMax, yMin, yMax);
                } else {
                    drawNode(node.left, xMin, xMax, yMin, py);
                    drawNode(node.right, xMin, xMax, py, yMax);
                }
            }
            drawNode(treeData, 0, 100, 0, 100);
        } catch (error) {
            console.error("Error fetching tree data:", error);
            document.getElementById('tree-vis').innerHTML = `<p class="text-red-500">Could not load tree visualization.</p>`;
        }
    }

    async function initialDraw3dPlot() {
        const plotDiv = document.getElementById('3d-plot');
        plotDiv.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500">Loading 3D plot data...</div>`;
        try {
            const response = await fetch('/api/3d-data');
            const csvData = await response.text();
            all3dData = d3.csvParse(csvData); 

            const plotData = [{
                x: all3dData.map(d => d.x), y: all3dData.map(d => d.y), z: all3dData.map(d => d.z),
                mode: 'markers', type: 'scatter3d',
                marker: { size: 2.5, color: all3dData.map(d => parseInt(d.label)), colorscale: 'Viridis', opacity: 0.7 },
                hovertext: all3dData.map(d => `ID: ${d.id}<br>Category: ${classNames[d.label]}`),
                hoverinfo: 'text'
            }];
            
            layout = {
                title: 'Image Clusters in 3D Space', paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#e5e7eb' },
                scene: {
                    bgcolor: 'rgba(0,0,0,0)',
                    xaxis: { title: 'X', color: '#9ca3af', gridcolor: '#52525b' },
                    yaxis: { title: 'Y', color: '#9ca3af', gridcolor: '#52525b' },
                    zaxis: { title: 'Z', color: '#9ca3af', gridcolor: '#52525b' }
                },
                margin: { l: 0, r: 0, b: 0, t: 40 }
            };
            
            plotDiv.innerHTML = ''; 
            Plotly.newPlot('3d-plot', plotData, layout, {responsive: true});
        } catch (error) {
            console.error("Error fetching/drawing 3D data:", error);
            plotDiv.innerHTML = `<p class="text-red-500">Could not load 3D plot. Did you run generate_3d_coords.py?</p>`;
        }
    }
    
    function update3dPlot(queryId, matchId) {
        if (!all3dData || !layout) return;

        const queryPoint = all3dData.find(d => d.id == queryId);
        const matchPoint = all3dData.find(d => d.id == matchId);

        if (!queryPoint || !matchPoint) return;
        
        const backgroundTrace = {
            x: all3dData.map(d => d.x), y: all3dData.map(d => d.y), z: all3dData.map(d => d.z),
            mode: 'markers', type: 'scatter3d',
            marker: { size: 2, color: all3dData.map(d => parseInt(d.label)), colorscale: 'Viridis', opacity: 0.1 },
            hoverinfo: 'none'
        };

        const highlightTrace = {
            x: [queryPoint.x, matchPoint.x], y: [queryPoint.y, matchPoint.y], z: [queryPoint.z, matchPoint.z],
            mode: 'markers', type: 'scatter3d',
            marker: { size: 6, color: ['#3b82f6', '#ef4444'], opacity: 1 },
            hovertext: [`<b>Query</b><br>ID: ${queryPoint.id}<br>Category: ${classNames[queryPoint.label]}`, `<b>Match</b><br>ID: ${matchPoint.id}<br>Category: ${classNames[matchPoint.label]}`],
            hoverinfo: 'text'
        };

        const lineTrace = {
            x: [queryPoint.x, matchPoint.x], y: [queryPoint.y, matchPoint.y], z: [queryPoint.z, matchPoint.z],
            mode: 'lines', type: 'scatter3d',
            line: { color: 'white', width: 4 },
            hoverinfo: 'none'
        };
        
        Plotly.react('3d-plot', [backgroundTrace, highlightTrace, lineTrace], layout);
    }

    drawKdTree();
    initialDraw3dPlot();
});