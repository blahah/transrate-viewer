var data = null
  , size = 140
  , padding = 10
  , metrics = []
  , defaultMetrics = ['length', 'orf_length', 'linguistic_complexity_6']
  , n = metrics.length
  , axis = null
  , brush = null
  , svg = null
  , x = {}
  , xs = {}
  , y = {}
  , data = []
  , cell = null;

var setVariables = function() {
  var allMetrics = Object.keys(data[0]);
  var form = d3.select("#var-selector").selectAll("div")
    .data(allMetrics)
    .enter()
    .append("tr")
      .attr("class", "cb");
  var cbs = d3.selectAll(".cb");
  cbs.append("td")
    .append("input")
      .attr("type", "checkbox")
      .attr("id", function(d) { return d; })
      .attr("class", "metric-checkbox")
      .attr("checked", function(d) {
        return (defaultMetrics.indexOf(d) >= 0) ? "true" : null;
      })
      .attr("onChange", "updateAll();")
      .attr("value", "");
  cbs.append("td")
    .text(function(d) { return ' ' + d.replace(/_/g, " "); });
  updateMetrics();
}

function drawPanels() {
  // Axes.
  axis = d3.svg.axis()
    .ticks(5)
    .tickSize(size * n);

  // Root panel.
  svg = d3.select("#plot").append("svg:svg")
      .attr("width", 1800)
      .attr("height", 1400)
    .append("svg:g")
      .attr("transform", "translate(20, 20)");
}

function cross(a, b) {
  var c = [], n = a.length, m = b.length, i, j;
  for (i = -1; ++i < n;) for (j = -1; ++j < m;) {
    c.push({x: a[i], i: i, y: b[j], j: j});
  }
  return c;
}

function crossIdentity(d) {
  return d.x + ":" + d.y;
}

var drawLegend = function() {
  // Legend.
  var legendDict = {
    true: "CRBB hit",
    false: "no CRBB hit"
  };

  var legend = d3.select("#legend-table")
    .selectAll("tr")
    .data(["true", "false"])
    .enter().append("tr");

  legend.append("td")
    .append("svg:svg")
      .attr("width", 20)
      .attr("height", 20)
    .append("svg:g")
      .attr("transform", "translate(10, 10)")
      .attr("class", "legend")
    .append("svg:circle")
      .attr("class", function(d) { return d; })
      .attr("r", 6);

  legend.append("td")
    .text(function(d) { return legendDict[d]; });
}

function updateMetrics() {
  metrics = [];
  d3.selectAll('.metric-checkbox')
    .filter(':checked')
    .each(function() {
      metrics.push(d3.select(this).attr('id'));
    });
  n = metrics.length;
}

function updateScales() {
  // Position scales.
  metrics.forEach(function(metric) {
    // Coerce values to numbers.
    data.forEach(function(d) { d[metric] = +d[metric]; });

    var value = function(d) { return d[metric]; },
        domain = [d3.min(data, value), d3.max(data, value)],
        range = [padding / 2, size - padding / 2];
    x[metric] = d3.scale.linear().domain(domain).range(range);
    xs[metric] = d3.scale.linear().domain(domain).range(range.reverse());
    y[metric] = d3.scale.linear().domain(domain.reverse()).range(range.reverse());
  });
}

function updatePlots() {

  // Brush.
  brush = d3.svg.brush()
    .on("brushstart", brushstart)
    .on("brush", brush)
    .on("brushend", brushend);

  axis.tickSize(size * n);

  // X-axis.
  var xaxis = svg.selectAll("g.x.axis")
    .data(metrics, function(d) { return d; });
  // move existing
  xaxis.attr("transform", function(d, i) {
      return "translate(" + i * size + "," + 0 * size + ")";
    })
    .each(function(d) {
      d3.select(this).call(axis.scale(xs[d]).orient("bottom"));
    })
    .selectAll('text')
    .each(function() {
      var t = d3.select(this);
      t.attr("transform", "rotate(-90, 0, " + size * n + ")");
    })
    .attr("dy", "-0em");

  // add new
  xaxis.enter().append("svg:g")
    .attr("class", "x axis")
    .attr("transform", function(d, i) {
      return "translate(" + i * size + "," + 0 * size + ")";
    })
    .each(function(d) {
      d3.select(this).call(axis.scale(xs[d]).orient("bottom"));
    })
    .selectAll('text')
    .each(function(d, i) {
      var t = d3.select(this);
      t.attr("transform", "rotate(-90, 0, " + (size*n) + ")");
    })
    .attr("dy", "-0em")
    .style("text-anchor", "end");

  // remove old
  xaxis.exit().remove();

  // Y-axis.
  var yaxis = svg.selectAll("g.y.axis")
    .data(metrics, function(d) { return d; });
  // move existing
  yaxis.attr("transform", function(d, i) {
      return "translate(0," + i * size + ")";
    })
    .each(function(d) {
      d3.select(this).call(axis.scale(y[d]).orient("right"));
    });
  // add new
  yaxis.enter().append("svg:g")
    .attr("class", "y axis")
    .attr("transform", function(d, i) {
      return "translate(0," + i * size + ")";
    })
    .each(function(d) {
      d3.select(this).call(axis.scale(y[d]).orient("right"));
    });
  // remove old
  yaxis.exit().remove();

  // Cell and plot.
  var cell = svg.selectAll("g.cell")
    .data(cross(metrics, metrics), crossIdentity);

  // move existing plots to their new grid position
  cell.transition()
    .attr("transform", function(d) {
      return "translate(" + d.i * size + "," + d.j * size + ")";
    });

  // update text labels
  cell.selectAll("svg text.diag-label")
    .transition()
    .text(function(d) {
      return (d.i == d.j) ? d.x.replace(/_/g, ' ') : ''; }
    );

  // create new cells
  var cellEnter = cell.enter();

  cellEnter.append("svg:g")
    .attr("class", "cell")
    .attr("transform", function(d) {
      return "translate(" + d.i * size + "," + d.j * size + ")";
    })
    .each(plot)
    .append("svg:text")
      .attr("class", "diag-label")
      .attr("x", padding)
      .attr("y", padding)
      .attr("dy", ".71em")
      .text(function(d) {
        return (d.i == d.j) ? d.x.replace(/_/g, ' ')  : '';
      });

  // remove old ones
  cell.exit().remove();

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
    var dots = cell.selectAll("circle")
    dots.data(data)
      .enter().append("svg:circle")
      .attr("class", function(d) { return d.has_crb; })
      .transition().delay(function(d, i) { return i * 5; }).duration(600  )
      .attr("cx", function(d) { return x[p.x](d[p.x]); })
      .attr("cy", function(d) { return y[p.y](d[p.y]); })
      .attr("r", 2);
    dots.data(data).exit().remove();

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
    if (brush.empty()) {
      svg.selectAll(".cell circle").attr("class", function(d) {
        return d.has_crb;
      });
    }
  }

}

function loadCsv(csvfile) {
  d3.csv(csvfile, function(csvData) {
    data = csvData;
    drawPlot();
  });
}

var drawPlot = function() {
  setVariables();
  drawLegend();
  updateScales();
  drawPanels();
  updatePlots();
}

function updateAll() {
  updateMetrics();
  updateScales();
  updatePlots();
}

loadCsv('/test.csv');
