function drawChart() {
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", 300)
        .attr("height", 200);

    svg.append("circle")
        .attr("cx", 150)
        .attr("cy", 100)
        .attr("r", 50)
        .attr("fill", "steelblue");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", drawChart);
} else {
    // DOMContentLoaded already fired
    drawChart();
}