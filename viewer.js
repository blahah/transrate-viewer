d3.csv('/test.csv', function(data) {

  // Size parameters.
  var size = 140,
      padding = 10,
      n = 8,
      metrics = ["length", "prop_gc", "gc_skew", "orf_length",
                 "uncovered_bases", "mean_coverage", "in_bridges",
                 "edit_distance_per_base"];

  // Position scales.
  var x = {}, y = {};
  metrics.forEach(function(metric) {
    // Coerce values to numbers.
    data.forEach(function(d) { d[metric] = +d[metric]; });

    var value = function(d) { return d[metric]; },
        domain = [d3.min(data, value), d3.max(data, value)],
        range = [padding / 2, size - padding / 2];
    x[metric] = d3.scale.linear().domain(domain).range(range);
    y[metric] = d3.scale.linear().domain(domain).range(range.reverse());
  });

  // Axes.
  var axis = d3.svg.axis()
      .ticks(5)
      .tickSize(size * n);

  // Brush.
  var brush = d3.svg.brush()
      .on("brushstart", brushstart)
      .on("brush", brush)
      .on("brushend", brushend);

  // Root panel.
  var svg = d3.select("body").append("svg:svg")
      .attr("width", 1800)
      .attr("height", 1400)
    .append("svg:g")
      .attr("transform", "translate(130, 20)");

  var legendDict = {
    true: "CRBB hit",
    false: "no CRBB hit"
  };

  // Legend.
  var legend = svg.selectAll("g.legend")
      .data(["true", "false"])
    .enter().append("svg:g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(-110," + (i * 20 + 594) + ")"; });

  legend.append("svg:circle")
      .attr("class", String)
      .attr("r", 6);

  legend.append("svg:text")
      .attr("x", 12)
      .attr("dy", ".31em")
      .text(function(d) { return legendDict[d]; });

  // X-axis.
  svg.selectAll("g.x.axis")
      .data(metrics)
    .enter().append("svg:g")
      .attr("class", "x axis")
      .attr("transform", function(d, i) { return "translate(" + i * size + ",0)"; })
      .each(function(d) { d3.select(this).call(axis.scale(x[d]).orient("bottom")); });

  // Y-axis.
  svg.selectAll("g.y.axis")
      .data(metrics)
    .enter().append("svg:g")
      .attr("class", "y axis")
      .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
      .each(function(d) { d3.select(this).call(axis.scale(y[d]).orient("right")); });

  // Cell and plot.
  var cell = svg.selectAll("g.cell")
      .data(cross(metrics, metrics))
    .enter().append("svg:g")
      .attr("class", "cell")
      .attr("transform", function(d) { return "translate(" + d.i * size + "," + d.j * size + ")"; })
      .each(plot);

  // Titles for the diagonal.
  cell.filter(function(d) { return d.i == d.j; }).append("svg:text")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) { return d.x; });

  function plot(p) {
    var cell = d3.select(this);

    // Plot frame.
    cell.append("svg:rect")
        .attr("class", "frame")
        .attr("x", padding / 2)
        .attr("y", padding / 2)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Plot dots.
    cell.selectAll("circle")
        .data(data)
      .enter().append("svg:circle")
        .attr("class", function(d) { return d.has_crb; })
        .attr("cx", function(d) { return x[p.x](d[p.x]); })
        .attr("cy", function(d) { return y[p.y](d[p.y]); })
        .attr("r", 1);

    // Plot brush.
    cell.call(brush.x(x[p.x]).y(y[p.y]));
  }

  // Clear the previously-active brush, if any.
  function brushstart(p) {
    if (brush.data !== p) {
      cell.call(brush.clear());
      brush.x(x[p.x]).y(y[p.y]).data = p;
    }
  }

  // Highlight the selected circles.
  function brush(p) {
    var e = brush.extent();
    svg.selectAll(".cell circle").attr("class", function(d) {
      return e[0][0] <= d[p.x] && d[p.x] <= e[1][0]
          && e[0][1] <= d[p.y] && d[p.y] <= e[1][1]
          ? d.has_crb : null;
    });
  }

  // If the brush is empty, select all circles.
  function brushend() {
    if (brush.empty()) svg.selectAll(".cell circle").attr("class", function(d) {
      return d.has_crb;
    });
  }

  function cross(a, b) {
    var c = [], n = a.length, m = b.length, i, j;
    for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
  }

});
